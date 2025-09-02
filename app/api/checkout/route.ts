import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog, createPaymentAuditLog } from '@/lib/audit-logger'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { variant_id, quantity } = await req.json()

    // Validate input
    if (!variant_id || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid variant_id or quantity' },
        { status: 400 }
      )
    }

    // Initialize Supabase service client (bypasses RLS)
    const supabase = createServiceClient()

    // 1. Fetch variant details from database
    const { data: variant, error: variantError } = await supabase
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
      .eq('id', variant_id)
      .single()

    if (variantError || !variant) {
      await writeAuditLog(
        createPaymentAuditLog({
          eventType: 'checkout.variant_not_found',
          error: variantError?.message || 'Variant not found',
          metadata: { variant_id, quantity },
        })
      )
      return NextResponse.json(
        { error: 'Product variant not found' },
        { status: 404 }
      )
    }

    // Check if product is active
    if (!variant.product.active) {
      await writeAuditLog(
        createPaymentAuditLog({
          eventType: 'checkout.product_inactive',
          metadata: { variant_id, product_id: variant.product.id },
        })
      )
      return NextResponse.json(
        { error: 'Product is not available for purchase' },
        { status: 400 }
      )
    }

    // Check inventory availability (handle potential array shape from join)
    const available = Array.isArray((variant as any).inventory)
      ? ((variant as any).inventory[0]?.available ?? 0)
      : ((variant as any).inventory?.available ?? 0)

    if (available < quantity) {
      await writeAuditLog(
        createPaymentAuditLog({
          eventType: 'checkout.insufficient_inventory',
          metadata: {
            variant_id,
            requested_quantity: quantity,
            available_quantity: available,
          },
        })
      )
      return NextResponse.json(
        { error: 'Insufficient inventory available' },
        { status: 400 }
      )
    }

    // 2. Create pending order in database
    const orderNumber = `ORR-${Date.now().toString().slice(-6)}`
    const subtotal = variant.price * quantity
    const total = subtotal // Tax and shipping will be calculated by Stripe

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: uuidv4(),
        order_number: orderNumber,
        email: '', // Will be filled by Stripe
        status: 'pending',
        payment_status: 'pending',
        subtotal,
        total,
        currency: STRIPE_CONFIG.currency,
        metadata: {
          variant_id,
          quantity,
          created_via: 'api',
        },
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
      .insert({
        order_id: order.id,
        variant_id: variant.id,
        product_name: variant.product.title,
        variant_name: variant.name,
        quantity,
        price: variant.price,
        total: variant.price * quantity,
      })

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
    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price_data: {
              currency: STRIPE_CONFIG.currency,
              product_data: {
                name: `${variant.product.title} - ${variant.name}`,
                description: `By ${variant.product.artist}`,
                images: variant.product.image ? [variant.product.image] : undefined,
                metadata: {
                  variant_id: variant.id,
                  product_id: variant.product.id,
                },
              },
              unit_amount: Math.round(variant.price * 100), // Convert to cents
            },
            quantity,
          },
        ],
        mode: 'payment',
        automatic_tax: {
          enabled: true, // Enable Stripe Tax for Australian GST
        },
        shipping_address_collection: {
          allowed_countries: STRIPE_CONFIG.allowedCountries,
        },
        shipping_options: STRIPE_CONFIG.shippingOptions,
        customer_email: undefined, // Let Stripe collect this
        billing_address_collection: 'required',
        phone_number_collection: {
          enabled: true,
        },
        success_url: `${siteUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/cart?cancelled=true`,
        metadata: {
          order_id: order.id,
          variant_id: variant.id,
          quantity: quantity.toString(),
        },
        payment_intent_data: {
          metadata: {
            order_id: order.id,
            variant_id: variant.id,
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
          variant_id,
          quantity,
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

    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
