import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { assistantActionTypes, buildActionsPrompt } from '@/lib/assistant/actions'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { assertAdmin } from '@/lib/assistant/auth'

// =============================================================================
// OpenAI Responses API Implementation (Dec 2025)
// =============================================================================
// Using the official OpenAI SDK with Responses API:
// - Server-managed conversation state via previous_response_id
// - Built-in tools: web_search_preview, file_search, code_interpreter
// - Structured outputs with JSON schema
// - 30-day conversation persistence with store: true
//
// Docs: https://platform.openai.com/docs/api-reference/responses
// =============================================================================

// Initialize OpenAI client
const openai = new OpenAI()

type AgentType = 'product' | 'operations' | 'marketing' | 'general'

interface ModelConfig {
  id: string
  displayName: string
  supportsVision: boolean
  reasoningEffort?: 'low' | 'medium' | 'high'
}

// Current models (Dec 2025)
const MODELS: Record<string, ModelConfig> = {
  'gpt-5.1-high': { id: 'gpt-5.1', displayName: 'GPT-5.1 High Reasoning', supportsVision: true, reasoningEffort: 'high' },
  'gpt-5.1-medium': { id: 'gpt-5.1', displayName: 'GPT-5.1 Medium', supportsVision: true, reasoningEffort: 'medium' },
  'gpt-5.1': { id: 'gpt-5.1', displayName: 'GPT-5.1', supportsVision: true },
}

// Agent configurations
const AGENT_CONFIGS: Record<AgentType, { defaultModel: string; systemPromptAddition: string }> = {
  product: {
    defaultModel: 'gpt-5.1-high',
    systemPromptAddition: `
You specialize in product management for a metal music import business (vinyls, CDs, cassettes).

CRITICAL: When shown a product image or asked about an album, ALWAYS use web search to:
1. Identify the band/artist and album title from the image
2. Look up the release on Discogs/Metal Archives for: tracklist, label, year, catalog number
3. Research current market pricing on Discogs, eBay for similar format
4. Find genre information and scene context

After researching, provide:
- Full product details (artist, title, format, label, year, catalog#)
- A compelling metal-scene-appropriate description
- Suggested AUD pricing based on market research
- Tags that describe the MUSIC (genre, subgenre, themes, mood, country) - NOT format info

Example tags: black metal, atmospheric, Norwegian, raw production, occult themes, melodic, second wave.`,
  },
  operations: {
    defaultModel: 'gpt-5.1',
    systemPromptAddition: `
You specialize in inventory and order operations for an Australian music import business.
Help with stock management, order processing, shipping estimates (AU focused).
Provide clear summaries, flag issues (low stock, delays), and suggest optimizations.`,
  },
  marketing: {
    defaultModel: 'gpt-5.1-high',
    systemPromptAddition: `
You specialize in marketing content for underground metal music.
Your voice: authentic to metal/underground scene, knowledgeable, passionate but professional.
Create social posts (Instagram, Facebook), articles, email campaigns, release announcements.
Use genre-appropriate language, relevant hashtags, mention local AU shipping/AUD pricing.`,
  },
  general: {
    defaultModel: 'gpt-5.1',
    systemPromptAddition: '',
  },
}

// Intent classification for agent routing
const INTENT_KEYWORDS: Array<{ agent: AgentType; keywords: string[] }> = [
  { agent: 'product', keywords: ['add product', 'new product', 'create product', 'add item', 'analyze image', 'what is this', 'identify', 'describe product', 'write description', 'generate description'] },
  { agent: 'operations', keywords: ['stock', 'inventory', 'how many', 'available', 'add stock', 'receive', 'restock', 'order status', 'where is', 'shipping', 'track', 'process order', 'ship order', 'fulfill'] },
  { agent: 'marketing', keywords: ['social post', 'instagram', 'facebook', 'post about', 'email', 'newsletter', 'campaign', 'write article', 'blog post', 'news', 'announce'] },
]

function classifyIntent(message: string): AgentType {
  const lowerMessage = message.toLowerCase()
  for (const { agent, keywords } of INTENT_KEYWORDS) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return agent
    }
  }
  return 'general'
}

const CHAT_SYSTEM_PROMPT = [
  'You are Obsidian Rite Records Copilot, a calm and encouraging operations helper for a busy label owner.',
  'You have access to web search - USE IT to research bands, albums, discography, pricing (Discogs, eBay), release info, and any other details you need.',
  'When the owner shows you a product image or asks about music, ALWAYS search the web first to gather accurate information before responding.',
  'Explain everything in friendly, everyday language—no technical jargon, no acronyms without expanding them first.',
  'When you reference the admin, mention the exact screen or button the owner should look for.',
  'Offer clear next steps in short checklists the owner can follow immediately.',
  'Only suggest automated actions when you already have the required details. If something essential is missing (price, title, artist, etc.), ask a follow-up question instead of guessing.',
  'Describe in one sentence what will happen if the owner confirms an automated action.',
].join(' ')

// Zod schemas for validation
const actionTypeEnum = z.enum(assistantActionTypes)

const assistantActionSchema = z.object({
  type: actionTypeEnum,
  summary: z.string().min(1),
  parameters: z.record(z.any()).default({}),
})

const assistantResponseSchema = z.object({
  reply: z.string().min(1),
  actions: z.array(assistantActionSchema).optional(),
})

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
  image: z.string().optional(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  topic: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  previousResponseId: z.string().optional(),
  forceAgent: z.enum(['product', 'operations', 'marketing', 'general']).optional(),
  forceModel: z.string().optional(),
})

// JSON Schema for structured output
const RESPONSE_JSON_SCHEMA = {
  name: 'AssistantResponse',
  schema: {
    type: 'object' as const,
    properties: {
      reply: { type: 'string', description: 'The assistant reply to show the user' },
      actions: {
        type: ['array', 'null'] as const,
        items: {
          type: 'object' as const,
          properties: {
            type: { type: 'string', enum: assistantActionTypes },
            summary: { type: 'string' },
            parameters: {
              type: 'object' as const,
              properties: {},
              required: [] as string[],
              additionalProperties: false,
            },
          },
          required: ['type', 'summary', 'parameters'] as const,
          additionalProperties: false,
        },
      },
    },
    required: ['reply', 'actions'] as const,
    additionalProperties: false,
  },
  strict: true,
}

// Build input for Responses API
// Using EasyInputMessage format from SDK which accepts:
// - content: string | ResponseInputMessageContentList
// - role: 'user' | 'assistant' | 'system' | 'developer'
function buildInput(
  messages: Array<{ role: string; content: string; image?: string }>
): OpenAI.Responses.EasyInputMessage[] {
  return messages.map(msg => {
    if (msg.image) {
      const imageUrl = msg.image.startsWith('data:')
        ? msg.image
        : `data:image/jpeg;base64,${msg.image}`
      return {
        role: msg.role as 'user' | 'assistant',
        content: [
          { type: 'input_text' as const, text: msg.content },
          { type: 'input_image' as const, image_url: imageUrl, detail: 'auto' as const },
        ],
      }
    }
    return {
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }
  })
}

// =============================================================================
// Main API Handler
// =============================================================================
export async function POST(request: NextRequest) {
  let sessionId: string | null = null
  let adminUserId: string | null = null

  try {
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }
    adminUserId = adminCheck.userId

    const json = await request.json()
    const parsedRequest = requestSchema.safeParse(json)

    if (!parsedRequest.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsedRequest.error.flatten() },
        { status: 400 }
      )
    }

    const { messages, forceAgent, forceModel, previousResponseId } = parsedRequest.data
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 })
    }

    sessionId = parsedRequest.data.sessionId ?? randomUUID()
    const hasImage = messages.some(m => m.image)

    // Determine agent and model
    const agent: AgentType = forceAgent || classifyIntent(latestUserMessage.content)
    const agentConfig = AGENT_CONFIGS[agent]

    let selectedModel = forceModel || agentConfig.defaultModel
    if (hasImage && !MODELS[selectedModel]?.supportsVision) {
      selectedModel = 'gpt-5.1-high'
    }

    const modelConfig = MODELS[selectedModel] || MODELS['gpt-5.1']

    await ensureAssistantSession({
      sessionId,
      userId: adminUserId,
      metadata: {
        ...(parsedRequest.data.topic ? { topic: parsedRequest.data.topic } : {}),
        agent,
        model: selectedModel,
      },
    })

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.user',
      payload: { content: latestUserMessage.content, hasImage },
    })

    // Build system instructions
    const instructions = [
      CHAT_SYSTEM_PROMPT,
      agentConfig.systemPromptAddition,
      buildActionsPrompt(),
      'Respond in JSON format: { "reply": "your message", "actions": [...] }',
    ].filter(Boolean).join('\n\n')

    // Build input - if continuing conversation, only send new message
    let input: string | OpenAI.Responses.EasyInputMessage[]
    if (previousResponseId) {
      if (hasImage && latestUserMessage.image) {
        const imageUrl = latestUserMessage.image.startsWith('data:')
          ? latestUserMessage.image
          : `data:image/jpeg;base64,${latestUserMessage.image}`
        input = [{
          role: 'user' as const,
          content: [
            { type: 'input_text' as const, text: latestUserMessage.content },
            { type: 'input_image' as const, image_url: imageUrl, detail: 'auto' as const },
          ],
        }]
      } else {
        input = latestUserMessage.content
      }
    } else {
      input = buildInput(messages.slice(-8))
    }

    // Call OpenAI Responses API using official SDK
    // Per docs: tools: [{ type: "web_search_preview" }]
    const response = await openai.responses.create({
      model: modelConfig.id,
      input,
      instructions,
      tools: [{ type: 'web_search_preview' }],
      store: true,
      ...(previousResponseId && { previous_response_id: previousResponseId }),
      ...(modelConfig.reasoningEffort && { reasoning: { effort: modelConfig.reasoningEffort } }),
      text: {
        format: {
          type: 'json_schema',
          ...RESPONSE_JSON_SCHEMA,
        },
      },
      max_output_tokens: 4096,
    })

    console.log('OpenAI response:', JSON.stringify(response, null, 2))

    // Extract output text - SDK provides output_text property
    const rawContent = response.output_text || ''
    if (!rawContent) {
      throw new Error('Empty response from API')
    }

    // Parse the response
    let parsedResponse: z.infer<typeof assistantResponseSchema>
    try {
      const parsed = JSON.parse(rawContent)
      parsedResponse = {
        reply: parsed.reply || rawContent,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      }
    } catch (parseError) {
      console.error('Failed to parse structured output:', parseError, 'Raw:', rawContent.slice(0, 500))
      parsedResponse = { reply: rawContent, actions: [] }
    }

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.assistant',
      payload: {
        content: parsedResponse.reply,
        actions: parsedResponse.actions ?? [],
        metadata: {
          agent,
          model: selectedModel,
          responseId: response.id,
          usage: response.usage,
        },
      },
    })

    return NextResponse.json({
      sessionId,
      message: parsedResponse.reply,
      actions: parsedResponse.actions ?? [],
      responseId: response.id,
      agent,
      model: selectedModel,
      modelDisplayName: modelConfig.displayName,
      usage: response.usage,
    })
  } catch (error) {
    const errorDetail = error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error)
    console.error('Assistant handler failure:', errorDetail)

    if (sessionId) {
      try {
        await logAssistantEvent({
          sessionId,
          eventType: 'error',
          payload: { scope: 'unexpected', detail: errorDetail },
          userId: adminUserId ?? null,
        })
      } catch (logError) {
        console.error('Failed to log assistant error', logError)
      }
    }

    return NextResponse.json(
      { error: errorDetail.slice(0, 1000), sessionId: sessionId ?? undefined },
      { status: 500 }
    )
  }
}
