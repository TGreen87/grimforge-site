import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable')
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

// Utility functions for common Stripe operations
export const stripeUtils = {
  // Create a payment intent
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ) {
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })
  },

  // Create a customer
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ) {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    })
  },

  // Create a checkout session
  async createCheckoutSession(
    lineItems: Stripe.Checkout.SessionCreateParams.LineItem[],
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    metadata?: Record<string, string>
  ) {
    return await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'IE'],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 500,
              currency: 'usd',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1500,
              currency: 'usd',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 2,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
      ],
    })
  },

  // Retrieve a checkout session
  async retrieveCheckoutSession(sessionId: string) {
    return await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    })
  },

  // Create a refund
  async createRefund(
    paymentIntentId: string,
    amount?: number,
    reason?: Stripe.RefundCreateParams.Reason
  ) {
    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
      reason,
    }

    if (amount) {
      refundParams.amount = Math.round(amount * 100) // Convert to cents
    }

    return await stripe.refunds.create(refundParams)
  },

  // Verify webhook signature
  constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    endpointSecret: string
  ) {
    return stripe.webhooks.constructEvent(payload, signature, endpointSecret)
  },

  // Format amount for display
  formatAmount(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  },

  // Convert price to Stripe amount (cents)
  toStripeAmount(price: number): number {
    return Math.round(price * 100)
  },

  // Convert Stripe amount to price (dollars)
  fromStripeAmount(amount: number): number {
    return amount / 100
  },
}

// Webhook event types
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_FAILED: 'payment_intent.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CHARGE_REFUNDED: 'charge.refunded',
} as const

export type StripeWebhookEvent = typeof STRIPE_WEBHOOK_EVENTS[keyof typeof STRIPE_WEBHOOK_EVENTS]