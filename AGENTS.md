# Repository Guidelines

Note: This repo follows the Codex CLI branch‑only workflow. For agent behavior details, see `docs/agents.md`.

## Project Structure & Modules
- `app/`: Next.js App Router routes, API, and layouts.
- `src/`: shared code (`components/`, `contexts/`, `hooks/`, `lib/`, `integrations/`).
- `lib/`: server/client utilities used by `app/` (SEO, Supabase, etc.).
- `public/`: static assets.  `docs/`: documentation.  `scripts/`: helper scripts.
- `tests/`: unit/integration tests (Vitest).  `e2e/`: Playwright tests.
- Use absolute imports via `@/` aliases (see `tsconfig.json`).

## Build, Test, and Dev
- `npm run dev`: start Next.js locally on `3000`.
- `npm run build`: production build (runs `prebuild` env checks).
- `npm start`: serve the production build.
- `npm run lint`: ESLint checks.  `npm run type-check`: TypeScript only.
- `npm test`: Vitest.  `npm run test:coverage`: with coverage.
- `npm run test:e2e`: Playwright e2e; `npm run test:e2e:ui` for UI runner; run `npm run test:e2e:install` once locally.
- Use Node 22 locally (e.g., `nvm use 22`).

## Coding Style & Naming
- Language: TypeScript (Node `22`, React 18, Next.js 15 App Router).
- Formatting: follow ESLint (`next/core-web-vitals`, TS rules). Two‑space indents, semicolons ok.
- Components: PascalCase (`MyComponent.tsx`). Routes/segments: kebab‑case and bracketed params.
- Utilities/hooks: camelCase files (`useThing.ts`, `formatPrice.ts`). Tailwind via `className` utilities.

## Testing Guidelines
- Framework: Vitest with `happy-dom` env (see `vitest.config.ts`).
- Location: place tests under `tests/` with `*.test.ts`/`*.test.tsx`.
- Coverage: aim for meaningful coverage on API routes and critical helpers.
- E2E: add Playwright specs under `e2e/tests`; prefer data‑testids over brittle selectors.

## Branching & Deploy
- No PRs: solo workflow. Work on a feature branch (`feat/<scope>-<slug>`). Keep only one active branch; keep branches short‑lived.
- Verify on Netlify Branch Deploy; test via the branch URL.
- Merge criteria (all green): `npm run type-check`, `npm run lint`, `npm test`, `npm run test:e2e`, and manual QA (admin/user flows) on the branch URL.
- Sync and resolve conflicts before merge: `git fetch origin && git rebase origin/main`.
- Go‑live: fast‑forward merge to `main` then push.
  - Example: `git checkout main && git merge --ff-only feat/<name> && git push origin main && git branch -d feat/<name>`
- Push small commits daily; never push directly to `main`. Revert fast if issues arise, then fix forward on a branch.

## Go‑Live Recommendations & Merge Timing
- Prefer off‑peak hours for merges to `main` (local late evening).
- Merge only when the branch deploy is green and visually verified (see checklist).
- Confirm Netlify envs are present for the target (SUPABASE_URL/ANON/SERVICE + NEXT_PUBLIC_SITE_URL).
- If infra changes (Node, runtime) are included, do a dry run on the branch first; then bump production.
- After merging to `main`, monitor the site for 10–15 minutes and be ready to revert immediately if any regression is seen.

## Manual Visual QA Checklist (Branch Deploy)
- Home: page renders without console errors; hero, navigation, and images load.
- Catalog: product grid populates; filters/tabs respond; no broken images.
- Admin: `/admin/login` renders; login flow works for `arg@obsidianriterecords.com`.
- Admin Inventory: table loads; actions visible; no runtime errors on open.
- SEO: `/robots.txt` and `/sitemap.xml` load (can be static fallback in previews).
- Basic perf sanity: quick Lighthouse or network scan for obvious asset errors.

## Anti‑Sprawl Guidelines
- Prefer existing top‑level dirs; avoid adding new roots.
- Co‑locate feature UI under `app/admin/...` or `app/(site)/...`.
- Shared UI → `src/components/ui`; services → `src/services`; utils → `src/lib`.
- Reuse patterns in `@/lib/seo`, `@/integrations/supabase`; add narrowly scoped modules.

## Commit Guidelines
- Conventional style: `feat:`, `fix:`, `chore:`, `docs:`.
- Include clear scopes (e.g., `fix(admin/auth): …`). Use imperative tone.

## Security & Configuration
- Never commit secrets. Copy `.env.example` → `.env.local` and set Supabase/Stripe keys.
- Versions: Node 22 locally; Next.js 15; React 18; TypeScript 5. Netlify may use a different Node until switched.
- Netlify deploys from `main`; use Branch Deploys for features.
- `scripts/check-env.mjs` validates critical envs at build; prefer safe fallbacks in previews.

## Session Logs
- Latest detailed session notes: `docs/SESSION-2025-09-06.md`
