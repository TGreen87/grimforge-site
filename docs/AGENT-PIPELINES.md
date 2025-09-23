# Admin Copilot Pipelines

_Last updated: 2025-09-23_

Purpose: Define the conversational flows and technical orchestration required for the assistant to execute end‑to‑end admin tasks (no n8n dependency). These pipelines guide implementation of new assistant actions and supporting services.

## Personas & Goals
- **Label Owner (primary user)** – Drops media/prompts into the copilot instead of navigating the admin UI. Expects the assistant to complete tasks autonomously and confirm outcomes.
- **Assistant** – Conversational interface powered by OpenAI + Supabase actions. Must gather missing details, call enrichment services, mutate data, and report back with links/next steps.

## Pipeline 1 — “Create & Publish Product From Media”

### Conversation Prompt
> “Here’s a photo of the new ‘Void Caller’ vinyl. We’re pressing 200 copies at $42. Can you get it live and feature it on the homepage hero?”

### Required Outputs
- Product row (`products`) with slug, metadata, pricing, active=true, hero image.
- Variant row (`variants`) with SKU, price, format.
- Inventory row (`inventory`) with opening stock + audit trail.
- Optional campaign entry (`campaigns`) to spotlight release on homepage.
- Optional story/testimonial entry if owner requests supporting content.
- Image stored in Supabase Storage (public URL stable for storefront + JSON-LD).
- SEO metadata update (JSON-LD script + tags).
- Confirmation summary + storefront/admin deep links.

### Steps & Services
1. **Gather Inputs**
   - Prompt for missing fields: price, stock, format, release date, limited run flag.
   - Validate minimum data (title, artist, price). Abort politely if insufficient.
2. **Upload Media**
   - Use Supabase Storage bucket `public/products/`.
   - Generate canonical filename (`slug-primary.jpg`).
   - Return public URL for reuse.
3. **Enrichment**
   - Call Supabase functions:
     - `product-autofill-from-image` (title/artist hints, palette).
     - `generate-tags` (SEO tags array).
     - `regenerate-description` (marketing copy from prompt + extracted details).
     - `price-research-au` (optional reference price; cite source if used).
4. **Database Mutations**
   - Upsert `products` with enriched fields (slug generated from title, `active=true` if owner confirms).
   - Upsert `variants` (format, price, SKU autop generated `slug-STD` unless provided).
   - Upsert `inventory` (on_hand = provided stock, allocated=0).
   - Upsert `product_media` table once available (placeholder: store URLs in JSON metadata).
5. **Optional Campaign Hook**
   - If owner asks to feature the release, create/update campaign record with chosen layout, CTAs, highlight bullets.
   - Ensure existing active campaigns respect date range; disable others if “make this primary” flagged.
6. **Audit & Logs**
   - Write `assistant.product.publish` entry with metadata (variant_id, stock, price, media URL, enrichment actions).
7. **Response Message**
   - Summarize actions, provide storefront link, admin link, mention hero update if applied, highlight analytics tag suggestions.

### Edge Cases
- Missing price/stock → assistant gathers before proceeding.
- Duplicate slug → generate slug with suffix (`-2`) and mention in summary.
- Enrichment failure → fall back to owner-provided text, log warning, continue.
- Storage upload failure → abort and ask user to retry.

## Pipeline 2 — “Draft or Publish Article From Prompt”

### Conversation Prompt
> “Write a feature article announcing Void Caller’s release, ~400 words, include tracklist and manufacturing notes.”

### Required Outputs
- Article row (`articles`) with title, slug, markdown body, author, published flag.
- Optional cover image stored in Supabase Storage.
- Homepage Journal refresh (featured + secondary logic).
- Confirmation message with preview link, word count, and suggested tags.

### Steps & Services
1. **Gather Inputs**
   - Title suggestion, publish vs. draft, target length, tagging.
   - Option to request cover art (assistant can ask if none provided).
2. **Enrichment**
   - Use OpenAI direct or existing `regenerate-description` variant tuned for articles.
   - Reference house style guidelines (pull from knowledge base).
   - Include tracklist/bullets if provided; otherwise prompt owner.
3. **Storage**
   - Upload image if supplied; store at `public/articles/slug-hero.jpg`.
4. **Database Mutations**
   - Upsert `articles` with excerpt (`markdown.split('\n\n')[0]`), tags array, `published_at` timestamp if publish=true.
   - If set to featured, update `articles` flags to maintain one primary feature.
5. **Audit & Logs**
   - Write `assistant.article.create` or `.publish` with word count, model, prompt summary.
6. **Response**
   - Provide preview link, admin edit link, highlight key sections, suggest cross-promotions (e.g., add to hero or story timeline).

### Edge Cases
- Publish requested but checkout product not live yet → warn and keep draft.
- Article limit reached (e.g., Journal only shows 3) → inform owner and suggest archiving old post.

## Pipeline 3 — “Update Hero / Campaign”
- Input: layout preference, CTAs, badge copy, optional media.
- Actions: Upload media if new, update `campaigns` row, set scheduling, optionally toggle hero flag.
- Response: Provide preview URL (`/?previewCampaign=slug`) and reminder to verify reduced-motion fallback.

## Cross-Cutting Considerations
- **Validation**: All actions must confirm admin auth via middleware + `assertAdmin`.
- **Confirmations**: Assistant should display summary before mutating when risk is high (e.g., replacing hero).
- **Undo / Rollback**: Provide quick actions (“Revert to previous campaign”) when possible by retrieving last campaign revision.
- **Permissions**: Re-use service client but guard with explicit policy checks to prevent accidental writes.
- **Telemetry**: Add `assistant_sessions` table with: user_id, steps, actions, timings, errors.
- **Documentation**: Update `docs/ADMIN-WORKFLOWS.md`, `docs/QA-CHECKLIST.md`, and session logs as capabilities ship.

## Next Steps (Implementation Order)
1. Add Storage upload helper + secure bucket policy for assistant uploads.
2. Implement product pipeline action (`create_product_full`) using spec above.
3. Extend UI to handle file uploads + multi-step confirmations.
4. Add article pipeline action and UI prompts.
5. Build campaign update action.
6. Add telemetry + assistant session viewer.
7. Expand automated tests and QA docs.
