# Codex Field Guide

This is the quick reference for Codex agents.

## Branch policy

- Default branch - `dev` - stage here first.  
- Experiments - `uitest` - UI only.  
- Production - `main` - fast-forward only after manual verification.

## Never do this

- Do not open PRs.  
- Do not run local tests or local builds.  

## Always do this

- Commit and push directly to the current branch using conventional messages.
- After each push, print the Netlify deploy URL.
- Wait for human verification before continuing.

## Targets

- Checkout must accept `{ priceId, quantity }`, map `{ variant_id }` via Supabase, and return a Stripe Checkout URL.
- Links must be clickable with left click. Remove click-blocking overlays and bad nesting of anchors and buttons.
- Hydration must be stable. Move client only logic into `useEffect` of client components.
- Audio volume must be clamped and asset paths must exist.
- Radix dialogs must include a proper description for screen readers.

## Feature flags

- `NEXT_PUBLIC_GRIMNESS_ENABLED`
- `NEXT_PUBLIC_VOIDMODE_ENABLED`
- `NEXT_PUBLIC_AUDIO_ENABLED`

## Macros

- `codex> set branch dev`  
- `codex> set branch uitest`  
- `codex> fix checkout`  
- `codex> fix clicks`  
- `codex> fix hydration`  
- `codex> fix audio`  
- `codex> fix a11y`  
- `codex> deploy verify`
