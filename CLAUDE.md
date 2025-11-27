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

**CRITICAL: Always fetch current docs via WebSearch, never rely on Claude's training data for OpenAI API.**

---

### Official Documentation Links

#### Core Docs (Guides & Tutorials)
- **Overview**: https://platform.openai.com/docs/overview
- **Quickstart**: https://platform.openai.com/docs/quickstart
- **Models**: https://platform.openai.com/docs/models
- **Using GPT-5.1**: https://platform.openai.com/docs/guides/latest-model
- **Migrate to Responses API**: https://platform.openai.com/docs/guides/migrate-to-responses

#### API Reference (Endpoints)
- **Responses API**: https://platform.openai.com/docs/api-reference/responses
- **Chat Completions**: https://platform.openai.com/docs/api-reference/chat
- **Audio (TTS/STT)**: https://platform.openai.com/docs/api-reference/audio
- **Images**: https://platform.openai.com/docs/api-reference/images
- **Embeddings**: https://platform.openai.com/docs/api-reference/embeddings
- **Vector Stores**: https://platform.openai.com/docs/api-reference/vector-stores
- **Realtime API**: https://platform.openai.com/docs/api-reference/realtime

#### Tools & Agents
- **Agents Overview**: https://platform.openai.com/docs/guides/agents
- **Function Calling**: https://platform.openai.com/docs/guides/function-calling
- **Web Search Tool**: https://platform.openai.com/docs/guides/tools-web-search
- **Code Interpreter**: https://platform.openai.com/docs/guides/tools-code-interpreter
- **Connectors & MCP**: https://platform.openai.com/docs/guides/tools-connectors-mcp

#### Additional Resources
- **Cookbook**: https://cookbook.openai.com/
- **Forum**: https://community.openai.com/categories

---

### Current Model IDs (Nov 2025)

**NOTE**: GPT-5/5.1 may require special API access. Use `gpt-4o` as reliable fallback.

```
GPT-4o Series (RECOMMENDED - widely available):
- gpt-4o                     # Best general model, vision support
- gpt-4o-mini                # Fast, cheap, good for simple tasks

GPT-5.1 Series (May require API access):
- gpt-5.1                    # Flagship, reasoning_effort defaults to 'none'
- gpt-5.1-chat-latest        # ChatGPT model
- gpt-5.1-codex              # Optimized for code

GPT-5 Series (Aug 2025 - May require API access):
- gpt-5                      # Most advanced general model
- gpt-5-mini                 # Faster, cheaper
- gpt-5-pro                  # Maximum capability

GPT-4.1 Series (Lower cost alternative):
- gpt-4.1                    # Main model
- gpt-4.1-mini               # Fast, 83% cheaper than GPT-4o
- gpt-4.1-nano               # Fastest, 1M context

O-Series Reasoning:
- o3, o3-mini                # Extended thinking
- o4-mini                    # Latest reasoning model

Realtime/Voice:
- gpt-realtime               # Voice agents (GA Aug 2025)
- gpt-realtime-mini          # $0.16/min

Image Generation:
- gpt-image-1                # Native multimodal (replaced DALL-E 3)
- gpt-image-1-mini           # Affordable option

Embeddings:
- text-embedding-3-small     # 1536 dimensions, cheapest
- text-embedding-3-large     # Best quality, supports dimension reduction

Audio:
- gpt-4o-transcribe          # Best STT accuracy
- gpt-4o-mini-tts            # Steerable TTS (can instruct tone/accent)
- whisper-1                  # Legacy transcription
```

---

### API Architecture: Responses vs Chat Completions

#### Responses API (RECOMMENDED - March 2025)
The new unified API that should be used for all new development:

```typescript
// POST https://api.openai.com/v1/responses
{
  model: "gpt-5.1",
  input: "Your prompt" | [{role: "user", content: "..."}],

  // Conversation State (killer feature)
  store: true,                        // Persist for 30 days
  previous_response_id: "resp_...",   // Continue conversation

  // Tools (built-in)
  tools: [
    { type: "web_search_preview" },   // Real-time web search
    { type: "file_search" },          // Vector store RAG
    { type: "code_interpreter" },     // Python sandbox
    { type: "apply_patch" },          // Code editing
    { type: "shell" },                // Command execution
  ],

  // Container for code interpreter
  container: { type: "auto", file_ids: ["file-xxx"] },

  // Output control
  max_output_tokens: 4096,

  // Structured output (Responses API uses text.format, NOT response_format)
  text: { format: { type: "json_schema", name: "...", schema: {...} } },

  // Reasoning (GPT-5.1) - NESTED OBJECT FORMAT
  reasoning: { effort: "low" | "medium" | "high" },  // omit entirely for 'none'

  // Streaming
  stream: true,
}

// Response includes:
{
  id: "resp_...",
  output_text: "Generated response",
  output: [...],  // Detailed output items
  usage: { input_tokens, output_tokens, reasoning_tokens }
}
```

**Key Benefits of Responses API:**
- Server-managed conversation state (no need to resend history)
- Built-in tools (web search, code interpreter, file search)
- 40-80% better cache utilization than Chat Completions
- GPT-5 works best on Responses API

#### Chat Completions API (Legacy, still supported)

```typescript
// POST https://api.openai.com/v1/chat/completions
{
  model: "gpt-5.1",
  messages: [
    { role: "system", content: "..." },
    { role: "user", content: "..." },
  ],

  // Token limits
  max_completion_tokens: 4096,  // GPT-5+ (NOT max_tokens)

  // Sampling
  temperature: 0.7,             // 0-2, supported on GPT-5/5.1
  top_p: 1,

  // Tools/Functions
  tools: [{
    type: "function",
    function: {
      name: "get_weather",
      description: "...",
      parameters: { type: "object", properties: {...} },
      strict: true,             // Guarantees schema compliance
    }
  }],
  tool_choice: "auto" | "none" | "required",
  parallel_tool_calls: true,

  // Structured Output
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "MyResponse",
      schema: { type: "object", properties: {...}, additionalProperties: false },
    }
  },

  // Reasoning (GPT-5.1) - NESTED OBJECT
  reasoning: { effort: "high" },

  // Streaming
  stream: true,
}
```

---

### Reasoning Effort (GPT-5/5.1)

GPT-5 has a unified system with smart routing between base model and thinking mode:

| Level | Use Case | Token Usage | Latency |
|-------|----------|-------------|---------|
| `minimal` or omit | Fast responses, latency-sensitive | 1x baseline | Fastest |
| `low` | Simple tasks | ~3x | Fast |
| `medium` | Balanced | ~8x | Moderate |
| `high` | Complex reasoning, coding, analysis | ~23x | Slowest |

**GPT-5.1 defaults to 'none'** - ideal for latency-sensitive workloads.
Reasoning tokens are hidden but count as output tokens in billing.

Context limits: 272K input + 128K output = 400K total context.

---

### Built-in Tools (Responses API)

#### Web Search
```typescript
tools: [{ type: "web_search_preview" }]
```
- Real-time web search with citations
- Available on GPT-4o, GPT-4.1, GPT-5, o-series

#### Code Interpreter
```typescript
tools: [{ type: "code_interpreter" }],
container: { type: "auto", file_ids: ["file-xxx"] }
```
- Python execution in sandboxed container
- Can create files, plots, CSVs
- Container active for 1 hour, 20-min idle timeout
- Pricing: $2.50 per 1000 calls + $0.10/GB-day storage

#### File Search (RAG)
```typescript
tools: [{ type: "file_search", vector_store_ids: ["vs_xxx"] }]
```
- Automatic chunking, embedding, and retrieval
- Up to 20 chunks per query
- Pricing: $0.10/GB-day (first GB free)

#### Apply Patch (Code Editing)
```typescript
tools: [{ type: "apply_patch" }]
```
- Structured diff-based code editing
- No JSON escaping needed
- Works with file content in context

#### Shell
```typescript
tools: [{ type: "shell" }]
```
- Execute shell commands
- Developer must implement execution and return results

---

### Structured Outputs

Guarantees 100% schema compliance:

```typescript
response_format: {
  type: "json_schema",
  json_schema: {
    name: "ProductAnalysis",
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        price: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["title", "price", "tags"],
      additionalProperties: false,  // REQUIRED for structured outputs
    }
  }
}
```

**Limitations:**
- `additionalProperties: false` is required
- All fields must be in `required`
- No `oneOf`, `anyOf` support
- First request with new schema has ~10s latency (then cached)

---

### Prompt Caching

Automatic 50% discount on repeated prefixes:
- Activates at 1024+ tokens
- Increments in 128-token chunks
- Cache TTL: 5-10 minutes (cleared after 1 hour of inactivity)
- Check `usage.cached_tokens` in response

Extended caching (24 hours) available for high-volume users.

---

### Batch API

50% discount for async processing:
```typescript
// Upload JSONL file with requests
// POST https://api.openai.com/v1/batches
{
  input_file_id: "file-xxx",
  endpoint: "/v1/chat/completions",
  completion_window: "24h"
}
```
- Results within 24 hours
- 250M input tokens can be enqueued for GPT-4T

---

### Streaming

#### Responses API Events
```typescript
stream: true

// Key events:
// response.created - Start
// response.output_text.delta - Text chunks
// response.reasoning_summary_text.delta - Thinking (if reasoning)
// response.completed - End with full response
```

#### Chat Completions Deltas
```typescript
// data: {"choices":[{"delta":{"content":"Hello"}}]}
// Each chunk has "delta" with partial content
// finish_reason: null until complete
```

---

### Voice & Audio

#### Text-to-Speech
```typescript
// POST https://api.openai.com/v1/audio/speech
{
  model: "gpt-4o-mini-tts",  // Steerable
  input: "Hello world",
  voice: "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" |
         "nova" | "onyx" | "sage" | "shimmer" | "marin" | "cedar",
  instructions: "Speak warmly with a slight accent"  // NEW: steering
}
```

#### Speech-to-Text
```typescript
// POST https://api.openai.com/v1/audio/transcriptions
{
  model: "gpt-4o-transcribe" | "whisper-1",
  file: audioFile,
  language: "en"  // Optional
}
// Max 25MB, supports mp3, mp4, wav, webm, etc.
```

#### Realtime API (Voice Agents)
- WebSocket or WebRTC connection
- Direct speech-to-speech (no intermediate STT/TTS)
- ~500ms time-to-first-byte latency
- Supports function calling, interruptions
- Pricing: $0.16-0.18/min

---

### Image Generation

```typescript
// POST https://api.openai.com/v1/images/generations
{
  model: "gpt-image-1",
  prompt: "A serene mountain landscape",
  size: "1024x1024" | "1024x1536" | "1536x1024",
  quality: "low" | "medium" | "high",
  n: 1
}
// Pricing: ~$0.02 (low) to $0.19 (high) per image
```

---

### Embeddings

```typescript
// POST https://api.openai.com/v1/embeddings
{
  model: "text-embedding-3-small",
  input: "Your text here",
  dimensions: 1536  // Can reduce (e.g., 256) via Matryoshka encoding
}
```
- text-embedding-3-small: 1536 dims, $0.00002/1K tokens
- text-embedding-3-large: Up to 3072 dims, best quality

---

### MCP (Model Context Protocol)

OpenAI adopted MCP in March 2025:
```typescript
// Responses API with MCP
tools: [{
  type: "mcp",
  server_url: "https://your-mcp-server.com",
  // OR use hosted connector
  connector_id: "connector_xxx",
  access_token: "..."
}]
```

---

### Background Mode & Webhooks

For long-running tasks:
```typescript
// POST https://api.openai.com/v1/responses
{ ..., background: true }

// Response: { id: "resp_...", status: "queued" }
// Poll for completion or use webhooks
```

Webhooks (configured in dashboard):
- `response.completed`
- `batch.completed`
- `fine_tuning.job.succeeded`

---

### Agents SDK (Python)

```python
from openai_agents import Agent, Runner

agent = Agent(
    name="ProductAnalyst",
    instructions="You analyze products for a music store...",
    model="gpt-5.1",
    tools=[WebSearchTool(), FileSearchTool(), CodeInterpreterTool()]
)

result = Runner.run_sync(agent, "Analyze this vinyl record...")
```

Key concepts:
- **Agents**: LLMs with instructions and tools
- **Handoffs**: Delegate to specialized agents
- **Guardrails**: Input/output validation
- **Sessions**: Automatic conversation history
- **Tracing**: Built-in debugging/observability

---

### Rate Limits (Tier-based)

| Tier | GPT-5 TPM | GPT-5-mini TPM | RPM |
|------|-----------|----------------|-----|
| Free | 3,500 | 40,000 | 3 |
| Tier 1 | 500,000 | 2,000,000 | 500 |
| Tier 2+ | Higher | Higher | Higher |

Limits auto-increase with usage history and payments.

---

### Deprecations & Migration

- **Assistants API**: Sunset Aug 2026, migrate to Responses API
- **Chat Completions**: Supported indefinitely, but Responses API recommended
- **max_tokens**: Use `max_completion_tokens` for GPT-5+
- **functions**: Use `tools` parameter instead

---

### Cost Optimization Tips

1. Use `gpt-5-mini` or `gpt-4.1-mini` for simple tasks
2. Enable prompt caching (automatic at 1024+ tokens)
3. Use Batch API for 50% discount on async workloads
4. Set `reasoning_effort: "minimal"` for fast responses
5. Use structured outputs to avoid re-processing
6. Leverage `previous_response_id` to avoid resending history
