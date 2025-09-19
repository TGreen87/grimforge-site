# Australia Post Shipping (Scaffold)

_Last updated: 2025-09-19_

This repo includes a safe scaffold for quoting Australia Post rates and passing a selected option into Stripe Checkout. See `docs/README.md` for related integration guides. It degrades gracefully to static Stripe rates when AusPost env is not configured.

## What’s Implemented
- Service module: `src/services/shipping/auspost.ts`
  - Quotes Domestic vs International services via AusPost Postage Assessment API when configured.
  - If not configured or on error, returns `[]` so callers can fall back.
- API route: `POST /api/shipping/quote`
  - Accepts `{ destination, items }` and returns `{ configured, options }`.
  - When not configured, returns Stripe static shipping options from `lib/stripe.ts`.
- Checkout API update: `POST /api/checkout`
  - Accepts optional `shipping_rate_data` (Stripe shape) or `{ shipping: { display_name, amount_cents, currency, eta_* } }`.
  - If provided, the Checkout session uses that single shipping option; otherwise falls back to static options in `STRIPE_CONFIG`.

## Environment Variables
- `AUSPOST_API_KEY` (required to enable live AusPost quotes)
- `AUSPOST_ORIGIN_POSTCODE` (required; the origin postcode)

Notes:
- These are only required in environments where live quoting is desired. In previews or during local dev without credentials, the system falls back to static Stripe rates.

## Request Shapes
Example quote request:

```
POST /api/shipping/quote
{
  "destination": { "country": "AU", "postcode": "3000" },
  "items": [ { "weight_g": 250, "length_cm": 31, "width_cm": 22, "height_cm": 3, "quantity": 1 } ]
}
```

Example checkout (with selected shipping):

```
POST /api/checkout
{
  "items": [ { "variant_id": "...", "quantity": 2 } ],
  "shipping": { "display_name": "Express (AusPost)", "amount_cents": 2000, "currency": "AUD", "eta_min_days": 2, "eta_max_days": 5 }
}
```

Alternatively, pass raw Stripe shape:

```
{
  "shipping_rate_data": {
    "type": "fixed_amount",
    "fixed_amount": { "amount": 1500, "currency": "AUD" },
    "display_name": "Standard (AusPost)"
  }
}
```

## Service Scope (Locked)
- Domestic: Parcel Post and Express Post only (customer pays). Labels render as “Parcel Post (AusPost)” and “Express (AusPost)”.
- International: Standard and Express services where available (customer pays). Labelled “Standard (AusPost)” / “Express (AusPost)”.
- Options are sorted by price ascending. Unknown or legacy services are filtered out for clarity.

## Next Steps
- Product data: add default weight/dimensions per Stock Unit to improve quote accuracy; fall back to package defaults when missing.
- UI: selection persists within the modal; the chosen option is sent to `/api/checkout` and charged via Stripe Checkout.
- Testing: branch smoke via Puppeteer (`npm run test:puppeteer`); Playwright e2e on demand.

## Safety & Fallback
- If `AUSPOST_API_KEY` or `AUSPOST_ORIGIN_POSTCODE` is missing, quotes return `configured:false` and static Stripe rates; checkout continues to work.
- Errors from AusPost are logged and also fall back to static rates to avoid blocking sales.
