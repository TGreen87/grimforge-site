# Repository Guidelines

> **Current status (2025-09-24):** Focus is on launch readiness. Netlify `dev` deploy needs Supabase + OpenAI env vars restored before the admin copilot will run. Lint/tests are red—stabilise them before merging to `main`.

See `docs/README.md` for the full documentation index and session logs.

## Project Structure & Module Organization
- `app/` – Next.js App Router routes. `app/(site)` drives the public storefront; `app/admin` hosts the Refine/AntD admin.
- `src/components`, `src/lib`, `src/hooks` – Shared UI blocks, helpers, and client utilities. Prefer colocating tests under `tests/`.
- `integrations/`, `lib/supabase` – Supabase client factories plus external service adapters (Stripe, AusPost).
- `supabase/` – SQL migrations, RLS policies, MCP config. Never edit tables in the dashboard without exporting a migration.
- `docs/` – Working agreements, RFCs, QA guides, and continuation prompts; keep every file synchronized with shipped behaviour.

## Build, Test & Development Commands
- `npm run dev` – Launch local dev with App Router + Supabase SSR helpers.
- `npm run type-check`, `npm run lint`, `npm test` – Run before pushing. *Status (2025-09-24):* lint/test currently fail due to admin typings and Stripe/checkout mocks; log results in the session file until fixed.
- `npm run build && npm start` – Production build smoke; run before promoting `dev → main`.
- `npm run test:puppeteer` – Branch deploy smoke (homepage, catalog, product, checkout, admin login); screenshots land under `docs/qa-screenshots/`.
- `npm run assistant:sync` – Refresh copilot embeddings after updating assistant-related docs.
- `npx playwright test e2e/tests/smoke.spec.ts` – Deeper storefront coverage during regression hunts.

## Build, Test & Development Commands
- `npm run dev` – Launch local dev with App Router + Supabase SSR helpers.
- `npm run type-check`, `npm run lint`, `npm test` – Baseline gates before any push. *Current status:* lint/test harnesses include legacy failures (admin `no-explicit-any`, checkout/Stripe/SEO suites); document skips and unblock before promoting to `main`.
- `npm run build && npm start` – Production build smoke; run before promoting `dev → main`.
- `npm run test:puppeteer` – Netlify smoke (homepage, catalog, product, checkout shell, admin login) with screenshots in `docs/qa-screenshots/`.
- `npm run assistant:sync` – Refresh copilot embeddings after updating docs the assistant relies on (see `docs/AGENT-PIPELINES.md`).
- `npx playwright test e2e/tests/smoke.spec.ts` – Deeper storefront coverage when investigating regressions.

## Coding Style & Naming Conventions
- TypeScript everywhere; `const` by default. Explicit return types on server actions/API routes.
- Components in `PascalCase`, helpers in `camelCase`, route folders in kebab-case.
- Tailwind class order: layout → spacing → color → state. Use shared tokens (`blackletter`, `gothic-heading`) and the Marcellus heading font via `var(--font-heading)`.
- Prefer Supabase RPCs for analytics-heavy queries; wrap fetchers in `lib/`.
- Never commit env secrets or Supabase API keys.

## Testing Guidelines
- Co-locate unit specs under `tests/` mirroring source paths; keep new logic ≈80% covered with Vitest or Playwright.
- Document and isolate skipped specs (currently assistant undo + webhook/checkout suites) with TODOs referencing blockers before re-enabling.
- Targeted Playwright specs live in `e2e/tests/**`; guard unstable suites with tags.
- Storytelling surfaces (timeline/testimonials/newsletter) and the Journal section are data-driven—verify they stay hidden when tables are empty.
- Checkout sheet is a three-step slide-over; wallets remain disabled until a Stripe publishable key is configured.
- Record lint/test outcomes in `docs/SESSION-YYYY-MM-DD.md` before pushing; note blockers when suites remain red.

## Assistant Copilot Expectations
- Undo tokens must be generated for product/article/hero pipelines and surfaced in the drawer; verify `/api/admin/assistant/actions/undo` responds 200 on valid tokens before closing a feature slice.
- Plan previews (multi-step descriptions + risk callouts) appear with every suggested action; adjust `lib/assistant/plans.ts` when new actions land.
- Log all assistant mutations through `assistant_sessions`, `assistant_session_events`, `assistant_uploads`, and `assistant_action_undos`; keep docs and QA steps aligned when events or schema evolve.
- If env secrets are missing (e.g., Supabase service role, OpenAI key), pause copilot testing and record the blocker in `docs/NEXT-STEPS.md`/session log.

## Commit & Deployment Workflow
- Work directly on `dev`; no PRs. Keep commits imperative (e.g., `Remove placeholder story seeds`).
- Push after lint/type/test + Puppeteer and record results in the latest `docs/SESSION-*.md`. When baseline suites are red, note the failing commands with reasons in the session log before pushing.
- Confirm the Netlify branch deploy (`https://dev--obsidianriterecords.netlify.app`) before promoting to `main`; production deploy happens only after explicit “Go live on main”.
- Update `docs/NEXT-STEPS.md`, `docs/IMPLEMENTATION-PLAN.md`, and `docs/CONTINUE-PROMPT.md` whenever scope or plan shifts. Reflect new automation (assistant undo tokens, plan previews) in both docs and QA checklists the same day they ship.
