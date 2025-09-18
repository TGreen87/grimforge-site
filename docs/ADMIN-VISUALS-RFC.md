# Admin Visual Overhaul — RFC

Purpose: Improve daily admin usability and clarity with consistent theme tokens, denser layout, readable tables, clearer forms, and better quick actions. This RFC scopes the work for Phase 10 (Implementation Plan) and will be iterated in small, reversible commits on `dev`.

## Goals
- Improve information density without sacrificing readability (compact defaults with breathing room).
- Strengthen hierarchy with consistent typography, spacing, and surface colors.
- Make tables easier to scan (sticky header, zebra, selection affordances).
- Clarify forms with better labels/help text and grouped fields; normalize terminology.
- Provide quick actions for common tasks: toggle active, adjust price, receive stock.

## Tokens & Theme (AntD v5)
- Base (dark):
  - colorBgBase: `#0a0a0a` (canvas)
  - headerBg/siderBg: `#0f0f0f`
  - colorText: `#e5e7eb`
  - colorBorder: `#1f2937`
  - colorPrimary: `#8B0000` (brand accent)
  - borderRadius: 4
  - componentSize: `small` (ConfigProvider default)
- Table component tokens:
  - headerBg: `#111827`, headerColor: `#e5e7eb`
  - rowHoverBg: `#111827`
  - (Follow up) zebra rows via class helper
- Button:
  - colorPrimaryHover: `#a30000`, colorPrimaryActive: `#7a0000`

## Layout & Navigation
- Denser header & sider; improve title/section headers.
- Add breadcrumbs under header for context.
- Keep keyboard shortcuts (KBar) and quick search.

## Tables
- Default compact density (componentSize=`small`).
- Sticky table header (per-page prop where lists are long).
- Zebra rows class (even rows slightly darker).
- Selection affordances and visible bulk actions (top-right toolbar).

## Forms
- Normalize labels and help text (e.g., “URL (link)” over “slug”).
- Group fields (Basics, Pricing, Inventory, Publishing).
- Inline validation visuals.

## Quick Actions
- In-table toggles: Active on/off; quick price edit; quick stock adjust (Receive dialog).
- Receive dialog: show SKU, explain “Available (calculated)”.

## Dashboard Snapshot
- `/admin/dashboard` now opens with KPI cards, Stripe payout summary (when keys configured), recent orders, and low-stock alerts. Reference screenshot: `docs/qa-screenshots/admin-dashboard.png`.
- Quick actions (Add product, View orders, Receive stock) sit in the header; ensure future visual updates keep these primary actions above the fold.

### Upcoming Dashboard Enhancements
- Revenue goal card with editable targets + 7/30 day comparison.
- Alert tiles configurable by owner (awaiting fulfilment threshold, low stock threshold).
- Announcement history drawer with version restore.
- Timeline widget previewing recent audit events. (In progress: RPC + UI on order detail page now surfaces order timeline.)
- Slack/email alert toggles surfaced in header quick actions (pending secrets).

## Acceptance Criteria
- Products, Stock Units, Inventory, Orders adopt tokens and density.
- Visual hierarchy improved; zebra rows available on long tables.
- Receive Stock has clearer labels and context; users can complete the task without confusion.

## Phasing
1) Tokens + default density (small) + table header polish.
2) Table zebra + sticky headers on long lists; toolbar for bulk.
3) Forms grouping/labels; helper texts.
4) Quick actions (price/active/stock) iteratively.

## Rollback
- All changes are theme/config and scoped UI props; easy to revert by removing tokens or per-page options.
