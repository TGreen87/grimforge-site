# Site Visual & UX Enhancement RFC

_Last updated: 2025-09-19_

Purpose: Track the roadmap for elevating the public storefront (non-admin) experience for Obsidian Rite Records. This complements `docs/ADMIN-VISUALS-RFC.md` and feeds into the overall implementation plan. See `docs/README.md` for related RFCs and notes.

## Goals
- Reinforce the label's black-metal aesthetic while improving conversion and storytelling.
- Reduce friction from browse → purchase on desktop and mobile.
- Give the owner configurable, low-code tools to refresh visuals and campaigns.
- Maintain performance, accessibility, and localization readiness.

## Pillars & Workstreams

### 1. Hero & Campaign Surfaces
- Motion-ready hero with audio waveform/particle background (prefers-reduced-motion safe).
- Dual CTA stack (Listen / Buy) with mobile thumb-friendly layout.
- Configurable hero presets stored in Supabase (`campaigns` table) with owner controls in admin.
- ✅ Supabase `campaigns` table + admin CRUD shipped (feature flag `NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN`).
- ✅ Hero fetch respects start/end scheduling; admin preview via `/?previewCampaign=slug`.
- 🎧 Audio/video controls in hero (play/pause, mute) with reduced-motion fallback.
- Optional spotlight carousel for new releases (Embla carousel + framer-motion transitions).

### 2. Catalog Browsing
- Unified card grid (masonry fallback) with hover reveals (tracklist, pressing notes).
- Inline quick actions (Add to cart, Wishlist) and keyboard/focus support.
- Skeleton loaders and shimmer while data hydrates.
- Filter chip bar for formats, availability, limited runs.

### 3. Product Detail Experience
- Lightbox gallery with zoom, variant thumbnails, and sticky buy module.
- Social proof (reviews, pressing counters, low-stock badges).
- Shareable promo snippet (copy to clipboard + OG preview).
- Shipping estimate preview (AusPost/live rates when credentials provided).

### 4. Story & Trust
- “About the Label” timeline + artist roster grid.
- Press/testimonial band with quotes from blogs or partners.
- Newsletter + Instagram feed block in footer.
- Weekly rituals card (owner-configurable checklist or blog excerpts).

### 5. Checkout Flow
- Sheet-based checkout (mobile-first) with progress indicators.
- Express pay button row (Stripe wallets, Apple/Google Pay when keys arrive).
- Shipping timeline icons clarifying domestic vs. international windows.
- Contextual upsell/cross-sell slots fed by Supabase.

### 6. Microinteractions & Feedback
- Brand-aligned button hover/press states (waveform ripple, noise texture).
- Success/error toasts themed with vinyl sleeve art.
- Animated focus outlines + accessible announcements for cart updates.

### 7. CMS & Owner Tooling
- Admin-driven content blocks (campaign banner, feature grid, testimonials) using Refine forms.
- Preview/scheduler workflow for hero + announcements.
- Image management via Supabase Storage or Cloudinary integration.

### 8. Performance & Accessibility
- Responsive typography scale (fluid clamp), improved line length.
- Audit color contrast in light/dark tokens.
- Lazy-load heavy media with intersection observers.
- Automated Lighthouse/aXe script as part of deployment checklist.

## Dependencies & Third-Party Enhancements
- `framer-motion` for hero + microinteractions.
- `@formkit/auto-animate` or `auto-animate` for lightweight list transitions.
- `swiper` or extend existing `embla-carousel-react` for release carousel.
- `next-sanity-image` optional if future CMS content considered.
- `react-hook-form` + `@radix-ui/react-form` integration for owner-configurable sections.

## Acceptance Criteria
1. Visual refresh measurable via improved conversion funnel (to be defined in analytics setup).
2. All new components pass aXe automated accessibility tests.
3. Owner can launch a new campaign (hero + featured release) without code changes.
4. Checkout improvements reduce steps and expose wallet buttons once keys available.

## Rollout & Safeguards
- Feature flag major visual changes via environment-controlled toggles.
- Deploy to `dev` branch, verify Netlify previews, collect screenshots, and run Lighthouse report before promoting to `main`.
- Provide rollback instructions (toggle flags, revert migration) in session notes.

## Tracking
- Detailed tasks maintained in `docs/NEXT-STEPS.md` (Immediate) and `docs/IMPLEMENTATION-PLAN.md` (Phased).
- QA proof captured in `docs/qa-screenshots/` and future session logs.
