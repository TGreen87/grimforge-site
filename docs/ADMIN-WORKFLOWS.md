# Admin Workflows & Terminology

_Last updated: 2025-09-23_

This guide explains the key concepts in the admin and the typical flows. Use `docs/README.md` for the full documentation index.

## Concepts
- **Product**: The main page for a release (title, artist, description, hero image, etc.).
- **Stock Unit** (formerly “Variant”): A purchasable unit of stock for a product (e.g., a specific pressing/format/edition). Each has its own SKU, price, and inventory.
- **Inventory**: Quantities for each Stock Unit (on hand, allocated, available). Receiving stock increases on hand.
- **SKU**: Stock Keeping Unit (unique code you use to track stock). Auto‑generated for convenience (SLUG‑STD) but you can edit.
- **URL (link)** (aka “slug”): The URL‑friendly path for a product/article page. Lowercase words joined by hyphens (e.g., `dark-ritual`).

## Quick Publish (Recommended)
1) Go to Upload New Release (admin Upload tool) or Products → Create.
2) Enter Title, Artist, Price, and (optionally) upload an image.
3) On publish, the system:
   - Creates the Product with URL (link).
   - Creates a default Stock Unit (Standard) with SKU and price.
   - Creates Inventory (if you entered initial stock).
4) The item appears on the public Catalog and can be bought.

### Owner checklist: add a new product (step-by-step)
1. **Prepare assets**
   - Square cover art JPG/PNG (minimum 1200×1200). Keep filenames lowercase with hyphens (e.g., `dark-rituals-cover.jpg`).
   - Tracklist/description text in a plain-text or Markdown file.
   - SKU scheme ready (e.g., `SHADOWMOON-DARK-RITUALS-STD`).
2. **Upload artwork**
   - Navigate to `/admin/products/create`.
   - Under *Media & Metadata*, paste the image URL (e.g., from an external CDN) or use the Upload helper (future enhancement).
3. **Fill Basics**
   - Title (`Test Vinyl — Dark Rituals`), Artist, URL (link). Use the “Generate” helper if unsure; keep lowercase words separated by hyphen.
4. **Format & Pricing**
   - Select Format (`Vinyl`, `CD`, etc.).
   - Price (AUD). Toggle Active on when you’re ready for customers to see it.
5. **Inventory**
   - Initial stock (optional). You can always receive stock later via Inventory.
6. **Publishing**
   - Active toggle ON to show on storefront.
   - Save.
7. **Add additional stock units** (limited edition, bundles) via `/admin/variants/create`.
8. **Receive stock**
   - `/admin/inventory` → find the variant → Receive → enter quantity and notes.
9. **Preview**
   - Open `/products/<slug>` to confirm imagery, pricing, and Add to Cart button.

## Dashboard Overview
- Visiting `/admin` now lands on the Dashboard. It surfaces:
  - KPI cards for total revenue (paid orders), count of paid orders, orders awaiting action, and low-stock variants (≤5 available).
  - Revenue goal progress with configurable target (7-day or 30-day window) and trend delta.
  - Recent orders list with quick status snapshots and links into Orders.
  - Low stock list with direct links to edit Stock Units.
  - A “Next steps” checklist tailored to the owner.
- Quick actions (Add product, View orders, Receive stock) are pinned to the header for fast access.
- Dashboard announcement editor now tracks history; use the “Revert to this copy” action to restore previous messages.
- Tables remain available via the navigation, but the dashboard is the preferred entry point for non-technical operators.
- Needs fulfilment panel now includes one-click CSV exports beside each task for quick reporting (only active when counts >0).

### Analytics & Copilot
- **Analytics**: `/admin/analytics` summarises page views and total events over selectable windows (24h/7d/30d), highlights top pages/referrers, and streams recent events. Filter by path, export CSV, and keep an eye on the “Internal Hits” card for admin-only traffic. Data is sourced from the first-party beacon (`/api/analytics/ingest`).
- **Copilot**: Open the assistant via the robot button in the header (or shortcut `⌘⇧C`/`Ctrl+Shift+C`). Ask about workflows, rollout plans, or current analytics; the bot cites internal docs for quick verification. The assistant lives entirely server-side—no external dashboard needed.
- **Structured context panel**: Expand the “Add structured context” drawer to pre-fill format, price, stock, hero toggle, and article targets before you chat. Attach record photos or audio clips—the assistant uploads them to Supabase Storage and keeps a log for follow-up actions.
- **Analytics summary action**: Approve the “Summarize analytics” suggestion to get a digest for the last 24h/7d/30d (optional path filter). The copilot replies with total sessions, internal hits, and the top page/referrer, and logs the run as `assistant.analytics.summarize`.
- **Order lookup action**: Provide an order number or customer email in the confirmation modal to retrieve the latest order status, totals, and headline line items. Lookups are logged as `assistant.order.lookup` for auditing.
- **Receive stock via Copilot**: When the assistant suggests a stock receipt, review the variant ID and quantity in the confirmation modal, tweak if required, then run it. The action calls the same Supabase RPC used in the admin UI and records an audit log (`assistant.inventory.receive`).
- **Create a release from media**: Drop art + a short brief into the drawer and run “Create & publish product”. The assistant enriches copy, inserts product/variant/inventory rows, and (optionally) pushes the hero campaign live. Every run logs `assistant.product.full_create` and stores attachment metadata in `assistant_uploads`.
- **Draft & publish articles**: Use “Draft article” for rapid Journal copy. The assistant generates markdown, saves the article (draft or published), and reports the slug. Run “Publish article” later to promote an existing draft—both emit audit entries.
- **Refresh the hero**: “Update campaign” rewrites the storefront hero (title, subtitle, highlights, CTAs, layout). Attach new media if needed; the action upserts `campaigns` and activates it when `Activate campaign` is true.
- **Session history**: Every conversation now has a persistent session ID; actions/messages emit entries to `assistant_sessions` and `assistant_session_events`. Use this for compliance or follow-up (viewer coming soon under `/admin/assistant/logs`).
- **Run confirmed actions**: When the copilot suggests a supported action (e.g., “Create product draft”), review the parameters, then hit “Review & Run”. The system executes with service-role credentials, logs to `audit_logs`, and leaves outputs inactive until you explicitly publish.

## Full Control (Products / Stock Units / Inventory)
- Use when you need multiple Stock Units (e.g., different pressings, bundles):
  1) Products → Create: set core details and URL link.
  2) Stock Units → Create: add each purchasable unit with its SKU/price/format.
  3) Inventory → Receive: add quantities for the Stock Unit (with notes). Inventory updates atomically.

## Receiving Stock
- Admin → Inventory: Find the row → Receive → enter Quantity and (optional) Notes → Receive.
- This writes a stock movement and updates on hand/available counts.

## Articles
- Admin → Articles: Create an article with Title, URL (link), content (markdown ok), and Publish.
- Public pages will appear at `/articles` and `/articles/{url-link}` once published.
- Homepage Journal automatically features the most recent published articles (one featured, up to two secondary); unpublish to remove from the feed.

## Checkout & Cart
- Customers add items from product pages (this captures the Stock Unit for checkout).
- The cart supports multi‑item Stripe Checkout.
- Shipping address and phone are required in the checkout modal; wallets (Apple/Google Pay) appear when enabled in Stripe.
- Shipping: when Australia Post is configured, customers will see AusPost rate options at checkout; otherwise, static Stripe rates are offered. See `docs/SHIPPING-AUSPOST.md`.

## Tips
- Use lowercase URL links with hyphens; keep them short and descriptive.
- Keep SKUs consistent (auto‑generated, but edit if you have a store‑wide scheme).
- Prefer “Stock Units” to refer to purchasable items (we’ve renamed UI labels accordingly).
- Manage storytelling blocks via **Admin → Story Content** (timeline order, testimonials, newsletter CTA). With no rows, the storefront hides these sections; populate real entries before launch.

## Users & Roles (Grant Admin)
- Path: `/admin/users` (preview environments only; requires an existing authenticated session).
- Grant admin:
  1) Enter the user’s email (must exist in Supabase Auth).
  2) Click “Grant Admin”. The server upserts `{ user_id, role: 'admin' }` into `user_roles`.
- Remove admin: Click “Remove Admin” in the table row.
- API (equivalent):
  - POST `/api/admin/users/roles` `{ email: "user@example.com", role: "admin" }`
  - DELETE `/api/admin/users/roles` `{ email: "user@example.com" }`

## Troubleshooting: Product Save appears to do nothing
- Symptom: Clicking “Save” on `/admin/products/create` doesn’t navigate or show a success toast, and the slug URL 404s.
- Likely cause: Supabase RLS rejection. Some older policies check `admin_users` while the app grants roles in `user_roles`. If your session isn’t recognized by that policy, inserts fail.
- How to confirm: DevTools → Network → inspect `POST /rest/v1/products` response for RLS/constraint errors.
- Fix fast: run the idempotent seed in `docs/SUPABASE-SEED.md` (via Supabase MCP/Studio). It grants admin in both tables and upserts a test Product + Stock Unit + Inventory used by QA checkout.

## Admin UI — Views & Shortcuts
- Views:
  - Products: switch between Table and Cards (toolbar toggle). Cards support inline price and active toggles.
  - Orders: switch between Table and Board. In Board, drag cards between status columns to update status.
  - Inventory: Table or Cards. Cards show Available/On hand/Allocated chips and a Receive button. Quick filters for All/Out.
  - Customers and Articles: Table or Cards for quick scanning and actions.
- Search & Shortcuts:
  - Header search opens the command palette (Kbar). Keyboard: Cmd/Ctrl+K.
- Actions: Create Product (n,p), Create Article (n,a), Create Stock Unit (n,s), Orders Board (o,b), Products Cards (p,c), Inventory Cards (i,c), Customers Cards (c,c), Articles Cards (a,c).
  - Settings: Admin Settings (g,s) jumps to global alert + Slack configuration.

## Campaigns
- Path: `/admin/campaigns` (table/cards views).
- Toggle active state via the switch; start/end dates schedule activation automatically.
- Use sort order (ascending) to control priority of active campaigns.
- "Preview" opens the storefront with `/?previewCampaign=slug` to review content without activating it.
- Revision history available on the edit screen; each save captures a snapshot. Use **Revert** to restore prior copy (new revision entry is logged).
- Layout selector supports **Classic**, **Split**, and **Minimal** hero treatments. Classic keeps the full-bleed background, Split pairs copy with spotlight media, Minimal provides a static banner; switch layouts directly from the create/edit forms.
- Optional **Badge text** surfaces above the hero title (e.g., "New campaign"). Leave blank to fall back to “Featured Campaign”.
- Use **Highlight bullets** (one per line) to surface supporting points under the hero copy; these render as gothic bullet points on the storefront.
- Background video continues to autoplay only when motion is allowed; provide a static hero image for reduced-motion visitors.

## Admin Settings (Alerts & Integrations)
- Path: `/admin/settings`.
- Configure fulfilment and low-stock thresholds surfaced on the dashboard.
- Toggle dashboard alerting (`enable_dashboard_alerts`).
- Store Slack webhook (`ops_alert_webhook`) and enable/disable ops alerts (future automation hook).
- Use “Send test alert” button to verify Slack webhook delivery (disabled when webhook missing/off).
- Changes persist to Supabase `admin_settings` table; edits are audited via `updated_by/updated_at`.

## Form Grouping (Admin UI)
- Products: Basics → Format & Pricing → Inventory → Media & Metadata → Publishing.
- Stock Units: Basics → Identification → Pricing & Attributes → Publishing.
- Inline helpers: URL link pattern; SKU auto‑suggest; shipping weight/dimensions usage.

## Empty States
- When a list has no items, a warm EmptyState appears with a clear call to action:
  - Products: “Create your first product or import a CSV.”
  - Stock Units: “Add stock units to start tracking inventory and pricing.”
  - Inventory: “Add stock units or receive stock.”
  - Orders: “When customers buy, orders appear here.”
  - Customers: “Customers who check out will appear here.”
  - Articles: “Write your first post.”

## CSV Export
- Products: toolbar → Export CSV (products.csv) honoring visible rows.
- Inventory: toolbar → Export CSV (inventory.csv).
- Checkout captures customer profiles (shipping address, marketing opt-in); review them in `/admin/customers` alongside total spend and notes.
