# Repository Guidelines

> **Current status (2025-10-24):** Netlify Branch Deploys (`dev` and `main`) are the single source of truth—treat them as production candidates. Supabase keys are present on `dev` (see `/status`), but OpenAI credentials and assistant actions still need a live check before we rely on the copilot. Local `npm run build`, `npm run lint`, and `npm test` remain red due to admin typings and Stripe/AusPost mocks; only run them when you are actively fixing those suites. Track owner-reported issues (e.g., admin login loop on `main`) in `docs/NEXT-STEPS.md` until resolved.

See `docs/README.md` for the full documentation index and session logs.

## Project Structure & Module Organization
- `app/` – Next.js App Router routes. `app/(site)` drives the public storefront; `app/admin` hosts the Refine/AntD admin.
- `src/components`, `src/lib`, `src/hooks` – Shared UI blocks, helpers, and client utilities. Prefer colocating tests under `tests/`.
- `integrations/`, `lib/supabase` – Supabase client factories plus external service adapters (Stripe, AusPost).
- `supabase/` – SQL migrations, RLS policies, MCP config. Never edit tables in the dashboard without exporting a migration.
- `docs/` – Working agreements, RFCs, QA guides, and continuation prompts; keep every file synchronized with shipped behaviour.

## Build, Test & Development Commands
- **Remote-first:** Trigger Netlify builds by pushing to `dev`/`main`, then validate the branch deploy. Use the local commands below only when fixing the suites—they currently fail for known reasons.
- `npm run dev` – Optional local preview with App Router + Supabase SSR helpers (requires env parity).
- `npm run type-check`, `npm run lint`, `npm test` – Keep documenting blockers in the session log when you attempt them; the admin `no-explicit-any` debt and checkout/Stripe mocks still cause failures.
- `npm run build && npm start` – Local production smoke for debugging build regressions (known to crash on this machine—capture logs if you retry).
- `npm run test:puppeteer` – Use with `BASE_URL=https://dev--obsidianriterecords.netlify.app` for remote smoke if screenshots are needed.
- `npm run assistant:sync` – Refresh copilot embeddings after updating assistant-related docs.
- `npx playwright test e2e/tests/smoke.spec.ts` – Deeper storefront coverage during regression hunts (run only when suites are stable).

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
- Whenever a user pastes prompts or snippets that reference external APIs/frameworks, consult the official developer documentation first to validate variable names, required headers, and formatting before coding changes or replies.
