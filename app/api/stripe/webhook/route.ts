import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function updateOrderStatus(
  orderId: string,
  values: Record<string, unknown>,
  metadataPatch?: Record<string, unknown>
) {
  const supabase = createServiceClient()

  let mergedMetadata: Record<string, unknown> | undefined
  if (metadataPatch) {
    const { data } = await supabase
      .from('orders')
      .select('metadata')
      .eq('id', orderId)
      .maybeSingle()
    const current = (data?.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata))
      ? (data.metadata as Record<string, unknown>)
      : {}
    mergedMetadata = { ...current, ...metadataPatch }
  }

  await supabase.from('orders').update({
    ...values,
    ...(metadataPatch ? { metadata: mergedMetadata } : {}),
    updated_at: new Date().toISOString(),
  }).eq('id', orderId)
}

export async function POST(req: NextRequest) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!endpointSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 400 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await req.text()
  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unable to verify Stripe signature'
    console.error('Stripe webhook signature verification failed', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id
        if (orderId) {
          await updateOrderStatus(
            orderId,
            {
              payment_status: 'paid',
              status: 'processing',
              stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            },
            {
              ...(session.metadata || {}),
              stripe_checkout_session_id: session.id,
              stripe_customer_id: session.customer || undefined,
            }
          )
        }
        break
      }
      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderId = intent.metadata?.order_id
        if (orderId) {
          await updateOrderStatus(
            orderId,
            {
              payment_status: 'failed',
              status: 'pending',
            },
            {
              ...(intent.metadata || {}),
              last_payment_error: intent.last_payment_error?.message,
            }
          )
        }
        break
      }
      case 'payment_intent.succeeded': {
        const intent = event.data.object as Stripe.PaymentIntent
        const orderId = intent.metadata?.order_id
        if (orderId) {
          await updateOrderStatus(
            orderId,
            {
              payment_status: 'paid',
              status: 'processing',
              stripe_payment_intent_id: intent.id,
            },
            intent.metadata || undefined
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
