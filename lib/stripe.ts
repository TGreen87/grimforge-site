import Stripe from 'stripe'

// Lazily initialize Stripe to avoid build-time errors when env vars are absent
export function getStripe(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY_1 || process.env.STRIPE_SECRET_KEY
  if (!apiKey) {
    throw new Error('Stripe secret key is not configured')
  }
  return new Stripe(apiKey, {
    // Rely on account default API version; avoids TS literal version mismatches
    typescript: true,
  })
}

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'AUD' as const,
  shippingOptions: [
    {
      shipping_rate_data: {
        type: 'fixed_amount' as const,
        fixed_amount: {
          amount: 1000, // $10.00 AUD
          currency: 'AUD',
        },
        display_name: 'Standard Shipping',
        delivery_estimate: {
          minimum: {
            unit: 'business_day' as const,
            value: 5,
          },
          maximum: {
            unit: 'business_day' as const,
            value: 10,
          },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount' as const,
        fixed_amount: {
          amount: 2000, // $20.00 AUD
          currency: 'AUD',
        },
        display_name: 'Express Shipping',
        delivery_estimate: {
          minimum: {
            unit: 'business_day' as const,
            value: 2,
          },
          maximum: {
            unit: 'business_day' as const,
            value: 5,
          },
        },
      },
    },
  ],
  allowedCountries: ['AU'] as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
}