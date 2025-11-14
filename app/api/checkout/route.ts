import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe, STRIPE_CONFIG } from '@/lib/stripe'

export const runtime = 'nodejs'

function resolveBaseUrl() {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL
    || process.env.SITE_URL_STAGING
    || process.env.URL
    || process.env.DEPLOY_URL
    || process.env.NETLIFY_URL
    || process.env.NEXT_PUBLIC_NETLIFY_URL
    || 'https://dev-stripe--obsidianriterecords.netlify.app'

  return candidate.startsWith('http') ? candidate : `https://${candidate}`
}

function centsFromPrice(value: number | string | null) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value * 100)
  const parsed = typeof value === 'string' ? Number(value) : 0
  return Math.round(parsed * 100)
}

function normalizeInventory(relationship: any) {
  if (!relationship) return null
  if (Array.isArray(relationship)) return relationship[0] ?? null
  return relationship
}

export async function POST(req: NextRequest) {
  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  const email = typeof payload?.email === 'string' ? payload.email.trim() : ''
  const itemsInput = Array.isArray(payload?.items) ? payload.items : []

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  if (!itemsInput.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const normalizedItems = itemsInput
    .map((item: any) => ({
      variantId: typeof item?.variantId === 'string' ? item.variantId : null,
      quantity: Number.isFinite(item?.quantity) ? Math.floor(Number(item.quantity)) : 0,
    }))
    .filter((item) => item.variantId && item.quantity > 0) as { variantId: string; quantity: number }[]

  if (!normalizedItems.length) {
    return NextResponse.json({ error: 'No valid items were provided' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: variants, error: variantsError } = await supabase
    .from('variants')
    .select('id, product_id, name, price, products(title, image), inventory:inventory(available)')
    .in('id', normalizedItems.map((item) => item.variantId))

  if (variantsError) {
    console.error('Checkout variant fetch error', variantsError)
    return NextResponse.json({ error: 'Unable to load products right now.', detail: variantsError.message }, { status: 500 })
  }

  const variantMap = new Map<string, any>()
  variants?.forEach((variant) => {
    variantMap.set(variant.id, variant)
  })

  if (!variantMap.size) {
    return NextResponse.json({ error: 'Products are unavailable. Refresh and try again.' }, { status: 400 })
  }

  const validatedItems = [] as {
    variant: any
    quantity: number
    unitAmount: number
    displayName: string
    image?: string | null
  }[]

  let subtotalCents = 0

  for (const item of normalizedItems) {
    const variant = variantMap.get(item.variantId)
    if (!variant) {
      return NextResponse.json({ error: 'One of your items is no longer available.' }, { status: 400 })
    }
    const inventory = normalizeInventory(variant?.inventory)
    const available = Number(inventory?.available ?? Number.POSITIVE_INFINITY)
    if (Number.isFinite(available) && available < item.quantity) {
      return NextResponse.json({ error: 'Not enough stock for one of your selected formats.' }, { status: 400 })
    }

    const unitAmount = centsFromPrice(variant.price)
    if (unitAmount <= 0) {
      return NextResponse.json({ error: 'Invalid pricing detected for your cart.' }, { status: 400 })
    }

    subtotalCents += unitAmount * item.quantity
    validatedItems.push({
      variant,
      quantity: item.quantity,
      unitAmount,
      displayName: variant.products?.title || variant.name || 'Release',
      image: variant.products?.image || null,
    })
  }

  if (!validatedItems.length) {
    return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      email,
      status: 'pending',
      payment_status: 'pending',
      subtotal: subtotalCents / 100,
      shipping: 0,
      tax: 0,
      total: subtotalCents / 100,
      currency: STRIPE_CONFIG.currency,
      metadata: {
        source: 'web_checkout',
        env: process.env.NODE_ENV,
        branch: process.env.NETLIFY_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || 'dev_stripe',
      },
    })
    .select('id, metadata')
    .single()

  if (orderError || !order?.id) {
    console.error('Failed to create order', orderError)
    return NextResponse.json({ error: 'Unable to create order.' }, { status: 500 })
  }

  const orderItemsPayload = validatedItems.map((item) => ({
    order_id: order.id,
    variant_id: item.variant.id,
    product_name: item.displayName,
    variant_name: item.variant.name || item.displayName,
    quantity: item.quantity,
    price: item.unitAmount / 100,
    total: (item.unitAmount / 100) * item.quantity,
  }))

  const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsPayload)
  if (orderItemsError) {
    console.error('Failed to insert order_items', orderItemsError)
    return NextResponse.json({ error: 'Unable to save order items.' }, { status: 500 })
  }

  const stripe = getStripe()
  const baseUrl = resolveBaseUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: email,
    metadata: {
      order_id: order.id,
    },
    line_items: validatedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: STRIPE_CONFIG.currency.toLowerCase(),
        unit_amount: item.unitAmount,
        product_data: {
          name: item.displayName,
          images: item.image ? [item.image] : undefined,
        },
      },
    })),
    shipping_address_collection: {
      allowed_countries: STRIPE_CONFIG.allowedCountries,
    },
    shipping_options: STRIPE_CONFIG.shippingOptions,
    automatic_tax: { enabled: Boolean(STRIPE_CONFIG.automaticTax) },
    success_url: `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/cart?canceled=true`,
  })

  await supabase
    .from('orders')
    .update({
      stripe_session_id: session.id,
      metadata: {
        ...(order.metadata ?? {}),
        stripe_checkout_url: session.url,
      },
    })
    .eq('id', order.id)

  return NextResponse.json({ checkoutUrl: session.url, sessionId: session.id, orderId: order.id })
}
