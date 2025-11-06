# Shopify Migration Playbook

Last updated: 2025-11-06

This playbook captures everything required to move Obsidian Rite Records from the bespoke Supabase/Stripe checkout to a Shopify headless storefront.

## 1. Environment Preparation
- **Required variables**
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_STOREFRONT_API_TOKEN`
  - `SHOPIFY_API_VERSION` (default `2025-07`; bump when Shopify promotes a new stable release)
- **Deployment**
  - Set the env vars in Netlify → Site settings → Environment (All deploy contexts).
  - Mirror them locally in `.env.local` only if you need workstation parity.
- **Healthcheck**
  - Hit `/api/health/shopify`. Expect `{ ok: true, hasDomain: true, hasToken: true, version: "2025-07" }`.
  - If any flag is `false`, stop and resolve before proceeding.

## 2. Product Catalogue
- Products page: `GET /products` pulls the first 12 Shopify products (title, handle, featured image, variant price).
- PDP: `GET /products/[handle]` fetches product details, images, and up to 8 variants.
- **Validation**
  - Load `/products` on the dev deploy. Confirm each card shows the correct cover art and price.
  - Drill into `/products/<handle>` for a representative SKU. Verify gallery, variant list, and prices match the Shopify admin.
  - Add new Shopify products in the admin and confirm they appear after the Storefront API cache warms (~seconds). No rebuild required.

## 3. Cart & Checkout
- `/api/shopify/cart` handles:
  - Cart creation (`variantId` present) → stores `sfy_cart_id` cookie (90 days).
  - Line additions.
  - Checkout URL fetch (POST with empty body).
- UI helpers:
  - `AddToCartButton` — adds a variant and surfaces success messaging.
  - `CheckoutButton` — fetches the checkout URL and redirects; disabled until Shopify env exists and a cart is present.
- **Validation**
  - Use the Playwright smoke test `npx playwright test e2e/shopify-checkout.spec.ts` to simulate add → redirect.
  - Manually add a variant via the dev deploy and follow the redirect. Ensure the Shopify checkout page loads with the expected line items and shipping rates.

## 4. QA Checklist
- `docs/QA-CHECKLIST.md` → update the Cart & Checkout section with Shopify-specific steps.
- Confirm `/api/health/shopify` and `/status` endpoints show expected env signals.
- Remote smoke: `BASE_URL=https://dev--obsidianriterecords.netlify.app npx playwright test e2e/shopify-checkout.spec.ts`.
- Document the results in the latest `docs/SESSION-YYYY-MM-DD.md`.

## 5. Go-Live
- Update `docs/GO-LIVE.md` (see below) with Shopify tasks and shipping sanity checks.
- During release day:
  - Redeploy `dev` → validate → merge to `main`.
  - Monitor Shopify orders to ensure checkout flow is processing.
  - Confirm Stripe payouts reflect Shopify’s gateway configuration (if using Shopify Payments, capture notes accordingly).

## 6. Post-Launch Monitoring
- Track checkout completion rate and drop-offs via Shopify Analytics.
- Review logs in `/api/shopify/cart` for error rates. Add Sentry hooks if needed.
- Schedule a weekly smoke using the Playwright script and record outcomes in `docs/SESSION-*.md`.

