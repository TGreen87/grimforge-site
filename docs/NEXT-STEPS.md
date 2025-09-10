# Next Steps (Dev Branch)

This doc tracks the immediate backlog now that production auth is live. All work happens on `dev`; main stays protected until we say “go live”.

## Current Status — 2025-09-10
- Node 22 on Netlify + local; Next runtime v5 in use.
- Copy/code: neutralized site phrasing; centralized strings in `src/content/copy.ts`.
- SEO: default title/description fixed; no duplicate brand in `<title>`.
- Admin: Users & Roles page added (`/admin/users`) + API to grant/remove admin; Google OAuth now auto‑creates a `customers` row.
- Cache safety: homepage served with `Cache-Control: no-store` + page is `force-dynamic` to avoid stale SSR payloads; static assets are immutable.
- Dev and main deployed; some live pages still render old phrases due to previous CDN HTML. The cache headers are now in place — one more deploy + hard refresh should present fresh copy. If any stale persists, we will add a Netlify `_headers` fallback for `/` as a belt‑and‑braces.

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
