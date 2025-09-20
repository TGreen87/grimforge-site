# Repository Guidelines

See `docs/README.md` for the full documentation index and session logs.

## Project Structure & Module Organization
- `app/` – Next.js App Router routes. `app/(site)` drives the public storefront; `app/admin` hosts the Refine/AntD admin.
- `src/components`, `src/lib`, `src/hooks` – Shared UI blocks, helpers, and client utilities. Prefer colocating tests under `tests/`.
- `integrations/`, `lib/supabase` – Supabase client factories plus external service adapters (Stripe, AusPost).
- `supabase/` – SQL migrations, RLS policies, MCP config. Never edit tables in the dashboard without exporting a migration.
- `docs/` – Working agreements, RFCs, QA guides, and continuation prompts; keep every file synchronized with shipped behaviour.

## Build, Test & Development Commands
- `npm run dev` – Launch local dev with App Router + Supabase SSR helpers.
- `npm run type-check`, `npm run lint`, `npm test` – Baseline gates before any push.
- `npm run build && npm start` – Production build smoke; run before promoting `dev → main`.
- `npm run test:puppeteer` – Netlify smoke (homepage, catalog, product, checkout shell, admin login) with screenshots in `docs/qa-screenshots/`.
- `npx playwright test e2e/tests/smoke.spec.ts` – Deeper storefront coverage when investigating regressions.

## Coding Style & Naming Conventions
- TypeScript everywhere; `const` by default. Explicit return types on server actions/API routes.
- Components in `PascalCase`, helpers in `camelCase`, route folders in kebab-case.
- Tailwind class order: layout → spacing → color → state. Use shared tokens (`blackletter`, `gothic-heading`) and the Marcellus heading font via `var(--font-heading)`.
- Prefer Supabase RPCs for analytics-heavy queries; wrap fetchers in `lib/`.
- Never commit env secrets or Supabase API keys.

## Testing Guidelines
- Co-locate unit specs under `tests/` mirroring source paths; keep new logic ≈80% covered.
- Targeted Playwright specs live in `e2e/tests/**`; guard unstable suites with tags.
- Storytelling surfaces (timeline/testimonials/newsletter) and the Journal section are data-driven—verify they stay hidden when tables are empty.
- Checkout sheet is a three-step slide-over; wallets remain disabled until a Stripe publishable key is configured.

## Commit & Deployment Workflow
- Work directly on `dev`; no PRs. Keep commits imperative (e.g., `Remove placeholder story seeds`).
- Push after lint/type/test + Puppeteer and record results in the latest `docs/SESSION-*.md`.
- Confirm the Netlify branch deploy (`https://dev--obsidianriterecords.netlify.app`) before promoting to `main`; production deploy happens only after explicit “Go live on main”.
- Update `docs/NEXT-STEPS.md`, `docs/IMPLEMENTATION-PLAN.md`, and `docs/CONTINUE-PROMPT.md` whenever scope or plan shifts.
