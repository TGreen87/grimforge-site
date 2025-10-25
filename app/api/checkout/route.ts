import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog, createPaymentAuditLog } from '@/lib/audit-logger'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json()
    const variant_id: string | undefined = typeof body?.variant_id === 'string' ? body.variant_id : undefined
    const quantity: number | undefined =
      typeof body?.quantity === 'number' && Number.isFinite(body.quantity) ? body.quantity : undefined
    const items = Array.isArray(body?.items)
      ? body.items.filter(
          (entry): entry is { variant_id: string; quantity: number } =>
            entry &&
            typeof entry === 'object' &&
            typeof entry.variant_id === 'string' &&
            typeof entry.quantity === 'number' &&
            entry.quantity > 0,
        )
      : undefined

    const customerInput = (body?.customer && typeof body.customer === 'object') ? body.customer as Record<string, unknown> : {}

    // Validate input
    if (items && items.length > 0) {
      // All multi-item entries have already been filtered to the required shape above.
    } else if (!variant_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid variant_id or quantity' },
        { status: 400 }
      )
    }

    // Initialize Supabase service client (bypasses RLS)
    const supabase = createServiceClient()

    // Helper to fetch a single variant with product+inventory
    const fetchVariant = async (vid: string) => {
      const { data, error } = await supabase
        .from('variants')
        .select(`
          *,
          product:products!inner(
            id,
            title,
            artist,
            image,
            active,
            stock
          ),
          inventory!inner(
            available
          )
        `)
        .eq('id', vid)
        .single()
      return { data, error }
    }

    // Build order items list (supports single or multiple)
    const orderItems: Array<{ v: any; qty: number }> = []
    if (items && items.length > 0) {
      for (const it of items) {
        const { data: v, error } = await fetchVariant(it.variant_id)
        if (error || !v) {
          await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.variant_not_found', error: error?.message, metadata: { variant_id: it.variant_id } }))
          return NextResponse.json({ error: 'One or more items not found' }, { status: 404 })
        }
        if (!v.product.active) {
          await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.product_inactive', metadata: { variant_id: it.variant_id, product_id: v.product.id } }))
          return NextResponse.json({ error: 'Product is not available' }, { status: 400 })
        }
        const available = Array.isArray((v as any).inventory) ? ((v as any).inventory[0]?.available ?? 0) : ((v as any).inventory?.available ?? 0)
        if (available < it.quantity) {
          await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.insufficient_inventory', metadata: { variant_id: it.variant_id, requested_quantity: it.quantity, available_quantity: available } }))
          return NextResponse.json({ error: 'Insufficient inventory' }, { status: 400 })
        }
        orderItems.push({ v, qty: it.quantity })
      }
    } else {
      // Single item flow (back-compat)
      const { data: v, error } = await fetchVariant(variant_id as string)
      if (error || !v) {
        await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.variant_not_found', error: error?.message, metadata: { variant_id } }))
        return NextResponse.json({ error: 'Product variant not found' }, { status: 404 })
      }
      if (!v.product.active) {
        await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.product_inactive', metadata: { variant_id, product_id: v.product.id } }))
        return NextResponse.json({ error: 'Product is not available for purchase' }, { status: 400 })
      }
      const available = Array.isArray((v as any).inventory) ? ((v as any).inventory[0]?.available ?? 0) : ((v as any).inventory?.available ?? 0)
      if (available < (quantity as number)) {
        await writeAuditLog(createPaymentAuditLog({ eventType: 'checkout.insufficient_inventory', metadata: { variant_id, requested_quantity: quantity, available_quantity: available } }))
        return NextResponse.json({ error: 'Insufficient inventory available' }, { status: 400 })
      }
      orderItems.push({ v, qty: quantity as number })
    }

    // Note: inventory availability is validated per item above

    const rawEmail =
      (typeof body?.email === 'string' && body.email.trim().length > 0 ? body.email : null) ??
      (typeof customerInput?.email === 'string' && (customerInput.email as string).trim().length > 0
        ? (customerInput.email as string)
        : null)

    if (!rawEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 })
    }

    const customerEmail = rawEmail.trim().toLowerCase()

    const customerProfile = {
      first_name: typeof customerInput?.first_name === 'string' ? (customerInput.first_name as string) : null,
      last_name: typeof customerInput?.last_name === 'string' ? (customerInput.last_name as string) : null,
      phone: typeof customerInput?.phone === 'string' ? (customerInput.phone as string) : null,
      shipping_address:
        typeof customerInput?.shipping_address === 'object' && customerInput.shipping_address !== null
          ? customerInput.shipping_address
          : typeof body?.shipping_address === 'object'
            ? body.shipping_address
            : null,
      billing_address:
        typeof customerInput?.billing_address === 'object' && customerInput.billing_address !== null
          ? customerInput.billing_address
          : null,
      marketing_opt_in: typeof customerInput?.marketing_opt_in === 'boolean' ? customerInput.marketing_opt_in : false,
      notes: typeof customerInput?.notes === 'string' ? (customerInput.notes as string) : null,
    }

    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle()

    let customerId: string | null = existingCustomer?.id ?? null

    if (customerId) {
      await supabase
        .from('customers')
        .update({
          ...customerProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId)
    } else {
      const { data: insertedCustomer, error: insertCustomerError } = await supabase
        .from('customers')
        .insert({
          email: customerEmail,
          ...customerProfile,
        })
        .select('id')
        .single()

      if (insertCustomerError) {
        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'checkout.customer_upsert_failed',
            error: insertCustomerError.message,
            metadata: { email: customerEmail },
          }),
        )
        return NextResponse.json({ error: 'Failed to create customer profile' }, { status: 500 })
      }

      customerId = insertedCustomer?.id ?? null
    }

    // 2. Create pending order in database
    const orderNumber = `ORR-${Date.now().toString().slice(-6)}`
    const subtotal = orderItems.reduce((s, it) => s + (it.v.price * it.qty), 0)
    const total = subtotal // Tax and shipping will be calculated by Stripe

    const orderMetadataBase: Record<string, unknown> = {
      items: orderItems.map((it) => ({ variant_id: it.v.id, quantity: it.qty })),
      created_via: 'api',
      customer: {
        email: customerEmail,
        first_name: customerProfile.first_name,
        last_name: customerProfile.last_name,
        phone: customerProfile.phone,
      },
      shipping: typeof customerProfile.shipping_address === 'object' ? customerProfile.shipping_address : undefined,
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: uuidv4(),
        order_number: orderNumber,
        email: customerEmail,
        customer_id: customerId,
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        total,
        currency: STRIPE_CONFIG.currency,
        metadata: orderMetadataBase,
      })
      .select()
      .single()

    if (orderError || !order) {
      await writeAuditLog(
        createPaymentAuditLog({
          eventType: 'checkout.order_creation_failed',
          error: orderError?.message || 'Failed to create order',
          metadata: { variant_id, quantity },
        })
      )
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    // Add order item
    const { error: itemError } = await supabase
      .from('order_items')
      .insert(orderItems.map(({ v, qty }) => ({
        order_id: order.id,
        variant_id: v.id,
        product_name: v.product.title,
        variant_name: v.name,
        quantity: qty,
        price: v.price,
        total: v.price * qty,
      })))

    if (itemError) {
      // Clean up order if item creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      
      await writeAuditLog(
        createPaymentAuditLog({
          eventType: 'checkout.order_item_creation_failed',
          error: itemError.message,
          orderId: order.id,
        })
      )
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      )
    }

    // 3. Create Stripe Checkout Session
    const siteUrl = process.env.SITE_URL_STAGING || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    // Generate idempotency key for this checkout session
    const idempotencyKey = `checkout_${order.id}_${Date.now()}`

    const stripe = getStripe()

    // Determine shipping options: allow client-selected shipping (e.g., AusPost)
    let shippingOptions = STRIPE_CONFIG.shippingOptions
    const shippingRateData = (body as any)?.shipping_rate_data
    const shipping = (body as any)?.shipping as undefined | {
      display_name?: string
      amount_cents?: number
      currency?: string
      eta_min_days?: number
      eta_max_days?: number
    }
    if (shippingRateData && typeof shippingRateData === 'object') {
      shippingOptions = [{ shipping_rate_data: shippingRateData } as any]
    } else if (shipping && typeof shipping.amount_cents === 'number' && shipping.display_name) {
      shippingOptions = [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: { amount: Math.max(0, Math.floor(shipping.amount_cents)), currency: (shipping.currency || STRIPE_CONFIG.currency) },
          display_name: shipping.display_name,
          delivery_estimate: shipping.eta_min_days || shipping.eta_max_days ? {
            minimum: shipping.eta_min_days ? { unit: 'business_day', value: shipping.eta_min_days } : undefined,
            maximum: shipping.eta_max_days ? { unit: 'business_day', value: shipping.eta_max_days } : undefined,
          } : undefined,
        },
      } as any]
    }

    const session = await stripe.checkout.sessions.create(
      {
        line_items: orderItems.map(({ v, qty }) => ({
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: `${v.product.title} - ${v.name}`,
              description: v.product.artist ? `By ${v.product.artist}` : undefined,
              images: v.product.image ? [v.product.image] : undefined,
              metadata: {
                variant_id: v.id,
                product_id: v.product.id,
              },
            },
            unit_amount: Math.round(v.price * 100),
          },
          quantity: qty,
        })),
        mode: 'payment',
        automatic_tax: {
          enabled: true, // Enable Stripe Tax for Australian GST
        },
        shipping_address_collection: {
          allowed_countries: STRIPE_CONFIG.allowedCountries,
        },
        shipping_options: shippingOptions,
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart?cancelled=true`,
        metadata: {
          order_id: order.id,
          items: JSON.stringify(orderItems.map(it => ({ variant_id: it.v.id, quantity: it.qty }))),
        },
        customer_email: customerEmail,
        payment_intent_data: {
          metadata: {
            order_id: order.id,
            items: JSON.stringify(orderItems.map(it => ({ variant_id: it.v.id, quantity: it.qty }))),
          },
        },
        locale: 'en',
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expire after 30 minutes
      },
      {
        idempotencyKey,
      }
    )

    // Update order with Stripe session ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        metadata: {
          ...((order as any).metadata && typeof (order as any).metadata === 'object' && !Array.isArray((order as any).metadata)
            ? ((order as any).metadata as Record<string, unknown>)
            : {}),
          stripe_session_url: session.url,
          stripe_session_expires_at: session.expires_at,
        },
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order with Stripe session:', updateError)
    }

    // Log successful checkout session creation
    await writeAuditLog(
      createPaymentAuditLog({
        eventType: 'checkout.session_created',
        orderId: order.id,
        stripeSessionId: session.id,
        amount: subtotal,
        currency: STRIPE_CONFIG.currency,
        metadata: {
          items: orderItems.map(it => ({ variant_id: it.v.id, quantity: it.qty })),
          order_number: orderNumber,
        },
      })
    )

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Checkout error:', error)
    
    await writeAuditLog(
      createPaymentAuditLog({
        eventType: 'checkout.error',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    )

    const message = error instanceof Error ? error.message : 'Failed to create checkout session'

    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        detail: message,
      },
      { status: 500 }
    )
  }
}
