# Next Steps (Dev Branch)

Last modified: 2025-11-20

This backlog reflects the Stripe checkout launch work on `dev_stripe`. Use Netlify branch deploys for all QA. Promote to `main` only after the launch checklist is green.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the documentation index.

## Snapshot — 2025-11-20
- Branches: `dev_stripe` (active), `main` (prod). Both are currently aligned at commit `496e33f` (Stripe/Supabase SDKs upgraded).
- Checkout: Stripe Checkout works in test mode with server-side validation + webhook inventory decrement. Navigation uses native anchors to avoid Netlify router issues.
- Builds: Netlify builds are green. Local lint/type-check may still warn about admin typings; tests remain red due to mocks.
- Data: Cart is client-side; server re-validates inventory. Products must have at least one active variant with stock and price.
- Webhooks: Implemented at `app/api/stripe/webhook`; success updates orders + inventory snapshots.

## Immediate Execution Queue (Priority A)
1) **Launch readiness (Stripe live)**
   - Configure live Stripe keys (secret + publishable) and live webhook secret on Netlify for `main` (and `dev_stripe` for rehearsal).
   - Set success/cancel URLs to `https://obsidianriterecords.com/order/success` and `/cart` in the checkout handler once live keys are in place.
   - Create a live-mode webhook endpoint in Stripe pointing to `/api/stripe/webhook` on production; subscribe to `checkout.session.completed` and `payment_intent.payment_failed`.
   - Run a live $1 test (or minimal real product) to confirm order creation + webhook update.

2) **Catalog data readiness**
   - In Supabase admin: ensure every product has ≥1 active variant with price and on_hand > 0; deactivate placeholder test vinyl before launch.
   - Add real products/variants via the admin panel; verify they appear on the storefront and can be added to cart.
   - Set hero/campaign content to point at a live product slug.

3) **Admin QA smoke**
   - /admin login, create a product with variant + stock, mark active, confirm it renders on the storefront and cart/checkout works.
   - Orders view loads; webhook-updated orders show status paid/processing; shipping details are visible (from Stripe session).

4) **Docs & owner playbooks**
   - Update Owner Handbook and Launch Checklist (this file, PRODUCTION-LAUNCH-CHECKLIST) with live-key steps and admin product/variant steps.
   - Archive stale session logs (done); keep `SESSION-2025-11-20.md` as the latest reference.

## Short-Term Enhancements (Priority B)
- Add explicit cart toast when add-to-cart fails because no active variant exists; prompt the user to open the product page.
- Add an admin health widget: missing active variants, zero-stock active products, and webhook error log count.
- Optional: enable Stripe wallet buttons once live publishable key is present.
- Optional: add email/PDF confirmation to owner on new paid order (using Stripe email receipts or a Supabase function).

## Research / Decisions (Priority C)
- AusPost vs. Stripe static rates for launch; default remains Stripe static until keys are provided.
- ESP choice for newsletter; CTA currently passive.
- Observability: whether to add Plausible/Umami or keep first-party beacon only.

## Blockers / External
- Live Stripe keys + webhook secret need to be supplied by owner.
- ESP credentials if newsletter opt-in should become active.

## Tracking
- [ ] Extend Puppeteer smoke to cover Journal fallback and success page CTAs.
- [ ] Reduce ESLint `no-explicit-any` debt in admin to unblock lint/test.
- [ ] Refresh Lighthouse/a11y after product list is real.

Keep this doc updated as tasks complete (`[x]`) or plans shift.
