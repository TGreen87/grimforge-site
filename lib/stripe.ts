import Stripe from 'stripe'

// Initialize Stripe with the correct API version
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY_1 || process.env.STRIPE_SECRET_KEY || '',
  {
    apiVersion: '2025-07-30.basil' as Stripe.LatestApiVersion, // Type assertion needed for newer API versions
    typescript: true,
  }
)

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