# Environment Quickstart (Netlify Branch Deploys)

Last modified: 2025-10-24

This guide lists the environment variables required to run the site on Netlify Branch Deploys. Local `.env.local` parity is optional—only configure it when you intentionally run the app on your workstation. Never commit secrets.

Pair this with `AGENTS.md` (Repository Guidelines) for build/test expectations before pushing. Use `docs/README.md` for the living documentation index.

Key references
- Mapping at build-time: `next.config.mjs` maps connector vars to `NEXT_PUBLIC_*`.
- Server client fallbacks: `lib/supabase/server.ts` also reads `SUPABASE_URL/ANON_KEY/SERVICE_ROLE` at runtime.
- Status endpoint: `/status` shows presence (not values) for Supabase envs and the configured SITE URL.

## Required (Runtime)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`) — Server-side operations (legacy checkout, admin tasks) that require elevated Supabase access.
- `STRIPE_SECRET_KEY` — Enables Stripe Checkout session creation
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — (Optional until wallet support enabled) Publishable key used by the cart modal; rotate alongside the secret.
- `OPENAI_API_KEY` — Powers Supabase edge functions and the in-admin copilot. Store it in Netlify + `.env.local`; the assistant will refuse to load without it.

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
- `ASSISTANT_PIPELINE_MODEL` — Override enrichment model used for product/article pipelines (default `gpt-4.1-mini`; set to an available GPT-5 model when enabled).
- `ASSISTANT_CHAT_MODEL` — Override conversational model used by `/api/admin/assistant` (default `gpt-4.1-mini`).
- `ASSISTANT_CHAT_SYSTEM_PROMPT` — Optional override for the copilot’s system prompt (defaults to a friendly owner-facing brief).
- `ASSISTANT_PRODUCT_SYSTEM_PROMPT` — Optional override for product copy generation tone/content.
- `ASSISTANT_ARTICLE_SYSTEM_PROMPT` — Optional override for article drafting tone/content.
- `ASSISTANT_ADMIN_TOKEN` — Secret key that authorises `/api/admin/assistant` (chat, actions, uploads) without relying on Supabase cookies. Supply it via `Authorization: Bearer <token>` or `x-assistant-api-key`.
- `ASSISTANT_ALLOW_PREVIEW` — Set to `1` to bypass Supabase auth on any host (otherwise only Netlify branch deploys are implicitly trusted).
- `ASSISTANT_ALLOW_LOCALHOST` — Defaults to `0` in this repo so the shared `dev` branch stays locked down. Raise to `1` only if you intentionally run trusted local builds.

## Shopify Headless Storefront
- `SHOPIFY_STORE_DOMAIN` — Storefront domain (e.g., `obsidianriterecords.myshopify.com`). **Required** to enable the headless client.
- `SHOPIFY_STOREFRONT_API_TOKEN` — Storefront API access token with Storefront API scope. **Required** for live cart mutations.
- `SHOPIFY_API_VERSION` — (Optional) GraphQL API version, defaults to `2025-07`. Override only when Shopify promotes a newer stable version.
- Healthcheck: `/api/health/shopify` returns `{ ok, hasDomain, hasToken, version }` so ops can confirm configuration without exposing secrets.
# Environment Quickstart

**Do not commit secrets. Use Netlify env for deploys and `.env.local` only for local dev.**

## Required variables
- `SHOPIFY_STORE_DOMAIN` example `obsidianriterecords.myshopify.com`
- `SHOPIFY_STOREFRONT_API_TOKEN` Storefront access token
- `SHOPIFY_API_VERSION` recommended `2025-10`  
- `NEXT_PUBLIC_SITE_URL`  
- Supabase: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server keys for admin actions

## Where to set them
- Netlify Site settings → Environment variables → add at “All deploy contexts”, so Branch Deploys inherit them.
- Local (optional): only create `.env.local` when you explicitly need to run the app on your machine. Copy from `.env.example`, add secrets, and keep the file untracked.

## Verify configuration
1) Open `/status` on the Branch Deploy:
   - Node version is shown
   - `NEXT_PUBLIC_SITE_URL` reflects the intended host (branch URL during QA or production domain once live)
   - Supabase URL/ANON/SERVICE flags show “yes”
2) Shopify healthcheck: hit `/api/health/shopify` on the deploy — `ok: true` indicates both domain and token are present, and the version field reflects the active API version.
3) Shopify checkout migration: legacy `/api/checkout` and `/api/shipping/quote` routes were removed on 2025-11-06. Ensure the Shopify env block above stays populated before launch.

### Stripe key rotation & webhooks (legacy)
> The instructions in this section describe the pre-Shopify Stripe checkout flow and are archived for reference. Skip unless you are resurrecting the legacy implementation.

1. Create a new secret + publishable key pair from the Stripe dashboard (Developers → API keys).
2. Update Netlify env (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and redeploy `dev`.
3. (Optional) Update local `.env.local` if you maintain a workstation build; otherwise rely on the deploy.
4. Re-run `/api/checkout` (legacy) and capture the Stripe session ID in `docs/NEXT-STEPS.md` for traceability.
5. Once confirmed, revoke the old secret key in Stripe.

If you enable the webhook endpoint (`/api/stripe/webhook`):
- Add the webhook secret from Stripe → Developers → Webhooks → “Reveal secret” and set `STRIPE_WEBHOOK_SECRET` in Netlify and `.env.local`.
- Subscribe to `checkout.session.completed`, `payment_intent.succeeded`, and `payment_intent.payment_failed` events; the handler updates order status and payment state automatically.
- The bespoke checkout modal has been retired. Shopify takes over wallet handling as part of the new storefront rollout.

### Supabase account sanity check
- The shared admin/customer login `codex@greenaiautomation.ai` exists in `auth.users` with id `3355eb56-1519-4a64-9bc1-a1d0bd21bc19` and carries the `admin` role in `public.user_roles`.
- There is currently no dedicated `customers` table; storefront logins rely on Supabase Auth only. If a separate customer profile table is added later, seed it alongside the auth user.

## Troubleshooting Map
- Product slug `/products/{slug}` 500 with data present:
  - Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` exist; then redeploy Branch.
  - RLS: confirm policy `products_select_active` exists; product row `active = true`.
- Legacy checkout issues (e.g., `/api/checkout` 500s or missing AusPost quotes) no longer apply after the 2025-11-06 Shopify migration.

## Smoke commands
- Remote smoke (Puppeteer):
  ```bash
  BASE_URL=https://dev--obsidianriterecords.netlify.app npm run test:puppeteer
  ```
  Saves screenshots to `docs/qa-screenshots/`; no local Next.js server required.
