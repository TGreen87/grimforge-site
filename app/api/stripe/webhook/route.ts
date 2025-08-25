import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog, createPaymentAuditLog } from '@/lib/audit-logger'
import Stripe from 'stripe'

// Disable body parsing for webhook route
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_1 || process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    
    await writeAuditLog(
      createPaymentAuditLog({
        eventType: 'webhook.signature_verification_failed',
        error: err instanceof Error ? err.message : 'Signature verification failed',
        metadata: {
          signature: signature.substring(0, 20) + '...',
        },
      })
    )

    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Initialize Supabase service client
  const supabase = createServiceClient()

  // Log all webhook events
  await writeAuditLog(
    createPaymentAuditLog({
      eventType: 'webhook.received',
      stripeEventId: event.id,
      stripeEventType: event.type,
      metadata: {
        livemode: event.livemode,
        created: event.created,
        api_version: event.api_version,
      },
    })
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Extract metadata
        const orderId = session.metadata?.order_id
        const variantId = session.metadata?.variant_id
        const quantity = parseInt(session.metadata?.quantity || '0')

        if (!orderId) {
          console.error('No order_id in session metadata')
          await writeAuditLog(
            createPaymentAuditLog({
              eventType: 'webhook.missing_order_id',
              stripeEventId: event.id,
              stripeSessionId: session.id,
              error: 'Missing order_id in session metadata',
            })
          )
          return NextResponse.json({ received: true })
        }

        // Retrieve full session details with line items
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'payment_intent', 'customer', 'total_details'],
        })

        // Calculate tax amount from Stripe
        const taxAmount = fullSession.total_details?.amount_tax || 0
        const shippingAmount = fullSession.total_details?.amount_shipping || 0
        const totalAmount = fullSession.amount_total || 0

        // 1. Mark order as paid
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .update({
            status: 'paid',
            payment_status: 'paid',
            email: fullSession.customer_email || session.customer_email || '',
            stripe_payment_intent_id: fullSession.payment_intent?.id || session.payment_intent,
            tax: taxAmount / 100, // Convert from cents to dollars
            shipping: shippingAmount / 100,
            total: totalAmount / 100,
            metadata: {
              stripe_session_id: session.id,
              stripe_customer_id: fullSession.customer,
              stripe_payment_status: session.payment_status,
              stripe_payment_method_types: session.payment_method_types,
              shipping_details: fullSession.shipping_details,
              customer_details: fullSession.customer_details,
              completed_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .select()
          .single()

        if (orderError || !order) {
          console.error('Failed to update order:', orderError)
          await writeAuditLog(
            createPaymentAuditLog({
              eventType: 'webhook.order_update_failed',
              stripeEventId: event.id,
              orderId,
              error: orderError?.message || 'Failed to update order',
            })
          )
          // Don't return error - continue processing
        }

        // 2. Create or update customer record
        if (fullSession.customer_email) {
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', fullSession.customer_email)
            .single()

          let customerId = existingCustomer?.id

          if (!customerId) {
            const { data: newCustomer } = await supabase
              .from('customers')
              .insert({
                email: fullSession.customer_email,
                name: fullSession.customer_details?.name || null,
                phone: fullSession.customer_details?.phone || null,
              })
              .select()
              .single()

            customerId = newCustomer?.id
          }

          // Update order with customer ID
          if (customerId) {
            await supabase
              .from('orders')
              .update({ customer_id: customerId })
              .eq('id', orderId)
          }

          // Save shipping address if provided
          if (fullSession.shipping_details && customerId) {
            const shipping = fullSession.shipping_details
            await supabase
              .from('addresses')
              .insert({
                customer_id: customerId,
                line1: shipping.address?.line1 || '',
                line2: shipping.address?.line2 || null,
                city: shipping.address?.city || '',
                state: shipping.address?.state || '',
                postal_code: shipping.address?.postal_code || '',
                country: shipping.address?.country || 'AU',
                is_default: true,
              })
          }
        }

        // 3. Allocate serials if configured (placeholder for future implementation)
        // This would involve checking if the product requires serial allocation
        // and generating/assigning serial numbers from a pool

        // 4. Decrement inventory atomically
        if (variantId && quantity > 0) {
          // Call the decrement_inventory database function
          const { data: inventoryResult, error: inventoryError } = await supabase
            .rpc('decrement_inventory', {
              p_variant_id: variantId,
              p_quantity: quantity,
              p_order_id: orderId,
            })

          if (inventoryError || !inventoryResult) {
            console.error('Failed to decrement inventory:', inventoryError)
            await writeAuditLog(
              createPaymentAuditLog({
                eventType: 'webhook.inventory_decrement_failed',
                stripeEventId: event.id,
                orderId,
                error: inventoryError?.message || 'Failed to decrement inventory',
                metadata: {
                  variant_id: variantId,
                  quantity,
                },
              })
            )
          } else {
            await writeAuditLog(
              createPaymentAuditLog({
                eventType: 'webhook.inventory_decremented',
                stripeEventId: event.id,
                orderId,
                metadata: {
                  variant_id: variantId,
                  quantity,
                  success: inventoryResult,
                },
              })
            )
          }
        }

        // 5. Write to audit log
        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'payment.completed',
            stripeEventId: event.id,
            stripeEventType: event.type,
            orderId,
            customerId: order?.customer_id,
            customerEmail: fullSession.customer_email || '',
            amount: totalAmount / 100,
            currency: session.currency || 'AUD',
            taxAmount: taxAmount / 100,
            paymentStatus: 'completed',
            stripeSessionId: session.id,
            stripePaymentIntentId: fullSession.payment_intent?.id || session.payment_intent,
            metadata: {
              variant_id: variantId,
              quantity,
              shipping_amount: shippingAmount / 100,
              payment_method_types: session.payment_method_types,
            },
          })
        )

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Extract order ID from metadata
        const orderId = paymentIntent.metadata?.order_id

        if (orderId) {
          // Update order status
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              metadata: {
                payment_failure_reason: paymentIntent.last_payment_error?.message,
                payment_failure_code: paymentIntent.last_payment_error?.code,
                failed_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)

          if (updateError) {
            console.error('Failed to update order for payment failure:', updateError)
          }
        }

        // Write to audit log
        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'payment.failed',
            stripeEventId: event.id,
            stripeEventType: event.type,
            orderId,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            paymentStatus: 'failed',
            stripePaymentIntentId: paymentIntent.id,
            error: paymentIntent.last_payment_error?.message,
            metadata: {
              failure_code: paymentIntent.last_payment_error?.code,
              failure_type: paymentIntent.last_payment_error?.type,
            },
          })
        )

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const orderId = session.metadata?.order_id

        if (orderId) {
          // Update order status to cancelled
          await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'cancelled',
              metadata: {
                cancelled_reason: 'checkout_expired',
                expired_at: new Date().toISOString(),
              },
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId)
        }

        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'checkout.expired',
            stripeEventId: event.id,
            stripeEventType: event.type,
            orderId,
            stripeSessionId: session.id,
            metadata: {
              expires_at: session.expires_at,
            },
          })
        )

        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Log successful payment intent
        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'payment_intent.succeeded',
            stripeEventId: event.id,
            stripeEventType: event.type,
            stripePaymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount / 100,
            currency: paymentIntent.currency,
            metadata: {
              order_id: paymentIntent.metadata?.order_id,
            },
          })
        )

        break
      }

      default:
        // Log unhandled event types
        await writeAuditLog(
          createPaymentAuditLog({
            eventType: 'webhook.unhandled_event',
            stripeEventId: event.id,
            stripeEventType: event.type,
            metadata: {
              data: event.data.object,
            },
          })
        )
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    await writeAuditLog(
      createPaymentAuditLog({
        eventType: 'webhook.processing_error',
        stripeEventId: event.id,
        stripeEventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      })
    )

    // Return success to prevent Stripe from retrying
    // Errors are logged and can be reprocessed manually if needed
    return NextResponse.json({ received: true })
  }
}