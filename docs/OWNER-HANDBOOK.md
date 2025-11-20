# Owner Quick Start Handbook

_Last updated: 2025-11-20_

This guide covers day-to-day tasks for Obsidian Rite Records without touching code. Use `docs/README.md` for the full documentation index.

## 1. Signing in
1. Go to `https://obsidianriterecords.com/admin/login` (or `dev_stripe` branch deploy for QA).
2. Use your owner credentials. If you forget the password, reset via Supabase Auth.
3. You should land on the **Dashboard**.

## 2. Dashboard tour
- Cards: revenue (paid orders), awaiting fulfilment, low stock, payouts.
- Recent orders: last six sales with a Stripe link.
- Low stock: jump straight to the stock unit.
- Header buttons: Add product, Orders, Receive stock.

## 3. Adding a new release (variant required)
1. Prepare cover art (square) and description.
2. Go to **Products → New product**.
3. Fill **Basics** (Title, Artist, URL slug).
4. Create a **Variant** (required for checkout): set format (Vinyl/CD/etc.), price, and initial stock (`on_hand`). Toggle **Active**.
5. Add the image URL under Media, then toggle **Product Active** when ready.
6. Save. The product + variant should appear on the storefront and can be added to cart.

### Adding different editions
- Go to **Stock Units (Variants)** → **Create**. Each variant can have its own SKU, price, and stock.

## 4. Receiving stock
1. Go to **Inventory**.
2. Find the variant and click **Receive**.
3. Enter quantity and optional notes (e.g., “Box 1 of 2 delivered 18 Nov”).
4. Submit; available/on-hand counts update automatically.

## 5. Reviewing orders
- Go to **Orders**. Filters: Paid / Pending / Failed.
- Paid orders include shipping details from Stripe Checkout and a Stripe link.
- Update status: Pending → Processing → Shipped → Delivered.
- Board view: drag cards to change status if preferred.

## 6. Customer profiles
- Shows total spend, last order date, addresses, notes.
- Use Notes for special shipping instructions or VIP flags.

## 7. Checkout & addresses
- Stripe Checkout collects email + shipping address.
- After payment, orders store shipping details; use them for fulfilment.
- Stripe can send customer receipts automatically (enable in Stripe Dashboard if desired).

## 8. Refunds or payment issues
1. Open the order in **Orders**, click **Stripe**.
2. Refund/void in Stripe.
3. Update order status to “Cancelled” or “Refunded”.

## 9. Managing campaigns (homepage hero)
- Go to **Campaigns**. Pick layout (Classic/Split/Minimal).
- Point CTA to a live product slug.
- Optional badge + highlight bullets. Reduced-motion visitors see the static image fallback.

## 10. Weekly health checks
- Dashboard: revenue/fulfilment/payouts/low stock.
- `/status`: confirm env vars present.
- Optional: run branch smoke or review latest screenshots in `docs/qa-screenshots/`.

## 11. Admin copilot (optional)
- Robot icon in header (`⌘⇧C` / `Ctrl+Shift+C`).
- Ask workflow questions or analytics summaries. Undo tokens and logs are recorded.
- Paused if OpenAI keys are absent; check `AGENTS.md`.

## 12. Troubleshooting
- Product not visible: ensure Product Active = on, variant Active = on, and stock > 0.
- Checkout issues: check Stripe keys and webhook status; inspect recent webhook events in Stripe Dashboard.
- Shipping only shows flat rates: AusPost keys missing; static Stripe rates are expected until provided.

Happy selling!
