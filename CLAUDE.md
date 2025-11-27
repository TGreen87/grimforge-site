# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Local dev server at localhost:3000
npm run build            # Production build
npm run lint             # ESLint (run before pushing)
npm run type-check       # TypeScript check (some admin type errors expected)
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
npm run test:puppeteer   # Smoke tests with screenshots
```

## Deployment

**Netlify auto-deploys from git pushes. Do NOT use `netlify deploy` CLI.**

```bash
git push origin dev_claude    # → https://dev-claude--obsidianriterecords.netlify.app
git push origin main          # → https://obsidianriterecords.com (production)
```

- `dev_claude` is the active development branch
- Only push to `main` after owner approval
- Admin panel: append `/admin` to any deploy URL

## Architecture Overview

### Tech Stack
- **Next.js 15** (App Router) with **TypeScript**
- **Supabase** (PostgreSQL + RLS + SSR auth)
- **Refine + Ant Design** for admin panel
- **Stripe** for payments
- **OpenAI GPT-5.1** + **ElevenLabs** for AI copilot

### Route Structure
- `app/(site)/` - Public storefront (products, cart, articles)
- `app/admin/` - Admin panel (Refine framework)
- `app/api/admin/` - Protected admin APIs
- `app/api/checkout/`, `app/api/stripe/` - Payment flows

### Key Architectural Patterns

**Authentication:** `middleware.ts` handles Supabase SSR auth and gates `/admin` routes by checking `user_roles` table for admin role.

**Admin API Auth:** Use `assertAdmin(request)` from `lib/assistant/auth.ts` in API route handlers.

**Supabase Clients:**
- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server-side (cookies)
- `lib/supabase/admin.ts` - Service role (bypasses RLS)

**AI Copilot:** `app/api/admin/assistant/route.ts` handles chat with multi-model support (OpenAI, Google, Anthropic). Models configured in `MODELS` object with `reasoningEffort` parameter for GPT-5.1.

**Legacy Migration:** `src/` contains React SPA code being migrated to `app/`. Path aliases (`@/components`, `@/hooks`) may resolve to either location.

## Environment Variables

Required in Netlify (not in git):
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
OPENAI_API_KEY
ELEVENLABS_API_KEY
GOOGLE_AI_API_KEY
ANTHROPIC_API_KEY
```

## Working with the AI Copilot

Model configuration in `app/api/admin/assistant/route.ts`:
- GPT-5.1 uses `reasoning.effort` parameter (`none`/`low`/`medium`/`high`)
- Product/Marketing agents use `high` reasoning
- Operations/General use `none` (fast responses)

Voice features in `app/api/admin/voice/`:
- `voices/route.ts` - Lists all ElevenLabs account voices
- `tts/route.ts` - Text-to-speech synthesis
- `stt/route.ts` - Speech-to-text transcription
