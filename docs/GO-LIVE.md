# Shopify Go-Live Checklist

Last updated: 2025-11-06

This checklist tracks the final steps to launch the Shopify-backed storefront.

## 1. Environment Preflight
- Netlify → Environment variables:
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_STOREFRONT_API_TOKEN`
  - `SHOPIFY_ADMIN_API_TOKEN` (Headless custom app token with write_products scope)
  - `SHOPIFY_API_VERSION` (optional; defaults to `2025-07`)
  - Existing Supabase + assistant keys remain required for admin tooling.
- Health endpoints:
  - `/api/health/shopify` → expect `{ ok: true, hasDomain: true, hasToken: true, hasAdminToken: true }`.
  - `/status` → verify Supabase anon/service role still read as “yes”.
- Document env confirmation in the latest `docs/SESSION-*.md`.

## 2. Product & Content Validation
- Visit `/products` on the `dev` branch deploy to confirm the first 12 Shopify products render with titles, images, and prices.
- Spot-check `/products/<handle>` pages for:
  - Image gallery accuracy (use Shopify-admin reference).
  - Variant availability and pricing.
  - Add-to-cart messaging.
- Ensure editorial content (hero, journal, timelines) still matches Supabase data.

## 3. Cart and Checkout Smoke
- Run `npx playwright test e2e/shopify-checkout.spec.ts` with `BASE_URL` pointing at the branch deploy if running remotely.
- Manual validation:
  - Add a variant from `/products/<handle>`; confirm toast and checkout button enable.
  - Click “Go to checkout” and verify Shopify checkout opens with correct line items.
- Check Netlify logs (or local console) for `/api/shopify/cart` errors; resolve before go-live.

## 4. Shipping Sanity
- Confirm Shopify shipping profiles match the expected rates (Standard/Express or Shopify Shipping equivalent).
- Place a test checkout using staging credentials to ensure shipping options and taxes render correctly.
- Update `docs/NEXT-STEPS.md` with any follow-up shipping tasks (e.g., add express international).

## 5. Release Steps
- Redeploy `dev` after final QA.
- Merge `dev → main` once the branch deploy looks good.
- Monitor:
  - Netlify production deploy.
  - Shopify admin → Orders (first transactions land correctly).
  - Analytics (conversion path, checkout drop-offs).
- Announce go-live; update `docs/SESSION-*.md` with execution notes and attach screenshots in `docs/qa-screenshots/`.

## 6. Post-Launch Follow-Up
- Schedule weekly Playwright smoke + `/api/health/shopify` check for the first month.
- Review Shopify reports for abandoned checkouts and fulfilment metrics.
- Capture any support issues in `docs/NEXT-STEPS.md` and adjust the playbook as needed.
