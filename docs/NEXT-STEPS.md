# Next Steps (Dev Branch)

Last modified: 2025-09-15

This doc tracks the immediate backlog now that production auth is live. All work happens on `dev`; main stays protected until we say “go live”.

## Current Status — 2025-09-10
- Node 22 on Netlify + local; Next runtime v5 in use.
- Copy/code: centralized strings in `src/content/copy.ts`; Preorders copy updated.
- SEO: default title/description fixed; no duplicate brand in `<title>`.
- Admin: Users & Roles page added (`/admin/users`) + API to grant/remove admin; Google OAuth now auto‑creates a `customers` row.
- Cache safety: homepage served with `Cache-Control: no-store` + page is `force-dynamic` to avoid stale SSR payloads; static assets are immutable.
- Dev and main deployed; homepage served with `no-store`. If any stale persists, consider a Netlify `_headers` rule for `/` with `Cache-Control: no-store`.

## Recently Shipped to Production
- Product detail with variant selector + JSON‑LD (AUD currency); footer anchors with tab sync; cart/auth fixes; admin stock receive via RPC; client error logging with correlation IDs; skull icon removed; expanded Stripe shipping countries.

## Product Detail — Progress
- Implemented `/products/[slug]` page wired to Supabase (server route) with SEO metadata + Product JSON‑LD. Route hardened to normalize `inventory` join and guard with try/catch.
- Added variant selector (client) updating price/availability; Buy Now uses selected variant.
- Kept legacy `/product/[id]` route to redirect to slug.
- Catalog cards now link directly to `/products/{slug}` (fallback to id route if slug missing).
- Footer links use hash anchors to ensure reliable jump scrolling.

## Catalog — UX
- Added compact counts line under the section header.

Next:
- Add skeletons, consistent card sizes; badges for Limited/Pre‑order.
- Improve a11y focus outlines and keyboard navigation.

Next:
- Add slug generation/editing in Admin (derive from title; unique check) so catalog cards always link to `/products/{slug}` without legacy fallback (dev).
- Update ProductCard to render slug for analytics data attributes (optional).
- Ensure sitemap includes product slugs when present.

## Observability — Progress
- Added `/api/client-logs` to collect client error events (writes to audit logs).
- Mounted client error listener (window.error/unhandledrejection) via `ClientErrorLogger` in app providers.
- Added console/nav breadcrumbs and correlation IDs (cookie/header) to enrich client error reports.

## Admin UI — Progress (dev)
- Modern shell (header+sider) with breadcrumbs and header search wired to Kbar.
- Table toolbar with density toggle and per‑resource column presets (persisted).
- Alternate views:
  - Products → Cards (inline price/active)
  - Orders → Board with drag‑and‑drop status updates
  - Inventory → Cards + quick filters (All/Low/Out)
  - Customers → Cards; Articles → Cards
- Kbar actions: create product/article/stock unit; jump to boards/cards.

Next:
- Board polish: drag animations (initial implemented), include “Delivered” column (added), consider “Cancelled/Refunded” read columns.
- Cards filters: Products (featured/active), Articles (published), Customers (has orders).
- Accessibility pass: focus rings and keyboard nav across cards/toolbar.

## Shipping — AusPost
- Implemented AusPost quotes and checkout integration; customers pay shipping.
- `POST /api/shipping/quote` returns AusPost rates when configured; falls back to static Stripe options otherwise.
- `POST /api/checkout` accepts `shipping_rate_data` or `{ shipping: ... }` and uses that for Stripe Checkout shipping.
 - Ensure `STRIPE_SECRET_KEY` exists on branch deploy for `/api/checkout` to create sessions.

Next:
- Confirm service list (Domestic: Parcel Post/Express; key international zones) and labels; keep customer-paying model.
- Add weight/dimension defaults on Stock Units to improve quotes (sensible defaults used meanwhile).

## Supabase — Seed & RLS

- Add `variants`/`inventory` if missing: use `docs/SUPABASE-SEED.md` → Bootstrap (matches FK types to `products.id`).
- Add `slug` column to `products` if missing.
- Use `No‑DO Seed` to grant admin and upsert test product/variant/inventory (format = 'vinyl').
- Ensure RLS policy `products_select_active` exists so public product pages do not 500. Server Supabase client now falls back to `SUPABASE_*` envs at runtime.
- Session notes: `docs/SESSION-2025-09-14.md`.

## Mobile UX Polish — Planned
- Header/menu spacing on small screens; drawer widths; card grid/paddings; break long words. [in progress]
- Catalog: add skeletons while products load. [done]
- Increase touch targets on card overlay actions and primary buttons. [done]
- Reduce section margins on small screens; ensure no horizontal overflow. [done]

Next:
- Add optional correlation ID to tie client logs to sessions (present); consider dedup per session.

## 1) Products / Variants — Bulk Tooling (Phase 1)
- Bulk price updates: +/- %, absolute set, undo preview
- Active toggle: show/hide products or variants in one action
- Import/Export CSV: price/active only (dry‑run + per‑row errors)
- Flag gated: `NEXT_PUBLIC_ENABLE_ADMIN_BULK="1"`
- Acceptance: selected rows update, audit log entry, errors surfaced inline

## 2) Inventory UX Polish
- Better toasts and error details
- Readonly mode when service role is absent (explain why)
- Empty / loading states

## 3) Articles (MVP)
- Public: `/articles` (list), `/articles/[slug]` (detail) wired to Supabase
- Admin editor: create/edit with markdown, publish/unpublish
- SEO/OG: dynamic metadata + JSON‑LD
- Note: deferred until after Sprint 1 polish.

## 4) Copy Cleanup (Site)
- Replace remaining theme placeholders (hero, modals, toasts)
- Keep brand voice professional and clear

## 5) Admin UX
- Link identities (email ↔ Google) helper button if not auto‑linked
- Role label + guardrails for non‑admin users (gentle UX)

## 6) Observability (Low‑touch)
- Add lightweight client error logging (console breadcrumb -> endpoint)
- Keep /status and /admin/validate available

## 7) Admin UI Polish (New)
- Visual: branded shell header, sticky bulk actions, skeletons, refined empty/error states, unified toasts, focus rings.
- Usability: quick in-table editors (price/active/stock), orders timeline + actions, customers link auth↔customer, audit log viewer.
- Self‑service: invite user + assign role; role badges.
- Terminology: prefer “Stock Unit” over “Variant”; show “URL (link)” labels instead of “slug” with helper text. [done]

## Branch Discipline
- Work on `dev`. Small, reversible commits.
- Merge to `main` only when branch deploy is green + manual QA passed.

## Rollback
- If `main` breaks: `git revert <sha>` → push → Netlify redeploys previous good state.
- A11y: ProductCard keyboard navigation, aria labels, and title links.
## Sprint 1 Status — 2025-09-12
- Admin visuals foundation: dark tokens mapped to AntD, focus rings, sticky headers, density toggle, view toggles, CSV export, and warm EmptyStates across lists (Products/Stock Units/Inventory/Orders/Customers/Articles).
- Shipping UI: checkout modal shows selectable rates from `/api/shipping/quote` (AusPost when configured; Stripe static fallback), and the selected option is charged to the customer in Stripe Checkout.
- Sitemap: serves only active products and published articles.
- Puppeteer: added a smoke script `npm run test:puppeteer` for branch URL health (homepage + vinyl anchor; product steps are best‑effort if data exists).
- Articles polish: deferred to post‑Sprint‑1.

Pending (manual verification on dev deploy):
- Admin flows feel coherent on branch (Cards/Board/views/toolbar); Commands (Cmd/Ctrl+K) open Kbar.
- Checkout modal successfully shows shipping options; selection persists until payment.
- Client error logs received with correlation IDs.
 - Product `/products/test-vinyl-dark-rituals` is reachable (200) and shows Add to Cart (after seed).

## Immediate Next Steps
- Confirm branch envs (`STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SERVICE_ROLE`, `NEXT_PUBLIC_SITE_URL`) and redeploy if they change.
- Manually step through `/products/test-vinyl-dark-rituals` after deploy to ensure hydration renders image + CTA (seed data now works).
- Review `/legal/*` placeholder copy and adjust language/links as needed.
- Extend puppeteer smoke to re-enable catalog navigation and cart flow once data is ready; capture checkout screenshots thereafter.

### Launch Readiness Roadmap (2025-09-18)

**Ready to execute now (no new keys required)**
1. **Content & storefront polish**
   - Swap in branded `public/og-image.jpg` (currently placeholder).
   - Final pass on `/legal/*` copy for tone, spelling, and correct links.
   - Ensure every catalog card has imagery + consistent descriptions.
2. **Owner enablement**
   - Record screenshots / loom for “Add new product” workflow (see `docs/ADMIN-WORKFLOWS.md`).
   - Finalize `docs/ADMIN-VISUALS-RFC.md` with acceptance checklist (what “done” looks like for UI polish).
   - ✅ Draft a one-page “Admin quick start” (`docs/OWNER-HANDBOOK.md`).
3. **QA automation**
   - Extend Puppeteer checkout flow to log Stripe session creation and save Stripe landing screenshot (blocked on publishable key — mark TODO once key arrives).
   - Add Vitest/Playwright coverage for `/api/stripe/webhook` (use Stripe CLI fixture).
4. **Data/backfill**
   - ✅ Create `scripts/backfill-orders.mjs` stub to migrate legacy data when available.
   - Seed demo orders via `docs/SUPABASE-SEED.md` (optional) for dashboard visuals on staging.

**Blocked until keys arrive**
1. **Stripe publishable key (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)**
   - Surface wallet buttons in checkout (Apple/Google Pay).
   - Prefill customer email in Stripe checkout to reduce friction.
   - Puppeteer checkout assertion capturing Stripe hosted page.
2. **AusPost credentials**
   - Switch `/api/shipping/quote` to live rates; update checkout messaging.
   - Add AusPost status card on dashboard (optional).
   - QA: run sample addresses (domestic & NZ) to validate rate response.

**Go-live checklist (once keys in hand)**
1. Add keys (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, AusPost vars) to Netlify & `.env.local`; redeploy `dev`.
2. Confirm Stripe webhook delivery succeeds (Stripe dashboard → Events).
3. Run full smoke:
   - `npm run test:puppeteer` with admin creds.
   - Manual checkout of `test-vinyl-dark-rituals` (cancel before payment) ensuring Stripe session shows correct shipping + total.
4. Update `docs/SESSION-YYYY-MM-DD.md` with final QA notes and Stripe session IDs.
5. Merge `dev → main`, trigger production deploy, perform last live smoke (`/`, `/products/slug`, `/admin/dashboard`).
