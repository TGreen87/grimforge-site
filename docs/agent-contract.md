# Agent Contract: Grimness System

## Purpose
Build a production grimness experience.

## Roles
### IDE Agent owns
- GrimnessContext provider implementation and public API docs
- GrimnessSlider UX, styling, and accessibility behaviours
- AudioBed orchestration and sync with grimness changes
- VoidToggle including keyboard listener for code 666
- `app/layout.tsx` page transition orchestration
- Global CSS for void-mode and fog states
- Minimal test scaffolding and CI wiring for UI layers
- Album grid rendering and card-level integration hooks
- ThreeDTilt wrapper insertion and configuration
- Per-page markup adjustments tied to grimness states
- `artManifest` population with real selectors
- Storefront UI glue code and copy tweaks tied to grimness levels

### CLI Agent owns
- LocalStorage persistence utilities and hydration guards
- Server actions and Supabase adapters supporting grimness data
- Feature flag plumbing and environment validation for grimness rollout
- Build pipeline updates, shared config, and quality gates for grimness assets
- Test harness extensions (Vitest + Playwright) covering persistence, void swap, and tilt clamp logic
- Observability hooks (logging, metrics) for grimness-specific events

## File Boundaries and Paths
- `app/(site)/grimness/` for route-level experiences and layout wrappers
- `src/context/GrimnessContext.tsx` for provider, hooks, and types surfaced to consumers
- `src/components/grimness/GrimnessSlider.tsx` and supporting UI atoms under the same directory
- `src/components/media/AudioBed.tsx` for audio layering logic
- `src/components/controls/VoidToggle.tsx` for the keyboard 666 toggle control
- `src/lib/tilt/ThreeDTilt.ts` for shared tilt behaviour and reduced-motion fallbacks
- `src/lib/grimness/storage.ts` for persistence helpers
- `src/styles/grimness.css` appended via `app/layout.tsx`
- `tests/grimness/` mirroring source structure for unit coverage
- `e2e/tests/grimness/` for route-level and interaction specs

## Branch Model and Merge Rules
- Work happens on `uitest` and short-lived task branches prefixed with `grimness/` cut from `uitest`.
- Rebase task branches onto `uitest` before merging to keep linear history.
- Require green targeted checks (lint/type/test subsets touched) before merging back to `uitest`.
- Push `uitest` to Netlify branch deploy for validation; promote to `dev` only after Definition of Done is satisfied.
- No direct commits to `dev` or `main` for grimness features until contract sign-off.

## Definition of Done
- [ ] Five grimness levels persisted in `localStorage`.
- [ ] Triggering 666 toggles `html.void-mode` and swaps mapped imagery assets.
- [ ] Album cards support desktop-only 3D tilt with reduced-motion and mobile fallbacks.
- [ ] Framer Motion route transitions scale with grimness and honour reduced-motion settings.
- [ ] Vitest covers context persistence, void swap logic, and tilt clamp behaviour.
- [ ] Lighthouse scores reach 90+ desktop and 85+ mobile on the main catalog page.
