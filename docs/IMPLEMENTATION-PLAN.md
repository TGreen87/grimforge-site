# Implementation Plan (Dev Branch)

Last modified: 2025-11-20

Work on `dev_stripe`; promote to `main` only after branch QA. Netlify branch deploys are the source of truth.

## Objectives
- Launch-ready checkout with live Stripe keys + webhook and inventory enforcement.
- Clean catalog data: every product has an active variant (price + stock).
- Admin flows stable for product/variant creation and order review/fulfilment.
- Minimal observability: client error logging and visibility into Stripe webhooks.
- Documentation aligned with current workflow; legacy artifacts archived.

## Phases (current scope)

### Phase A — Launch-Ready Checkout
- Set live Stripe secret/publishable keys + live webhook secret on Netlify (`main`, optional `dev_stripe` for rehearsal).
- Point success/cancel URLs to production domain in checkout handler once live keys are set.
- Run live $1 test: add product → /cart → Stripe → webhook updates order + inventory.
- Optional post-launch: enable wallet buttons once live publishable key confirmed.

### Phase B — Catalog Readiness
- Ensure each product has ≥1 active variant with price and on_hand > 0.
- Retire the test vinyl before launch; load real releases via admin.
- Hero/campaign content should point to a live product slug.

### Phase C — Admin Stability
- Smoke: /admin login, create product + variant + stock, mark active; verify storefront render and add-to-cart/checkout.
- Orders view shows webhook-updated paid orders with shipping details.
- Add owner-facing notes in Admin/Owner docs for variant/stock requirements.

### Phase D — Observability (minimum)
- `/api/client-logs` beacons remain enabled; ensure webhook errors are visible in Stripe dashboard (and optionally surface counts in admin later).
- Optional: add admin health widget for missing variants/zero stock/webhook failures.

### Phase E — Documentation & QA
- Keep `AGENTS.md`, `PRODUCTION-LAUNCH-CHECKLIST.md`, `OWNER-HANDBOOK.md`, and `CONTINUE-PROMPT.md` current.
- Archive stale session logs (done); latest is `SESSION-2025-11-20.md`.
- Manual/remote smoke on branch deploys: nav links, add-to-cart, checkout, success CTAs.

## Backlog (post-launch)
- Admin lint/test debt (mocks, `no-explicit-any`).
- Bulk CSV import/export for pricing/active flags (feature-flagged).
- Wallet buttons + Plausible/Umami decision; ESP/newsletter enablement.
- AusPost live rates (optional once credentials provided).
- Admin health widget + webhook log surface.

## Rollback
- Revert commit on `dev_stripe` and redeploy branch if a change breaks checkout/nav.
- Stripe: delete/rotate webhook or keys in dashboard if a misconfig is detected.
