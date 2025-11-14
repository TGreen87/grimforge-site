import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function mergeOrderMetadata(supabase: ReturnType<typeof createServiceClient>, orderId: string, patch?: Record<string, unknown>) {
  if (!patch) return undefined
  const { data } = await supabase
    .from('orders')
    .select('metadata')
    .eq('id', orderId)
    .maybeSingle()

  return { ...(data?.metadata ?? {}), ...patch }
}

async function updateOrder(
  supabase: ReturnType<typeof createServiceClient>,
  orderId: string,
  values: Record<string, unknown>,
  metadataPatch?: Record<string, unknown>
) {
  const metadata = await mergeOrderMetadata(supabase, orderId, metadataPatch)
  await supabase
    .from('orders')
    .update({
      ...values,
      ...(metadata ? { metadata } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
}

async function decrementInventoryForOrder(supabase: ReturnType<typeof createServiceClient>, orderId: string) {
  const { data: orderItems, error } = await supabase
    .from('order_items')
    .select('variant_id, quantity')
    .eq('order_id', orderId)

  if (error) {
    console.error('Unable to load order items for decrement', error)
    return
  }

  if (!orderItems?.length) return

  for (const item of orderItems) {
    if (!item.variant_id) continue
    const { error: rpcError } = await supabase.rpc('decrement_inventory', {
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
      p_order_id: orderId,
    })
    if (rpcError) {
      console.error('Failed to decrement inventory', rpcError)
    }
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await req.text()
  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to verify Stripe signature'
    console.error('Stripe webhook signature verification failed', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        if (orderId) {
          const shippingDetails = session.total_details
          const metadataPatch = {
            stripe_checkout_session_id: session.id,
            stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
            shipping_details: session.shipping_details || null,
          }

          await updateOrder(
            supabase,
            orderId,
            {
              payment_status: 'paid',
              status: 'processing',
              stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
              shipping: (shippingDetails?.amount_shipping ?? 0) / 100,
              tax: (shippingDetails?.amount_tax ?? 0) / 100,
              total: (session.amount_total ?? 0) / 100,
            },
            metadataPatch
          )

          await decrementInventoryForOrder(supabase, orderId)
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderId = intent.metadata?.order_id
        if (orderId) {
          await updateOrder(
            supabase,
            orderId,
            {
              payment_status: 'failed',
              status: 'pending',
            },
            intent.last_payment_error
              ? { last_payment_error: intent.last_payment_error.message }
              : undefined
          )
        }
        break
      }
      default:
        break
    }
  } catch (err) {
    console.error('Error handling Stripe webhook', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
