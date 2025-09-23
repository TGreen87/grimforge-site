# Admin Copilot Pipelines

_Last updated: 2025-09-23_

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
- **Sessions**: `assistant_sessions`, `assistant_session_events`, and `assistant_uploads` persist chat history, actions, and media for audit.
- **Attachments**: UI uploads pass `sessionId`; server records Storage path + size for compliance.
- **Undo / Rollback**: Campaign updates and publishes use existing admin UI for reversions; future enhancement to expose “undo last action”.
- **Telemetry**: Session logging now live; `/admin/assistant/logs` viewer planned to surface events.
- **Documentation**: Keep this spec, `docs/ADMIN-WORKFLOWS.md`, and QA scripts synced when prompts or pipelines evolve.

## Next Steps (Implementation Order)
1. Add assistant session viewer UI under `/admin/assistant/logs` (leveraging new tables).
2. Expose undo/rollback helpers for high-impact actions (product activation, campaign replacement).
3. Expand QA automation (Puppeteer/Vitest) to cover pipeline happy paths end-to-end.
4. Document owner workflows around the new assistant capabilities (admin handbook + videos pending).
