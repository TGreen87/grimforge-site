# Codex CLI Agents Guide (OpenAI‑Aligned)

This repo follows Codex CLI conventions for a small team: plan first, minimal blast radius, single working branch, and explicit go‑live approval.

## Defaults & Tone

- Concise, direct, friendly; actionable by default.
- Plan first for non‑trivial work; keep steps small and reversible.
- Share 1–2 sentence preambles before tool calls (what/why/next).
- Provide brief progress updates for longer tasks (8–10 words).

## Branching & Deploy

- Working branch: `dev` (single active working branch).
- No PRs: push directly to `dev`; do not open PRs.
- Main is protected: never push to `main` unless the user says “Go live on main”.
- Netlify Branch Deploy: enable for `dev` (Build & deploy → Branches → Add Branch). Use the branch URL for live testing.
- Go‑Live protocol:
  1) Branch deploy is green and verified.
  2) User explicitly: “Go live on main”.
  3) Merge/fast‑forward `dev` → `main` and push.
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

## Deploy & Caching Notes (Branch Deploys)

- Branch Deploys can occasionally serve stale SSR HTML if CDN caches a previous payload.
- Mitigations (already implemented):
  - `next.config.mjs` sets `Cache-Control: no-store` headers for `/` (homepage HTML) and long‑cache immutable for static assets.
  - `app/(site)/page.tsx` exports `dynamic = 'force-dynamic'` to ensure fresh HTML.
- If stale HTML persists: clear cache and redeploy the branch. As a fallback, add a Netlify `_headers` entry for `/` with `Cache-Control: no-store`.

## Admin UX Additions

- Users & Roles: `/admin/users` to grant/remove admin by email. Server API: `/api/admin/users/roles` (GET/POST/DELETE).
- OAuth customer provisioning: after Google sign‑in, a `customers` row is upserted server‑side (email/name).
- Terminology: “Variants” are now “Stock Units” in the UI (purchasable items with own SKU/price/stock).
- URL (link): replace the word “slug” in admin labels with “URL (link)” and helper text; it’s the URL path (e.g., `/products/your-url`).

## MCP / Playwright

- If Playwright MCP is available, we can add a smoke suite that navigates the homepage, enters Catalog, opens a product, adds to cart, opens checkout, and verifies the redirect (without completing payment). Another set covers admin login (preview), create/publish an article, and check `/articles` list/detail.
- To enable: provide MCP endpoint and confirm CLI command to run (e.g., `npm run test:e2e`). We will keep specs small and idempotent.

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

## Recent Changes (dev)

- Fixed failing Netlify build: corrected misplaced `'use client'` directives; ensured `@/content/copy` resolves via `tsconfig.json` alias.
- Centralized public copy in `src/content/copy.ts` and wired components.
- Product detail MVP: `/products/[slug]` now fetches from Supabase and includes SEO metadata; added `BuyNowButton` posting to `/api/checkout`.
- Legacy compatibility: `/product/[id]` redirects to `/products/[slug]`.
- Catalog cards: link directly to slug routes (fallback to legacy id if slug absent).
- Footer navigation: converted to hash links (`/#catalog`, `/#vinyl`, etc.) for reliable scrolling on homepage.
- Product variant selector: client selector added to product page, updates price/availability and Buy Now.
- Admin products: added Slug field with `Generate` helper derived from Title.
- SEO: Product JSON‑LD added to product pages; Articles now have metadata + Article JSON‑LD (mocked data).
- Observability: added `/api/client-logs` endpoint and mounted a client error logger in `app/providers.tsx`.
- Observability: rate limit + dedupe on `/api/client-logs`, correlation ID cookie (`orr_cid`) included with reports, and a React ErrorBoundary wraps the app.
- Observability: middleware now propagates correlation IDs via `x-correlation-id` header and sets `orr_cid` cookie when absent.

## Deployment Status

- 2025-09-10: Promoted `dev` → `main` via fast‑forward merge. Production HEAD: `a9ab53d`.
- Highlights now live: Articles scaffold (admin list/create/edit/show + public list/detail), mobile polish (no horizontal scroll, header/menu tweaks, responsive cart drawer), catalog skeletons, product detail Add to Cart, multi‑item checkout API, shipping validation in modal.
- Ongoing work on `dev`: mobile polish, Articles markdown styling, admin clarity (rename variants to stock units across forms).

## Open TODOs

- Product variants: add selector on the product page; enable Buy Now per variant.
- Update ProductCard click target to prefer Link wrapping when feasible (accessibility) and keep button actions keyboard-friendly.
- Sitemap: include product slugs when available; verify with Supabase data.
- Admin polish: bulk tools (price/active) toggled by `NEXT_PUBLIC_ENABLE_ADMIN_BULK`.
- Observability: lightweight client error logging endpoint; wire ErrorBoundary.
