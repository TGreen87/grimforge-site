# CLAUDE.md - Obsidian Rite Records (grimforge-site)

## Project Overview

**Obsidian Rite Records** - Next.js 15 e-commerce platform for an Australian metal music import business (vinyls, CDs, cassettes). Built with Tailwind, Supabase, Stripe, and Netlify.

- **Repository:** https://github.com/TGreen87/grimforge-site.git
- **Production:** https://obsidianriterecords.com
- **Dev Branch Preview:** https://dev-claude--obsidianriterecords.netlify.app

---

## Git Workflow

### Branches
- **`main`** - Production (deploy only after owner approval)
- **`dev_claude`** - Active development branch (auto-deploys to preview URL)

### Deployment
**Just push to git - Netlify auto-deploys:**
```bash
git add -A && git commit -m "message" && git push origin dev_claude
```
- `dev_claude` → https://dev-claude--obsidianriterecords.netlify.app
- `main` → https://obsidianriterecords.com

**DO NOT use `netlify deploy --prod`** - it bypasses branch deploys and pushes untested code to production.

### Pre-Commit Checks
```bash
npm run lint          # ESLint
npm run type-check    # TypeScript (some admin type issues expected)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.5 (App Router) |
| UI | Tailwind CSS, Ant Design 5, Radix UI, shadcn/ui |
| Admin | Refine 4.57 (@refinedev/antd) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase SSR (cookie-based) |
| Payments | Stripe |
| AI/LLM | OpenAI (GPT-5.1), ElevenLabs (TTS) |
| Hosting | Netlify (branch deploys) |
| Node | v22 |

---

## Project Structure

```
app/
├── (site)/           # Public storefront (products, cart, articles)
├── admin/            # Admin panel (Refine + Ant Design)
│   ├── dashboard/    # Overview metrics
│   ├── products/     # Product CRUD
│   ├── orders/       # Order management
│   ├── articles/     # Content management
│   ├── settings/     # Admin settings, voice config
│   └── ...
└── api/
    ├── admin/        # Protected admin APIs
    │   ├── assistant/  # Copilot chat/actions
    │   ├── voice/      # ElevenLabs TTS/STT
    │   ├── n8n/        # Workflow automation
    │   └── ...
    ├── checkout/     # Stripe checkout
    └── stripe/       # Webhooks

lib/
├── supabase/         # Client factories (client, server, admin)
├── assistant/        # Copilot logic (actions, sessions, knowledge)
├── stripe.ts         # Stripe config
└── webhooks/         # n8n integration

src/                  # Legacy React SPA (migrating to app/)
├── components/       # Reusable UI blocks
├── hooks/            # Custom React hooks
└── contexts/         # Auth, Cart, Wishlist providers

supabase/
├── migrations/       # SQL schema migrations
└── functions/        # Edge functions
```

---

## Environment Variables

### Required
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
OPENAI_API_KEY=
```

### AI Features
```bash
ELEVENLABS_API_KEY=          # Voice TTS
GOOGLE_AI_API_KEY=           # Gemini models
ANTHROPIC_API_KEY=           # Claude models
ASSISTANT_CHAT_MODEL=        # Default: gpt-5.1-chat-latest
```

### Optional
```bash
STRIPE_WEBHOOK_SECRET=
N8N_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
```

---

## AI/Copilot Configuration

### Current Model Setup (Nov 2025)
Located in `app/api/admin/assistant/route.ts`

| Agent | Model | Reasoning |
|-------|-------|-----------|
| Product | gpt-5.1-chat-latest | high |
| Marketing | gpt-5.1-chat-latest | high |
| Operations | gpt-5.1-chat-latest | none |
| General | gpt-5.1-chat-latest | none |

### GPT-5.1 Reasoning Parameter
Per OpenAI API docs, `reasoning.effort` controls thinking depth:
- `none` (default) - Fast, no reasoning tokens
- `low`/`medium` - Moderate deliberation
- `high` - Best intelligence/reliability

```typescript
// API payload structure
{
  model: "gpt-5.1-chat-latest",
  messages: [...],
  reasoning: { effort: "high" },
  max_completion_tokens: 4096
}
```

### Voice (ElevenLabs)
- TTS: `/api/admin/voice/tts`
- STT: `/api/admin/voice/stt`
- Voices: `/api/admin/voice/voices` (returns all account voices)

---

## Key Patterns

### Authentication
- **Middleware:** `middleware.ts` handles Supabase SSR auth
- **Admin Gate:** Checks `user_roles` table for `admin` role
- **Cookie Chunking:** Supabase may split cookies into `.0`, `.1` parts

### Admin Panel
- Built with **Refine** framework + **Ant Design**
- Gothic theme: Cinzel font, dark crimson accents (#8B0000)
- All admin routes protected by middleware

### API Routes
- Admin routes require auth (checked in route handlers)
- Use `assertAdmin(request)` helper for auth validation
- Structured JSON responses with proper error handling

### Forms
- **react-hook-form** + **Zod** validation
- Server-side validation in API routes

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # TypeScript check

# Testing
npm run test             # Vitest unit tests
npm run test:e2e         # Playwright E2E
npm run test:puppeteer   # Smoke tests

# Database
npx supabase status      # Check local Supabase
```

---

## Important Files

| File | Purpose |
|------|---------|
| `app/api/admin/assistant/route.ts` | Copilot chat API (model config here) |
| `app/admin/ui/AdminAssistantDrawer.tsx` | Copilot UI component |
| `app/admin/ui/VoiceSettingsModal.tsx` | Voice settings modal |
| `app/admin/settings/page.tsx` | Admin settings page |
| `middleware.ts` | Auth & admin gating |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `netlify.toml` | Deployment config |

---

## Troubleshooting

### Copilot "Unexpected Error"
1. Check model IDs are valid (use `/v1/models` endpoint)
2. Verify `OPENAI_API_KEY` is set in Netlify env vars
3. Check Netlify function logs for detailed error

### Voice Not Working
1. Verify `ELEVENLABS_API_KEY` is set
2. Voices API should return all account voices (not filtered)
3. Check browser console for TTS errors

### Build Failures
- Some type errors in admin are expected (Refine/AntD types)
- Netlify builds may succeed even if local fails
- Check `npm run type-check` output

---

## Session Notes

### Current State (Nov 2025)
- GPT-5.1 models with high reasoning for product/marketing
- ElevenLabs voice integration working
- VoiceSettingsModal z-index fixed for Drawer context
- n8n webhook integration added (untested by user)

### Pending
- User to test Copilot on dev branch
- User to test voice TTS functionality
- n8n workflow setup when ready
