# Documentation Index

Last modified: 2025-10-24

Use this index as the starting point before touching code or deployments. Pair it with [../AGENTS.md](../AGENTS.md) for contributor rules.

## Operational Guides
- [`NEXT-STEPS.md`](NEXT-STEPS.md) – Rolling backlog, priorities, and blockers.
- [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md) – Phase-by-phase delivery roadmap.
- [`OWNER-HANDBOOK.md`](OWNER-HANDBOOK.md) – Release rituals, escalation paths, and handoffs.
- [`PRODUCTION-LAUNCH-CHECKLIST.md`](PRODUCTION-LAUNCH-CHECKLIST.md) – Final QA + deploy validation steps.
- [`QA-CHECKLIST.md`](QA-CHECKLIST.md) – Manual + automated smoke coverage expectations.

## Environment & Tooling
- [`ENV-QUICKSTART.md`](ENV-QUICKSTART.md) – Required env vars, validation flow, troubleshooting.
- [`SUPABASE-SEED.md`](SUPABASE-SEED.md) – Commands + SQL snippets for seeding test data.
- [`SHIPPING-AUSPOST.md`](SHIPPING-AUSPOST.md) – AusPost integration setup and fallback logic.
- [`ADMIN-WORKFLOWS.md`](ADMIN-WORKFLOWS.md) – Day-to-day admin tasks, bulk actions, fulfilment flows.
- [`AGENT-PIPELINES.md`](AGENT-PIPELINES.md) – Assistant orchestration specs (product/article pipelines, media ingestion, plan previews, undo tokens).

## Design & RFCs
- [`SITE-VISUALS-RFC.md`](SITE-VISUALS-RFC.md) – Storefront visual refresh specs (campaign hero, storytelling, Journal blocks).
- [`ADMIN-VISUALS-RFC.md`](ADMIN-VISUALS-RFC.md) – Admin dashboard visual overhaul.
- [`CONTINUE-PROMPT.md`](CONTINUE-PROMPT.md) – Session handoff primer for agents.

## Session Logs
Latest work session notes live under `docs/SESSION-YYYY-MM-DD.md` (most recent: `docs/SESSION-2025-10-24.md`). Older entries have been archived under `docs/archive/` (e.g., `docs/archive/2025-09/`). Check the latest entry before resuming a thread.

## Automation & QA Artifacts
- [`qa-screenshots/`](qa-screenshots/) – Puppeteer smoke outputs keyed by timestamp.
- [`scripts/`](../scripts/) – Local automation helpers (`npm run assistant:sync` to refresh copilot embeddings; `node scripts/check-env.mjs` before deploys).

Keep this index updated whenever new documentation lands or files move to the archive.
