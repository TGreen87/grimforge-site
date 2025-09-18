# Environment Quickstart (Branch Deploys + Local)

Last modified: 2025-09-17

This guide lists the environment variables required to run the site on Netlify Branch Deploys (dev) and locally. Never commit secrets.

Key references
- Mapping at build-time: `next.config.mjs` maps connector vars to `NEXT_PUBLIC_*`.
- Server client fallbacks: `lib/supabase/server.ts` also reads `SUPABASE_URL/ANON_KEY/SERVICE_ROLE` at runtime.
- Status endpoint: `/status` shows presence (not values) for Supabase envs and the configured SITE URL.

## Required (Runtime)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`) — Server-side operations (e.g., `/api/checkout`)
- `STRIPE_SECRET_KEY` — Enables Stripe Checkout session creation
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — (Optional until wallet support enabled) Publishable key used by the cart modal; rotate alongside the secret.

## Recommended
- `NEXT_PUBLIC_SITE_URL` — Set to the Branch Deploy URL for dev (e.g., `https://dev--obsidianriterecords.netlify.app`)
- `SITE_URL_STAGING` — Same as above; used as a fallback in metadata/redirects

## Optional
- `STRIPE_WEBHOOK_SECRET` — Required only if Stripe webhook route is enabled
- `AUSPOST_API_KEY`, `AUSPOST_ORIGIN_POSTCODE` — Enables live AusPost quotes; otherwise we return Stripe static rates
- `ADMIN_SETUP_TOKEN` — Needed for `/api/admin/setup` bootstrap endpoint
- `NEXT_PUBLIC_ENABLE_ADMIN_BULK` — Feature flag for admin bulk tooling
- `NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN` — Feature flag for the campaign-driven storefront hero (set to `1` to enable)
- `SLACK_OPS_WEBHOOK` (future) — if populated, Slack notifications for fulfilment alerts can be toggled in admin settings

## Where to set them
- Netlify Site settings → Environment variables → add at “All deploy contexts”, so Branch Deploys inherit them.
- Local: create `.env.local` (never commit); copy from `.env.example` and add secrets.

## Verify configuration
1) Open `/status` on the Branch Deploy:
   - Node version is shown
   - `NEXT_PUBLIC_SITE_URL` is set to the Branch URL (recommended)
   - Supabase URL/ANON/SERVICE flags show “yes”
2) Shipping API (optional): `POST /api/shipping/quote` returns either AusPost options (configured:true) or Stripe static fallback (configured:false).
3) Checkout API: `POST /api/checkout` returns 200 with `{ checkoutUrl }` when `STRIPE_SECRET_KEY` and service role are present; otherwise it returns 500. For dev, add the provided temporary key to Netlify (`STRIPE_SECRET_KEY=sk_live_...YYv`) and remove it after testing.

### Stripe key rotation & webhooks
1. Create a new secret + publishable key pair from the Stripe dashboard (Developers → API keys).
2. Update Netlify env (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and redeploy `dev`.
3. Update local `.env.local` and run `npm run type-check` to ensure the build still succeeds.
4. Re-run `/api/checkout` (see checklist) and capture the Stripe session ID in `docs/NEXT-STEPS.md` for traceability.
5. Once confirmed, revoke the old secret key in Stripe.

If you enable the webhook endpoint (`/api/stripe/webhook`):
- Add the webhook secret from Stripe → Developers → Webhooks → “Reveal secret” and set `STRIPE_WEBHOOK_SECRET` in Netlify and `.env.local`.
- Subscribe to `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` events; the handler updates order status and payment state automatically.
- Until the publishable key is available, checkout falls back to the hosted Stripe page after shipping details are collected inside the modal. Once you add `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, update the cart modal to show wallet buttons (see `src/components/CheckoutModal.tsx`).

### Supabase account sanity check
- The shared admin/customer login `codex@greenaiautomation.ai` exists in `auth.users` with id `3355eb56-1519-4a64-9bc1-a1d0bd21bc19` and carries the `admin` role in `public.user_roles`.
- There is currently no dedicated `customers` table; storefront logins rely on Supabase Auth only. If a separate customer profile table is added later, seed it alongside the auth user.

## Troubleshooting Map
- Product slug `/products/{slug}` 500 with data present:
  - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist; then redeploy Branch.
  - RLS: confirm policy `products_select_active` exists; product row `active = true`.
- `/api/checkout` returns 500 “Failed to create order”:
  - Confirm `STRIPE_SECRET_KEY` is set; and a service key exists (`SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SERVICE_ROLE`). Redeploy and retry.
- Shipping shows only static options:
  - This is expected when AusPost envs are absent; checkout still works and charges the selected static rate.

## Smoke commands
- Local smoke (Puppeteer):
  ```bash
  BASE_URL=https://dev--obsidianriterecords.netlify.app npm run test:puppeteer
  ```
  Saves screenshots to `docs/qa-screenshots/`.
