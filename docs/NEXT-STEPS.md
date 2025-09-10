# Next Steps (Dev Branch)

This doc tracks the immediate backlog now that production auth is live. All work happens on `dev`; main stays protected until we say “go live”.

## Current Status — 2025-09-10
- Node 22 on Netlify + local; Next runtime v5 in use.
- Copy/code: centralized strings in `src/content/copy.ts`; Preorders copy updated.
- SEO: default title/description fixed; no duplicate brand in `<title>`.
- Admin: Users & Roles page added (`/admin/users`) + API to grant/remove admin; Google OAuth now auto‑creates a `customers` row.
- Cache safety: homepage served with `Cache-Control: no-store` + page is `force-dynamic` to avoid stale SSR payloads; static assets are immutable.
- Dev and main deployed; homepage served with `no-store`. If any stale persists, consider a Netlify `_headers` rule for `/` with `Cache-Control: no-store`.

## Product Detail — Progress
- Implemented `/products/[slug]` page wired to Supabase (server route) with SEO metadata + Product JSON‑LD.
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

Next:
- Add optional correlation ID (e.g., from headers) to tie client logs to sessions.
- Consider simple dedup persistence keyed by session (server memory is best-effort only).

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

## Branch Discipline
- Work on `dev`. Small, reversible commits.
- Merge to `main` only when branch deploy is green + manual QA passed.

## Rollback
- If `main` breaks: `git revert <sha>` → push → Netlify redeploys previous good state.
