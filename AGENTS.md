# Codex Agent Playbook — grimforge-site

_Last updated: 2025-09-18_

## Project Snapshot
- Stack: Next.js 15 App Router, TypeScript, Tailwind, Refine/AntD admin, Stripe, Supabase.
- Working branch: `dev` (single branch workflow). Production deploy happens only after the owner says “Go live on main”.
- Branch deploy URL: https://dev--obsidianriterecords.netlify.app.
- Primary docs: `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`, `docs/SITE-VISUALS-RFC.md`, `docs/ADMIN-VISUALS-RFC.md`, `docs/QA-CHECKLIST.md`, `docs/SUPABASE-SEED.md`.

## Operating Rules
- Always plan first (`update_plan`) when work spans multiple steps; exactly one step may be `in_progress`.
- Push directly to `dev`. Never open PRs. Promote to `main` only with explicit “Go live on main”.
- Branch deploy is the QA surface. After every meaningful push, verify the Netlify deploy.
- Keep secrets out of the repo. Runtime env vars live in Netlify / local `.env.local` (see `docs/ENV-QUICKSTART.md`).
- Default to automation: if the backlog already calls out work, execute the next safe step instead of asking the owner for direction.
- Stay heads-down until a slice is complete: do not pause for handoff unless blocked or ready to report significant progress.

## Environment Checklist
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Optional: AusPost keys for live shipping quotes, Stripe webhook secret, `NEXT_PUBLIC_ENABLE_ADMIN_BULK`.
- `/status` endpoint reports presence of Supabase envs and site URL.

## Tooling
- **Shell**: prefer `rg` / `rg --files`, avoid noisy commands. No `sudo` or long-running scripts.
- **Supabase MCP**: configured via `supabase/config.toml` with access token `sbp_*`. Use MCP SQL for seed/bootstrap (`docs/SUPABASE-SEED.md`).
- **Puppeteer smoke**: `npm run test:puppeteer`. Verifies homepage, vinyl anchor, seeded product slug, robots/sitemap, admin login. Screenshots in `docs/qa-screenshots/`.
- **Local validation**: `npm run type-check`, `npm run build`. Use seeded Supabase data when testing `/products/[slug]`.

## Current Dev Highlights
- Admin dashboard upgraded with KPI cards, revenue/low-stock charts, needs fulfilment panel, announcement editor, and CSV exports.
- Customers/orders schema now persists checkout data; Stripe webhook handler syncs payment status.
- Supabase functions `orders_revenue_series` and `inventory_low_stock_trend` power dashboard analytics.
- Smoke automation (`npm run test:puppeteer`) covers public routes + admin login; screenshots stored in `docs/qa-screenshots/`.
- Bulk cancel/refund tooling and PDF packing slips live; admin settings control alert thresholds + Slack webhook.
- Campaign-driven hero available behind `NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN` flag (legacy hero as fallback).

## Active TODOs (see `docs/NEXT-STEPS.md` for detail)
- Dashboard 2.0: order timeline, bulk actions + packing slips, alert thresholds, announcement history, Slack/email hooks.
- Storefront visual refresh: motion-ready hero, catalog quick actions, product lightbox + sticky purchase module, storytelling blocks.
- Third-party integrations: framer-motion, auto-animate, Slack webhooks, image hosting decision.
- Automation & QA: extend puppeteer for dashboard workflows, add Vitest coverage for analytics RPCs, schedule Lighthouse/aXe runs once visual refresh lands.

## When Starting a Session
1. Skim `docs/NEXT-STEPS.md` for the latest backlog and `docs/SESSION-*.md` for context.
2. Confirm branch deploy health (homepage + seeded product).
3. Run `npm run type-check` if changing TypeScript; `npm run build` before shipping.
4. Use the goal checklist below to resume ongoing QA work.

### Goal Checklist (reuse in new chats)
1. Seed/check `test-vinyl-dark-rituals` via Supabase if absent (see `docs/SUPABASE-SEED.md`).
2. Run `npm run test:puppeteer`; collect pass/fail notes and screenshots.
3. Confirm `/legal/*` routes render expected copy.
4. Note remaining work in `docs/NEXT-STEPS.md` before ending the session.
