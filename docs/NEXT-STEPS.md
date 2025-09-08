# Next Steps (Dev Branch)

This doc tracks the immediate backlog now that production auth is live. All work happens on `dev`; main stays protected until we say “go live”.

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

## Branch Discipline
- Work on `dev`. Small, reversible commits.
- Merge to `main` only when branch deploy is green + manual QA passed.

## Rollback
- If `main` breaks: `git revert <sha>` → push → Netlify redeploys previous good state.

