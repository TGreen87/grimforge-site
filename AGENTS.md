# Repository Guidelines

> **Current status (2025-11-20):** Netlify Branch Deploys (`dev_stripe` and `main`) are the single source of truth. `dev_stripe` is the active feature branch for payments. Stripe Checkout is wired up and functional (test mode). Local `npm run build` and `npm test` still have known issues (admin typings), but `npm run lint` is cleaner after recent fixes.

See `docs/README.md` for the full documentation index and session logs.

## Project Structure & Module Organization
- `app/` – Next.js App Router routes. `app/(site)` drives the public storefront; `app/admin` hosts the Refine/AntD admin.
- `src/components`, `src/lib`, `src/hooks` – Shared UI blocks, helpers, and client utilities.
- `integrations/`, `lib/supabase` – Supabase client factories plus external service adapters (Stripe, AusPost).
- `supabase/` – SQL migrations, RLS policies, MCP config.
- `docs/` – Working agreements, RFCs, QA guides, and continuation prompts.

## Build, Test & Development Commands
- **Remote-first:** Trigger Netlify builds by pushing to `dev_stripe`/`main`.
- `npm run dev` – Optional local preview.
- `npm run lint` – Run before pushing.
- `npm run type-check` – Run before pushing (expect some admin-related failures).
- `npm run test` – Vitest suites (currently some failures due to mocks).
- `npm run test:puppeteer` – Use with `BASE_URL` for remote smoke.

## Coding Style & Naming Conventions
- TypeScript everywhere.
- Tailwind for styling.
- Prefer Supabase RPCs for analytics.
- **Never commit env secrets.**

## Testing Guidelines
- Co-locate unit specs under `tests/`.
- Document skipped specs.
- Targeted Playwright specs in `e2e/tests/**`.

## Assistant Copilot Expectations
- Undo tokens must be generated for destructive actions.
- Log all assistant mutations.

## Commit & Deployment Workflow
- Work on `dev_stripe` for current payment features.
- Push after local verification (lint/type-check).
- Confirm Netlify branch deploy before promoting to `main`.
- Update `docs/NEXT-STEPS.md` and session logs.
