# Next Steps (Dev Branch)

Last modified: 2025-09-18

This backlog captures the active workstreams after the dashboard revamp. Everything ships on `dev` first; promote to `main` only after the full QA loop completes.

## Snapshot — 2025-09-18
- Supabase schema for customers/orders/inventory + dashboard analytics is live.
- Admin dashboard v1.5 shipped (KPIs, revenue trend, low-stock roster, announcement editor, CSV exports).
- Checkout API persists orders + items; Stripe webhook handler updates payment status.
- Smoke automation (`npm run test:puppeteer`) green; lint backlog still outstanding (legacy `any` usage, hook warnings).

## Immediate Execution Queue (Priority A)
1. **Admin Dashboard 2.0 groundwork**
   - [ ] Design order timeline data shape (extend `audit_logs`, add service calls for events).
   - [ ] Add bulk order status mutation endpoint + packing slip generator scaffold.
   - [ ] Instrument configurable alert thresholds (awaiting fulfilment, low stock) in Supabase.
2. **Storefront visual scaffolding**
   - [ ] Introduce motion utilities (`framer-motion`) and shared animation tokens.
   - [ ] Lay down hero campaign config (Supabase table + admin form draft).
   - [ ] Prototype refreshed hero (static + reduced motion fallback) behind feature flag.
3. **Third-party integrations**
   - [ ] Evaluate/choose image hosting flow (Supabase Storage vs. Cloudinary) and document requirements.
   - [ ] Add Slack webhook settings to admin (env + settings table) for future alerts.

## Short-Term Enhancements (Priority B)
- Dashboard
  - [ ] Revenue goal card with editable target + trend delta.
  - [ ] Announcement history log + restore UI.
  - [ ] Needs fulfilment panel: add quick export + filter links.
- Orders Workflow
  - [ ] Timeline tab on `/admin/orders/show/[id]` combining status/payment/audit events.
  - [ ] Packing slip PDF (start with simple HTML → PDF via serverless export).
  - [ ] AusPost label hook (blocked until credentials).
- Storefront
  - [ ] Catalog quick actions (Add to cart/Wishlist) with focus states.
  - [ ] Product gallery lightbox + sticky buy module.
  - [ ] Story block (“About the Label”) + testimonials carousel.
  - [ ] Checkout sheet UX + wallet row (blocked on publishable key).

## Research / Decisions (Priority C)
- [ ] Select third-party animation helper for list transitions (`auto-animate`, `motion.dev`, etc.).
- [ ] Determine analytics stack (Plausible vs. Vercel Analytics) for conversion tracking.
- [ ] Define newsletter provider integration (Mailchimp, Buttondown) for footer opt-in.

## Dependencies & Blockers
- Stripe publishable key: wallet buttons, checkout UX validation.
- AusPost API credentials: live rate QA, labels, dashboard shipping widgets.
- Slack/email webhook secrets: notifications for high-value orders.

## QA & Automation To-Dos
- [ ] Extend Puppeteer smoke to cover dashboard announcement edit + CSV export download.
- [ ] Add Vitest coverage for dashboard RPCs (`orders_revenue_series`, `inventory_low_stock_trend`).
- [ ] Lighthouse/aXe baseline for refreshed storefront once hero revamp lands.

## Documentation & Ops
- [ ] Update `docs/ENV-QUICKSTART.md` when new env vars (Slack webhook, animation toggles) are introduced.
- [ ] Record work in `docs/SESSION-YYYY-MM-DD.md` per major push.
- [ ] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` with storefront QA steps.

Keep this doc updated as tasks complete (mark `[x]`) or get reprioritized.
