# Implementation Plan (Dev Branch)

This document captures the end-to-end plan to finish the storefront and admin for Obsidian Rite Records. It aligns with the solo workflow on the `dev` branch and Netlify Branch Deploys.

## Objectives
- Align platform/runtime on Node 22 across local and Netlify.
- Ship a functional Product Detail page wired to Supabase + Checkout.
- Deliver an Articles MVP with admin editor and public pages.
- Add admin bulk CSV import/export (price/active first) with a safe dry-run.
- Improve observability with a client error logging endpoint.
- Tighten production admin gating while keeping preview flows easy for QA.
- Bring tests and copy in line with real UX; polish UI.

## Phases & Tasks

### Phase 0 — Platform Alignment
- Netlify Node: bump to Node `22` (done via `netlify.toml`).
- Verify branch build and runtime on `dev` (manual QA + basic tests).

Acceptance:
- Branch deploy builds successfully under Node 22; `/status` shows env presence; `/admin/login` loads and allows login in preview.

### Phase 1 — Product Detail MVP
- Data: fetch product by `slug` from Supabase (variants + inventory where present). [implemented]
- UI: title/artist, image, price, availability; basic variant selector. [done]
- Action: “Buy Now” that POSTs to `/api/checkout` and redirects to Stripe Checkout. [done]
- SEO: metadata + product JSON‑LD. [metadata done; JSON‑LD pending]

Acceptance:
- Visiting `/products/[slug]` renders real data; checkout creates Stripe session; insufficient inventory/inactive are gracefully handled. [partially met]

### Phase 2 — Articles MVP
- DB: `articles` table (slug, title, markdown, image, author, published, timestamps). [pending]
- Admin: Refine resource for create/edit (markdown), publish toggle. [pending]
- Public: `/articles` list and `/articles/[slug]` detail; SEO + article JSON‑LD. [partial — JSON‑LD scaffolded]

Acceptance:
- Admin can publish/unpublish; public routes render published articles with metadata.

### Phase 3 — Admin Bulk CSV (Price/Active)
- Export selected rows to CSV (products).
- Import CSV with dry‑run; show per‑row errors; apply changes with audit logs.
- Gate behind `NEXT_PUBLIC_ENABLE_ADMIN_BULK="1"`.

Acceptance:
- Dry‑run preview shows changes; apply commits updates; audit logs written; export works for filters.

### Phase 4 — Observability
- Add `/api/client-logs` to collect client-side error events. [done]
- Lightweight browser logger (breadcrumbs + correlation id, rate-limited POST). [done]
- Add rate limiting, dedupe, and size guards on server route. [done]
- Wire `ErrorBoundary` to log critical errors. [pending]

Acceptance:
- Client errors persist (Supabase) with essential context; can be filtered by time/user. [partially met]

### Phase 4.1 — Shipping (AusPost Scaffold)
- Add AusPost quote service and API: `src/services/shipping/auspost.ts`, `POST /api/shipping/quote`. [done]
- Update checkout to accept a selected shipping option (`shipping_rate_data` or `{ shipping: ... }`) and compose Stripe Checkout accordingly. [done]
- Degrade to static Stripe rates when AusPost env is absent. [done]

Acceptance:
- With `AUSPOST_API_KEY` and origin configured, shipping options return from `/api/shipping/quote` for AU and international; when not configured, static Stripe rates are returned. Checkout reflects the chosen option.

### Phase 5 — Admin Gating (Prod Only)
- Keep previews relaxed; on production, require `user_roles.role = 'admin'` server-side.
- Ensure non-admins see a friendly restriction (read-only or access denied page).

Acceptance:
- In production, non‑admin cannot write; previews remain frictionless.

### Phase 6 — Tests & Copy Alignment
- Update webhook test to match route behavior (200 on internal errors to avoid Stripe retries) or adjust route to return 200 consistently.
- Add tests for product detail metadata and checkout wiring.
- Apply new site/admin copy; purge “placeholder” voice.

Acceptance:
- `npm test` green locally; critical e2e flows pass on branch deploy; copy consistent with brand tone.

### Phase 7 — UI Polish
- Header: active link state; ensure cart count live; “Shop” anchor to catalog; render from central navLinks. [ongoing]
- Hero: poster + reduced-motion fallback; improve overlay contrast; a11y labels on controls. [ongoing]
- Catalog: skeletons, consistent card sizes; badges for Limited/Pre‑order; counts line under header. [partial]
- Footer: working social links; add Shipping/Returns/Contact quick links; hash anchors jump + tab sync. [done]
- Mobile polish: adjust paddings, drawers, grid spacing for small screens. [planned]
- Cache safety: set Cache‑Control no‑store for homepage HTML on branch deploys to avoid stale SSR payloads; long‑cache immutable for static assets. [done]

Acceptance:
- Visual QA checklist passes; improved a11y and consistency across pages.

### Phase 8 — Supabase Client Unification
- Standardize on `@/integrations/supabase/*` and remove duplicates in `lib/` and `src/lib/` where safe.

Acceptance:
- Single client path used across app; no regressions.

### Phase 9 — Docs & Branch Discipline
- Align docs to `dev` as working branch (done: `docs/AGENTS.md`, `scripts/init.mjs`).
- Keep `docs/NEXT-STEPS.md` and this plan updated as we complete phases.
- Add Admin improvements: Users & Roles UI (grant/remove admin by email), OAuth customers auto‑provision, future admin polish roadmap. [in progress]
- Add Payments Enhancements: wallet support via Stripe Checkout (Apple/Google Pay), PayPal investigation (separate integration).
- Add Data Seeding: scripts to populate products/orders for branch testing.

### Phase 10 — Admin Visual Overhaul
- Goals: improve readability, hierarchy, and speed in daily ops; align visuals with brand while keeping Refine/AntD usability.
- Tasks:
  - Theme tokens: colors, typography scale, spacing, radii, shadows; consistent dark mode.
  - Layout: tighter header/sider; improved section headers; breadcrumbs.
  - Tables: denser rows option, sticky headers, zebra, selection affordances, compact column presets.
  - Forms: vertical rhythm, clearer labels/help text, inline validation, field grouping.
  - Buttons/controls: sensible sizes for desktop/mobile; accessible focus states.
  - Empty/loading: skeletons and helpful empty-state messaging.
  - Quick actions: inline price/active/stock editors, Receive Stock dialog clarity (SKU/notes).
- Acceptance:
  - All admin pages adopt the new theme; key flows (Products, Stock Units, Inventory, Orders) feel faster and clearer on desktop and tablet.

Status:
- RFC created: `docs/ADMIN-VISUALS-RFC.md` [done]
- Default density set to `small` via ConfigProvider; table/header tokens aligned [done]
- Modern shell (header+sider) with breadcrumbs and header search tied to Kbar [done]
- Table toolbar with density and column presets (persist per resource) [done]
- Alternate views:
  - Products → Cards [done]
  - Orders → Board with drag-and-drop status updates [done]
  - Inventory → Cards + quick filters (All/Low/Out) [done]
  - Customers → Cards [done]
  - Articles → Cards [done]
- Kbar actions registered (create product/article/stock unit, jump to boards/cards) [done]

### Phase 11 — Site Visual Improvements
- Goals: improve hierarchy and readability on mobile and desktop; keep brand vibe.
- Tasks:
  - Header/Menu polish; hero readability; section spacing.
  - Catalog: card uniformity, badges, skeletons, grid consistency.
  - Product: image sizing, variant selector visual treatment, CTA grouping.
  - Footer: links and spacing on mobile.
- Acceptance:
  - Mobile pages have no overflow; tap targets are accessible; layout feels consistent across sections.

## Rollback
- Netlify: reset Node to previous major if a runtime regression appears; rebuild branch.
- App: feature toggles for bulk tools; revert specific commits on `dev` to stabilize.

## Dependencies & Secrets
- Supabase: URL/ANON/SERVICE in Netlify env only (never client for SERVICE).
- Stripe: secrets in Netlify env; webhook secret configured.
- AI Wizard: if enabled, proxy ChatGPT API key via server function; never expose client-side.

## Milestones
- M0: Node 22 deployed + build verified.
- M1: Product Detail MVP live.
- M2: Articles MVP live.
- M3: Bulk CSV live.
- M4: Logging + gating + tests polished.

> Status is tracked in the Codex plan tool and this document. Copy updates will be applied in Phase 6.
