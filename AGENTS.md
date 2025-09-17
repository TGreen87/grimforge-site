# Codex Agent Playbook — grimforge-site

_Last updated: 2025-09-16_

## Project Snapshot
- Stack: Next.js 15 App Router, TypeScript, Tailwind, Refine/AntD admin, Stripe, Supabase.
- Working branch: `dev` (single branch workflow). Production deploy happens only after the owner says “Go live on main”.
- Branch deploy URL: https://dev--obsidianriterecords.netlify.app.
- Primary docs: `docs/IMPLEMENTATION-PLAN.md`, `docs/NEXT-STEPS.md`, `docs/QA-CHECKLIST.md`, `docs/SUPABASE-SEED.md`.

## Operating Rules
- Always plan first (`update_plan`) when work spans multiple steps; exactly one step may be `in_progress`.
- Push directly to `dev`. Never open PRs. Promote to `main` only with explicit “Go live on main”.
- Branch deploy is the QA surface. After every meaningful push, verify the Netlify deploy.
- Keep secrets out of the repo. Runtime env vars live in Netlify / local `.env.local` (see `docs/ENV-QUICKSTART.md`).
- Default to automation: if the backlog already calls out work, execute the next safe step instead of asking the owner for direction.

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
- Product slug page now renders through a dedicated client block (`app/(site)/products/[slug]/variant-client-block.tsx`).
- Legal route group added under `app/(site)/legal/*` so footer links resolve (shipping, returns, size-guide, care, contact, privacy, terms).
- Puppeteer smoke script updated to wait for hydration and network idle requests; screenshots refreshed 2025-09-16.
- Netlify build clean on `dev`; branch product slug responds 200 with price/CTA.

## Active TODOs (see `docs/NEXT-STEPS.md` for detail)
- Polish catalog cards (skeletons, accessibility) and sitemap slug coverage.
- Expand puppeteer smoke to cover cart/checkout once seeded data + credentials prepared.
- Review and refine legal copy for production tone.
- Continue admin UX polish (bulk actions, accessibility).

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
