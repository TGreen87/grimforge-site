# Next Steps (Dev Branch)

Last modified: 2025-09-19

This backlog captures the active workstreams after the dashboard revamp. Everything ships on `dev` first; promote to `main` only after the full QA loop completes.

Consult `AGENTS.md` for contributor expectations and deployment discipline. Use `docs/README.md` for the live documentation index.

## Snapshot — 2025-09-18
- Supabase schema for customers/orders/inventory + dashboard analytics is live.
- Admin dashboard v1.5 shipped (KPIs, revenue trend, low-stock roster, announcement editor, CSV exports).
- Checkout API persists orders + items; Stripe webhook handler updates payment status.
- Smoke automation (`npm run test:puppeteer`) green; lint backlog still outstanding (legacy `any` usage, hook warnings).

## Immediate Execution Queue (Priority A)
1. **Admin Dashboard 2.0 groundwork**
   - [x] Design order timeline data shape (extend `audit_logs`, add service calls for events).
   - [x] Add bulk order status mutation endpoint + packing slip generator scaffold.
   - [x] Add bulk cancel/refund flows with audit logs and optional customer notifications (email notification stub pending).
   - [x] Instrument configurable alert thresholds (awaiting fulfilment, low stock) in Supabase + expose on dashboard.
2. **Storefront visual scaffolding**
   - [x] Introduce motion utilities (`framer-motion`) and shared animation tokens.
   - [x] Lay down hero campaign config (Supabase table + admin form draft).
   - [x] Prototype refreshed hero (static + reduced motion fallback) behind feature flag.
   - [x] Wire storefront hero to consume active campaign data (with fallback when none active).
3. **Third-party integrations**
   - [ ] Evaluate/choose image hosting flow (Supabase Storage vs. Cloudinary) and document requirements.
   - [x] Add Slack webhook settings to admin (env + settings table) for alerts.

## Short-Term Enhancements (Priority B)
- Dashboard
  - [x] Revenue goal card with editable target + trend delta.
  - [ ] Announcement history log + restore UI.
  - [ ] Needs fulfilment panel: add quick export + filter links.
- Orders Workflow
  - [x] Timeline tab on `/admin/orders/show/[id]` combining status/payment/audit events.
  - [x] Upgrade packing slip to branded PDF (HTML-to-PDF service) (attachment flow TBD).
  - [ ] AusPost label hook (blocked until credentials).
- Storefront
  - [x] Campaign hero layout variants (classic/split/minimal) with badges, highlights, and reduced-motion handling.
  - [x] Catalog quick actions (Add to cart/Wishlist) with focus states.
  - [x] Product gallery lightbox + sticky buy module.
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
- [x] Update `docs/ENV-QUICKSTART.md` when new env vars (Slack webhook, animation toggles) are introduced.
- [x] Record work in `docs/SESSION-YYYY-MM-DD.md` per major push.
- [x] Refresh `docs/PRODUCTION-LAUNCH-CHECKLIST.md` with storefront QA steps.

Keep this doc updated as tasks complete (mark `[x]`) or get reprioritized.
