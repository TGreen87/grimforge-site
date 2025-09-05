# Agents Working Agreement

This repo uses a simple, safe workflow optimized for a very small team.

## Workflow

- Branch: `feat/admin-suite-phase1` is the only active working branch.
- No PRs: Do not open or rely on PRs; push directly to the working branch.
- Main is protected: Never push to `main` unless the user explicitly says: "Go live on main".
- Plan-first: Before any non-trivial change, post a brief 1–2 sentence plan, then apply changes.
- Minimal blast radius: Keep changes tightly scoped and reversible.

## Deploy

- Production: `main` branch (do not push without explicit approval).
- Staging/Live-Preview: Netlify Branch Deploy for `feat/admin-suite-phase1`.
  - Netlify UI → Site → Build & deploy → Branches → Add Branch: `feat/admin-suite-phase1`.
  - Resulting URL: `<branch>--<site>.netlify.app`.

## Environment Variables

- Never hard-code secrets.
- Rely on Netlify’s Supabase Connector or Dashboard env vars.
- Required for branch deploys:
  - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
  - `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (use production domain or branch URL)
- Build mapping:
  - `next.config.mjs` maps `NEXT_PUBLIC_*` from connector vars when present.

## Admin Auth

- Preview/Branch Deploys: relaxed client checks with timeouts; server middleware bypass is allowed.
- Production (`main`): stricter gating; server middleware may enforce Supabase session.
- Admin user: `arg@obsidianriterecords.com` with a known password set in Supabase.

## Safety Rails

- Do not modify `main` unless explicitly instructed.
- Do not change Netlify production envs without confirmation.
- Keep rollbacks easy (one commit per logical change).
- If a build fails, fix forward on the branch; do not touch `main`.

## Testing & Checks

- Local:
  - `npm run type-check`
  - `npm run build`
  - `npm test` (only where relevant to the changes)
- CI/Netlify:
  - Deploys from the working branch should not break; if env is missing, code must degrade gracefully.

## Go-Live Protocol

1) Confirm working branch is green on Netlify Branch Deploy.
2) User explicitly says "Go live on main".
3) Merge or fast-forward `feat/admin-suite-phase1` → `main` and push.
4) Monitor deployment; be ready to revert immediately if needed.

## Rollback Procedure (Production)

1) `git revert <bad-merge-sha>` on `main`.
2) `git push origin main`.
3) Verify Netlify redeploys successfully.

---

Questions or process changes? Update this file in a small, separate commit.

