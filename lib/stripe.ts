import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  cachedStripe = new Stripe(key, { apiVersion: "2024-06-20" });
  return cachedStripe;
}
