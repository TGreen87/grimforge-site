# Repository Guidelines

See `docs/README.md` for doc map.

## Project Structure & Module Organization
- `app/` – App Router routes and layouts.
- `components/` + `src/` – UI blocks/modules migrating to App Router.
- `lib/` + `integrations/` – Supabase clients, formatting helpers, and external service adapters.
- `supabase/` – SQL, policies, MCP config; never commit secrets.
- `tests/`, `e2e/`, `scripts/` – Vitest units, Playwright flows, automation tasks.
- `docs/` – process guides (`docs/NEXT-STEPS.md`, QA checklists) that should evolve with features.

## Build, Test & Development Commands
- `npm run dev` – start app at http://localhost:3000 with Supabase auth context.
- `npm run build && npm start` – smoke the production bundle before pushing.
- `npm run lint` + `npm run type-check` – ESLint and TypeScript gates for merge readiness.
- `npm run test` / `npm run test:coverage` – Vitest suites; keep new logic ≈80% covered.
- `npm run test:e2e` – Playwright flows (`--ui` to debug); `npm run test:puppeteer` for smoke screenshots.
- `npm run init` – rerun env validation after dependency or schema updates.

## Coding Style & Naming Conventions
- Prefer `const`, explicit returns in server actions, and narrow generics.
- Follow App Router patterns; add `"use client"` atop interactive modules.
- `PascalCase` components, `camelCase` helpers, kebab-case routes/files.
- Order Tailwind classes layout → spacing → color; use `tailwind-merge` to dedupe.
- `npm run lint` gates merges; config extends `eslint-config-next` with Hooks guardrails.

## Testing Guidelines
- Place unit specs in `tests/**` mirroring source paths, named `*.test.ts(x)`.
- Keep Playwright specs in `e2e/` for checkout, admin, and catalog flows; tag `@smoke` for CI subsets.
- Keep Puppeteer smoke (`npm run test:puppeteer`) green; review `docs/qa-screenshots/`.
- Mock Supabase with `@supabase/ssr`; avoid live network calls in unit runs.
- When the campaign hero flag is on, sanity-check all layouts (classic/split/minimal) before shipping.
- Verify catalog quick actions (hover/focus Add to cart + wishlist) in QA when product card changes ship.

## Commit & Deployment Workflow
- Write imperative commit summaries (e.g., `Add campaign revision history`).
- Squash WIP and push to `dev`; deployments trigger from this branch, no PR gate.
- Link RFCs/issues and add UI screenshots when visuals change.
- Run `npm run build` plus baseline tests before push; confirm Netlify preview.
- Store secrets in `.env.local`, Netlify, or Supabase—never in Git.

## Security & Configuration Tips
- Load required env vars per `docs/ENV-QUICKSTART.md` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`).
- Update `supabase/` through SQL migrations to preserve policy history; export dashboard edits first.
- Review `netlify.toml` and `/middleware.ts` before changing redirects or auth and rerun `npm run build`.
