# Codex CLI Agents Guide (OpenAI‑Aligned)

This repo follows Codex CLI conventions for a small team: plan first, minimal blast radius, single working branch, and explicit go‑live approval.

## Defaults & Tone

- Concise, direct, friendly; actionable by default.
- Plan first for non‑trivial work; keep steps small and reversible.
- Share 1–2 sentence preambles before tool calls (what/why/next).
- Provide brief progress updates for longer tasks (8–10 words).

## Branching & Deploy

- Working branch: `feat/admin-suite-phase1` (only branch we develop on).
- No PRs: push directly to the working branch; do not open PRs.
- Main is protected: never push to `main` unless the user says “Go live on main”.
- Netlify Branch Deploy: enable for `feat/admin-suite-phase1` (Build & deploy → Branches → Add Branch). Use the branch URL for live testing.
- Go‑Live protocol:
  1) Branch deploy is green and verified.
  2) User explicitly: “Go live on main”.
  3) Merge/fast‑forward `feat/admin-suite-phase1` → `main` and push.
  4) Monitor; if any issue, revert immediately.

## Environment & Secrets

- Never hard‑code secrets. Use Netlify Supabase Connector or Dashboard env.
- Required:
  - `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
  - `SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SITE_URL` (production domain or branch URL)
- Build mapping: `next.config.mjs` maps connector vars to `NEXT_PUBLIC_*` at build time.
- Degrade gracefully when env is missing (no crashes in previews).

## Admin Auth Policy

- Branch deploys: relaxed client checks with timeouts; server middleware bypass allowed.
- Production (`main`): stricter gating may be enabled.
- Admin account: `arg@obsidianriterecords.com` with a known password in Supabase.

## Planning Tool (update_plan)

- Use for multi‑step tasks or where sequencing matters.
- Keep steps 5–7 words; exactly one `in_progress` step.
- Skip plan for trivial one‑off edits.

## Preamble Messages

- Before running tools, send 1–2 sentences describing the immediate action.
- Group related actions under one preamble.

## Shell Usage

- Prefer `rg` for search; `rg --files` for listing.
- Read files in chunks ≤ 250 lines.
- Output is truncated at ~10KB/256 lines; tailor queries.
- Avoid running long/loud commands needlessly.

## Patching Files (apply_patch)

- Always use `apply_patch` with the minimal diff.
- Don’t re‑read files immediately after writing.
- Do not add license headers unless asked.
- Keep changes scoped; follow existing style.

Patch envelope example:

```
*** Begin Patch
*** Update File: path/to/file.ext
@@
- old
+ new
*** End Patch
```

## File References in Messages

- Use clickable paths with optional line/column (1‑based):
  - `src/app.ts`
  - `src/app.ts:42`
  - `src/app.ts#L42C7`
- Don’t include ranges or external URIs.

## Testing & Validation

- Local: `npm run type-check`, `npm run build`. Run tests when related to the change.
- Don’t fix unrelated failing tests; note them if encountered.
- For non‑interactive runs, validate proactively; otherwise be efficient.

## Commit Messages

- Conventional style: `feat: …`, `fix: …`, `chore: …`, `docs: …`.
- Keep subjects short; add detail lines as needed.

## Rollback Procedure (Production)

1) `git revert <bad-commit-sha>` on `main`.
2) `git push origin main`.
3) Verify Netlify redeploy.

## Incident Response

- If the live site breaks: revert first, then fix forward on the working branch.
- Communicate clearly what changed and what’s next.

---

This guide encodes how we use Codex CLI here: plan first, one working branch, explicit go‑live, minimal blast radius.

