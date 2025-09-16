# Documentation Maintenance Guide

This note explains how to keep each file in the `docs/` directory current. When significant work lands, update the relevant section(s) below and commit to `dev` so the history stays synchronized with the branch deploy.

## Core Playbooks
- **AGENTS.md (repo root)** — Primary project playbook for future Codex sessions. Update whenever workflow rules, QA process, or tooling assumptions change.
- **docs/AGENTS.md (this file)** — Checklist for maintaining the documentation set. Extend it as new docs are added.

## Execution Guides
- **ADMIN-WORKFLOWS.md** — Explain how the label owner uses the admin panel (products, inventory, orders, articles, roles). Update when UX, terminology, or admin endpoints change.
- **ADMIN-VISUALS-RFC.md** — RFC for the ongoing admin visual overhaul. Keep status bullets in sync with implemented tokens/layout changes.
- **IMPLEMENTATION-PLAN.md** — Long-term roadmap broken into phases. Mark completion and adjust scope whenever features ship or priorities shift.
- **NEXT-STEPS.md** — Immediate backlog snapshot. Refresh after each working block (especially “Immediate Next Steps”).
- **SESSION-*.md** — Session logs (currently `SESSION-2025-09-14.md`). Add a new dated file when major working sessions occur; capture decisions and context.

## Environment & Ops
- **ENV-QUICKSTART.md** — Runtime/build env requirements for Netlify + local dev. Update when secrets, optional services (AusPost, Stripe), or verification steps change.
- **SUPABASE-SEED.md** — Supabase bootstrap + seed scripts. Amend if schema, policies, or seed data expectations evolve.
- **SHIPPING-AUSPOST.md** — Shipping integration notes (AusPost/Stripe fallback). Revise when services, pricing logic, or env flags change.
- **QA-CHECKLIST.md** — Manual QA list for branch deploy. Update when flows or acceptance criteria change (e.g., new legal pages, checkout steps).
- **CONTINUE-PROMPT.md** — Prompt template for restarting chats with MCP tools. Keep goals/instructions aligned with the current smoke workflow.

## Assets & Evidence
- **qa-screenshots/** — Latest smoke screenshots. Replace when visuals change or new flows are validated.

## Maintenance Workflow
1. After implementing a feature or workflow change, identify affected docs from the list above.
2. Update the relevant markdown files (and screenshots when needed).
3. Commit the doc changes to `dev` so Netlify redeploys with accurate references.
4. Log notable decisions in `docs/SESSION-*.md` and refresh `docs/NEXT-STEPS.md`.

Keeping these guides current ensures future sessions (and the label owner) can pick up right where we left off.
