# Admin Copilot Pipelines

_Last updated: 2025-09-28 (Responses API rewrite + preview host overrides)_

Purpose: Define the conversational flows and technical orchestration required for the assistant to execute end‑to‑end admin tasks (no n8n dependency). These pipelines guide implementation of new assistant actions and supporting services.

## Personas & Goals
- **Label Owner (primary user)** – Drops media/prompts into the copilot instead of navigating the admin UI. Expects the assistant to complete tasks autonomously and confirm outcomes.
- **Assistant** – Conversational interface powered by OpenAI + Supabase actions. Must gather missing details, call enrichment services, mutate data, and report back with links/next steps.

## Pipeline 1 — “Create & Publish Product From Media” _(Implemented 2025-09-23)_

### Conversation Prompt
> “Here’s a photo of the new ‘Void Caller’ vinyl. We’re pressing 200 copies at $42. Can you get it live and feature it on the homepage hero?”

### Required Outputs
- Product row (`products`) with slug, metadata, pricing, active flag (toggled by user intent), hero image.
- Variant row (`variants`) with SKU, price, format.
- Inventory row (`inventory`) with opening stock + audit trail.
- Optional campaign entry (`campaigns`) to spotlight release on homepage (now active when `featureOnHero` is true).
- Attachment audit record in `assistant_uploads` linking media to the session.
- Confirmation summary + storefront/admin deep links (returned to the assistant UI).

### Steps & Services (Current Build)
1. **Gather Inputs**
   - Assistant uses structured context + user prompt; server validates `price` and enriches missing title/artist/description via OpenAI (`ASSISTANT_PIPELINE_MODEL`, default `gpt-4.1-mini`).
2. **Media Handling**
   - Files upload to Supabase Storage bucket `assistant-media/<intent>/...`; uploads are logged in `assistant_uploads` and tied to the session.
3. **Enrichment**
   - `lib/assistant/pipelines/products.ts` calls OpenAI for title/artist/description/tags/highlights when not fully provided.
   - Tags + highlights merged with operator overrides; slug uniqueness enforced server-side.
4. **Database Mutations**
   - Insert `products`, `variants`, and `inventory` rows in a guarded sequence (with rollback on failure).
   - When `featureOnHero=true`, upsert the matching `campaigns` row and activate it when the product ships live.
5. **Audit & Session Logs**
   - `assistant_sessions` + `assistant_session_events` capture each action with payloads.
   - Traditional audit stream (`assistant.product.full_create`) records product/variant metadata.
6. **Response Message**
   - API returns success message plus `sessionId`, product identifiers, and hero status; the assistant thread surfaces this directly.

### Edge Cases & Safeguards
- Missing price → pipeline aborts with actionable error (assistant surfaces to user).
- Duplicate slug → automatic suffixing (max 5 attempts) reflected in summary.
- Enrichment failure → assistant requests explicit copy instead of hallucinating.
- Storage upload failure → upload endpoint returns 500; attachment is removed from UI list.

## Pipeline 2 — “Draft or Publish Article From Prompt” _(Implemented 2025-09-23)_

### Conversation Prompt
> “Write a feature article announcing Void Caller’s release, ~400 words, include tracklist and manufacturing notes.”

### Required Outputs
- Article row (`articles`) with title, slug, markdown body, author, published flag.
- Optional cover image stored in Supabase Storage (audit logged via `assistant_uploads`).
- Confirmation message with preview link, word count, and suggested tags.

### Steps & Services (Current Build)
1. **Gather Inputs** — Assistant collects brief/word target via structured context; server clamps word count between 200–1200.
2. **Copy Generation** — `draftArticlePipeline` calls OpenAI for title/excerpt/markdown, embedding product slug context when supplied.
3. **Persistence** — Inserts into `articles` with optional immediate publish (`publish_article` action toggles later if needed).
4. **Audit & Session Logs** — `assistant.article.create` and `assistant.article.publish` emitted alongside session events.
5. **Response** — Assistant displays article slug + status and links to storefront/admin.

### Edge Cases
- Publish requested but slug collision → server re-suffixed slug and reflects in summary.
- Article briefs under 8 characters → rejected before OpenAI call.
- Cover art optional; absence does not block pipeline.

## Pipeline 3 — “Update Hero / Campaign” _(Implemented 2025-09-23)_
- Input: layout preference, CTAs, badge copy, optional media.
- Actions: Upload media (via assistant uploads), upsert `campaigns` row, optionally activate immediately.
- Response: Provide preview URL (`/?previewCampaign=slug`) and reminder to verify reduced-motion fallback.

## Cross-Cutting Considerations
- **Validation**: All assistant APIs enforce admin auth before OpenAI/DB calls; missing essentials (price, brief) short-circuit with actionable errors.
- **Auth Modes**: Supabase admin sessions remain the primary gate. For automation or device flows, set `ASSISTANT_ADMIN_TOKEN` and send it via `Authorization: Bearer <token>` (or `x-assistant-api-key`) to unlock chat, actions, and uploads without a browser session. Netlify previews and localhost in dev also bypass auth when `ASSISTANT_ALLOW_PREVIEW` / `ASSISTANT_ALLOW_LOCALHOST` are enabled.
- **Preview Hosts**: Set `ASSISTANT_PREVIEW_HOSTS` (comma-separated host suffixes) when you need to trust additional staging domains. Auth failures now emit structured console warnings (`reason`, `host`, `preview`, `hasFallbackToken`) so you can spot misconfigured sessions quickly.
- **Structured Outputs**: `/api/admin/assistant` now uses the OpenAI Responses API with a strict JSON Schema. Every action payload is type-checked server-side (required parameters enforced, attachments listed under `__attachments`). When you add new actions or parameters, update `createAssistantResponseJsonSchema()` in `app/api/admin/assistant/route.ts` alongside the matching Zod schema and Vitest coverage (`tests/api/admin/assistant.test.ts`).
- **Sessions**: `assistant_sessions`, `assistant_session_events`, `assistant_uploads`, and `assistant_action_undos` persist chat history, actions, media, and undo availability for audit.
- **Attachments**: UI uploads pass `sessionId`; server records Storage path + size for compliance.
- **Plan Previews**: The assistant drawer shows multi-step plans (risk + undo notes) before any high-impact action runs. Update `lib/assistant/plans.ts` plus QA docs when steps change.
- **Undo / Rollback**: Product/article/campaign actions issue time-boxed undo tokens (`assistant_action_undos`) surfaced in the drawer; undoing deletes generated assets or restores the previous state. Extend `/api/admin/assistant/actions/undo` whenever new pipelines appear.
- **Telemetry**: Session logging is live; `/admin/assistant/logs` surfaces the feed for verification.
- **Documentation**: Keep this spec, `docs/ADMIN-WORKFLOWS.md`, and QA scripts in sync with prompt/plan/undo behaviour.
- **Models & Prompts**: Chat completions use `ASSISTANT_CHAT_MODEL` (default `gpt-4.1-mini`) and respect `ASSISTANT_CHAT_SYSTEM_PROMPT`. Pipelines use `ASSISTANT_PIPELINE_MODEL` plus optional `ASSISTANT_PRODUCT_SYSTEM_PROMPT` / `ASSISTANT_ARTICLE_SYSTEM_PROMPT`. Override these env vars when switching to GPT‑5 (Codex) or tailoring tone.
- **Environment checklist**: The assistant will fail fast if `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`, or `OPENAI_API_KEY` are missing. Confirm these on any new machine or deploy before testing copilot features.

## Next Steps (Implementation Order)
1. Re-enable Vitest suites for assistant undo once shared mocks/env are restored; add assertions for plan preview text and undo expiry messaging.
2. Expand QA automation (Puppeteer/Vitest) to cover pipeline happy paths end-to-end, including upload → run → undo.
3. Document owner workflows (admin handbook + videos) that illustrate reviewing plans and using undo tokens.
