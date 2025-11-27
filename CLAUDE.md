# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run lint             # ESLint (run before pushing)
npm run type-check       # TypeScript check (some admin type errors expected)
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E tests
```

## Deployment

**We develop against Netlify branch deploys, not localhost. Do NOT use `netlify deploy` CLI.**

```bash
git push origin dev_claude    # → https://dev-claude--obsidianriterecords.netlify.app
git push origin main          # → https://obsidianriterecords.com (production)
```

- `dev_claude` is the active development branch
- Only push to `main` after explicit owner approval
- Admin panel: append `/admin` to any deploy URL
- **No PRs** - merge directly when approved

## Slash Commands

Available in `.claude/commands/`:
- `/deploy-status` - Check Netlify deploy status
- `/test-api` - Test dev branch API endpoints
- `/openai-models` - List available OpenAI models
- `/supabase-status` - Check database status
- `/ship` - Commit and push to dev_claude
- `/promote` - Merge to main (requires owner approval)
- `/env-check` - Verify Netlify environment variables

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
- GPT-5.1 uses `reasoning_effort` parameter (top-level, not nested)
- Valid values: `low`, `medium`, `high` (omit for none/default)
- Product/Marketing agents use `high` reasoning
- Operations/General use `none` (fast responses)

Voice features in `app/api/admin/voice/`:
- `voices/route.ts` - Lists all ElevenLabs account voices
- `tts/route.ts` - Text-to-speech synthesis
- `stt/route.ts` - Speech-to-text transcription

## OpenAI API Reference (ALWAYS USE THESE - NOT TRAINING DATA)

**CRITICAL: Always fetch current docs, never rely on Claude's training data for OpenAI API.**

### Official Documentation Links
- **API Overview**: https://platform.openai.com/docs/overview
- **Chat Completions**: https://platform.openai.com/docs/api-reference/chat/create
- **Models List**: https://platform.openai.com/docs/models
- **Responses API** (newer): https://platform.openai.com/docs/api-reference/responses

### Current Model IDs (Nov 2025)
```
GPT-5.1 Series:
- gpt-5.1, gpt-5.1-chat-latest, gpt-5.1-codex

GPT-5 Series:
- gpt-5, gpt-5-2025-08-07, gpt-5-mini, gpt-5-pro, gpt-5-codex

O-Series Reasoning:
- o3-mini, o4-mini
```

### Chat Completions Parameters (GPT-5/5.1)
```typescript
{
  model: string,                    // Required: model ID
  messages: Message[],              // Required: conversation
  max_completion_tokens: number,    // GPT-5+ uses this (not max_tokens)
  temperature: number,              // 0-2, controls randomness
  reasoning_effort: 'low' | 'medium' | 'high',  // GPT-5.1 only, top-level
  response_format: { type: 'json_schema', json_schema: {...} },
  tools: Tool[],                    // Function calling
  stream: boolean,
}
```

### Important Notes
- **max_completion_tokens** replaces deprecated `max_tokens` for GPT-5+
- **reasoning_effort** is a TOP-LEVEL parameter, not nested under `reasoning`
- **temperature** IS supported for GPT-5/5.1 (range 0-2)
- O-series models (o3, o4) do NOT support temperature/top_p
- Responses API is the newer unified interface, Chat Completions is legacy but still supported
