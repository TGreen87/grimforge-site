# Codex Agents Guide - grimforge-site

This document defines how Codex agents work in this repository and how they ship changes safely.

## Branches and deploys

- `main` - production - https://obsidianriterecords.com  
- `dev` - staging - https://dev--obsidianriterecords.netlify.app  
- `uitest` - experiments - https://uitest--obsidianriterecords.netlify.app

**Default branch for Codex agents is `dev`.**  
Use `uitest` only for UI experiments.

## Non-negotiable workflow rules

- Do not open PRs. Commit and push directly to the branch.
- Do not run local tests or local builds. Verification happens through Netlify branch deploys only.
- Keep every change minimal, scoped, and reversible.
- Use conventional commit messages, for example:
  - `feat(checkout): normalize payload and add zod validation`
  - `fix(ui): remove overlay intercept and restore link clicks`
  - `chore(a11y): add DialogDescription to Radix dialogs`
- After each push, print the Netlify branch deploy URL and wait for human verification.

## Areas of focus

1. **Checkout**
   - API accepts `{ priceId, quantity }`.
   - Legacy `{ variant_id, quantity }` must be mapped to Stripe Price ID using Supabase, then normalized to `{ priceId, quantity }`.
   - Quantity must be a positive integer.
   - Return `{ url }` for a Stripe Checkout Session on success.
   - On 4xx return structured JSON with a specific `code` and human-readable `message`.

2. **Clickable UI**
   - Remove or scope full page overlays and high `z-index` wrappers that intercept clicks.
   - Do not nest `<button>` inside `<a>` or `<Link>` or the reverse.
   - Prefer `<Link href="...">` over manual `router.push` for anchors.

3. **Hydration stability**
   - Avoid dynamic values at SSR time. Move `Date.now`, `Math.random`, `window`, and `navigator` usage into `useEffect` of client components.

4. **Audio**
   - Always clamp `HTMLMediaElement.volume` to `[0, 1]`.
   - Asset paths must resolve. If `/public/audio/vinyl.mp3` is missing, do not call `play`.

5. **Accessibility**
   - For every Radix `DialogContent`, provide `DialogDescription` or `aria-describedby`.
   - Maintain visible focus indicators and keyboard reachability.

## Feature flags

- `NEXT_PUBLIC_GRIMNESS_ENABLED` - enables grimness slider and visuals.
- `NEXT_PUBLIC_VOIDMODE_ENABLED` - enables the 666 Void Mode toggle and art swaps.
- `NEXT_PUBLIC_AUDIO_ENABLED` - enables the subtle audio bed if the asset exists.

## Agent macros

Use these macro commands when running Codex CLI v0.49.

- `codex> set branch dev`
- `codex> set branch uitest`
- `codex> fix checkout`
- `codex> fix clicks`
- `codex> fix hydration`
- `codex> fix audio`
- `codex> fix a11y`
- `codex> deploy verify`

Each macro does a small set of focused edits, commits with a conventional message, pushes, and prints the Netlify deploy URL.

## Verification

- Human verifies the branch deploy on Netlify for the target branch.
- If a change regresses production, fast-forward `main` from the last green commit or `git revert` the offending commit on `main`.

## Rollback plan

- Use `git revert <sha>` on the branch that introduced the issue.
- Push and verify the Netlify branch deploy has recovered the page.
- If required, temporarily turn a feature flag off in `.env` to neutralize a feature while investigating.

## Known pitfalls

- Browser extensions may inject content scripts that cause React hydration mismatches and custom element collisions. The site must be robust enough to function; however, treat extension-triggered visual diffs as non-blocking unless they break core flows like checkout or navigation.
