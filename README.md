# Obsidian Rite Records

Next.js 15 e-commerce platform for Obsidian Rite Records, built with Tailwind, Supabase, Stripe, and Netlify Branch Deploys.

## Fast Start
```bash
npm install
npm run dev
```
The app boots at http://localhost:3000 once required env vars are present (see `docs/ENV-QUICKSTART.md`).

## Development Workflow
- Working branch: `dev` (single-branch). Pushes deploy automatically to https://dev--obsidianriterecords.netlify.app.
- Follow the contributor playbook in [Repository Guidelines](AGENTS.md) before shipping.
- Track backlog and QA status through `docs/NEXT-STEPS.md` and `docs/QA-CHECKLIST.md`.

## Project Structure
- `app/` – App Router routes, layouts, server actions, and metadata.
- `components/` – Shared UI building blocks (seo helpers, layout primitives).
- `src/` – Legacy React SPA modules (components, contexts, services) kept for staged migration.
- `lib/` (App Router) and `integrations/` – Utilities, Supabase clients, and external service connectors.
- `supabase/` – SQL migrations, policies, and MCP config; secrets stay external.
- `tests/`, `e2e/`, `scripts/` – Vitest suites, Playwright smoke/regression flows, automation tasks.
- `docs/` – Project playbooks, RFCs, and launch checklists (see map below).
- `public/` – Static assets (hero media, icons, favicons).

## Key Commands
- `npm run dev` – start local dev server with Supabase auth context.
- `npm run build && npm start` – verify production bundle before pushing.
- `npm run lint` / `npm run type-check` – ESLint + TypeScript gates.
- `npm run test` / `npm run test:coverage` – Vitest suites with coverage.
- `npm run test:e2e` – Playwright flows (`--ui` for debugging).
- `npm run test:puppeteer` – smoke test generating QA screenshots.
- `npm run init` – re-validate env configuration after schema/dep updates.

## Environment Setup
Minimum runtime secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_ROLE`)
- `STRIPE_SECRET_KEY`
Optional publishable + feature flags and AusPost keys live in Netlify or `.env.local`. Full matrix lives in `docs/ENV-QUICKSTART.md`.

## Documentation Map
- [`docs/README.md`](docs/README.md) – Central index for all project documentation.
- [Repository Guidelines](AGENTS.md) – Contributor rules, commands, testing expectations.
- [`docs/NEXT-STEPS.md`](docs/NEXT-STEPS.md) – Active backlog and dependencies.
- [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) – Phase-by-phase delivery plan.
- [`docs/ENV-QUICKSTART.md`](docs/ENV-QUICKSTART.md) – Environment variables and verification checklist.
- [`docs/OWNER-HANDBOOK.md`](docs/OWNER-HANDBOOK.md) – Ops guidance for handoffs and releases.
- [`docs/QA-CHECKLIST.md`](docs/QA-CHECKLIST.md) – Manual + automated QA steps before deploy.

## Deployment Notes
- Pushes to `dev` auto-deploy to the Netlify branch preview; verify smoke + key flows post-deploy.
- Promote to `main` only after the owner’s explicit “Go live on main”.
- Keep secrets out of Git; manage them through Netlify UI or local `.env.local`.
