import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { assistantActionTypes, buildActionsPrompt } from '@/lib/assistant/actions'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { assertAdmin } from '@/lib/assistant/auth'

// =============================================================================
// OpenAI Responses API Implementation (Nov 2025)
// =============================================================================
// Using the Responses API instead of legacy Chat Completions:
// - Server-managed conversation state via previous_response_id
// - Built-in tools: web_search_preview, file_search, code_interpreter
// - Structured outputs with JSON schema
// - 30-day conversation persistence with store: true
//
// Docs: https://platform.openai.com/docs/api-reference/responses
// =============================================================================

type AgentType = 'product' | 'operations' | 'marketing' | 'general'

interface ModelConfig {
  id: string
  displayName: string
  supportsVision: boolean
  reasoningEffort?: 'low' | 'medium' | 'high' // omit for 'none' (default for 5.1)
}

// Current models - using gpt-4o as fallback until GPT-5.1 issues resolved
const MODELS: Record<string, ModelConfig> = {
  // GPT-4o - reliable, well-tested
  'gpt-4o': { id: 'gpt-4o', displayName: 'GPT-4o', supportsVision: true },
  'gpt-4o-mini': { id: 'gpt-4o-mini', displayName: 'GPT-4o Mini', supportsVision: true },
  // GPT-5.1 Series - Best for agentic tasks (may need API access)
  'gpt-5.1-high': { id: 'gpt-5.1', displayName: 'GPT-5.1 High Reasoning', supportsVision: true, reasoningEffort: 'high' },
  'gpt-5.1': { id: 'gpt-5.1', displayName: 'GPT-5.1', supportsVision: true },
}

// Agent configurations with specialized system prompts
const AGENT_CONFIGS: Record<AgentType, { defaultModel: string; systemPromptAddition: string }> = {
  product: {
    defaultModel: 'gpt-4o',  // Using gpt-4o until GPT-5.1 API access confirmed
    systemPromptAddition: `
You specialize in product management for a metal music import business (vinyls, CDs, cassettes).
When analyzing images: identify band/artist, album title, format, special editions, condition.
Generate compelling metal-scene-appropriate product descriptions.
Suggest categories, tags, and pricing based on format and rarity.`,
  },
  operations: {
    defaultModel: 'gpt-4o-mini',
    systemPromptAddition: `
You specialize in inventory and order operations for an Australian music import business.
Help with stock management, order processing, shipping estimates (AU focused).
Provide clear summaries, flag issues (low stock, delays), and suggest optimizations.`,
  },
  marketing: {
    defaultModel: 'gpt-4o',
    systemPromptAddition: `
You specialize in marketing content for underground metal music.
Your voice: authentic to metal/underground scene, knowledgeable, passionate but professional.
Create social posts (Instagram, Facebook), articles, email campaigns, release announcements.
Use genre-appropriate language, relevant hashtags, mention local AU shipping/AUD pricing.`,
  },
  general: {
    defaultModel: 'gpt-4o-mini',
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
  // OpenAI Responses API conversation state
  previousResponseId: z.string().optional(),
  forceAgent: z.enum(['product', 'operations', 'marketing', 'general']).optional(),
  forceModel: z.string().optional(),
})

// JSON Schema for structured output (Responses API format)
const RESPONSE_JSON_SCHEMA = {
  name: 'AssistantResponse',
  schema: {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'The assistant reply to show the user' },
      actions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: assistantActionTypes },
            summary: { type: 'string' },
            parameters: { type: 'object', additionalProperties: true },
          },
          required: ['type', 'summary', 'parameters'],
          additionalProperties: false,
        },
      },
    },
    required: ['reply'],
    additionalProperties: false,
  },
}

// =============================================================================
// OpenAI Responses API Call
// =============================================================================
interface ResponsesAPIInput {
  role: 'user' | 'assistant' | 'system'
  content: Array<{ type: string; text?: string; image_url?: string }>
}

interface ResponsesAPIResult {
  id: string
  outputText: string
  raw: any
  usage?: {
    inputTokens: number
    outputTokens: number
    cachedTokens?: number
  }
}

async function callResponsesAPI(
  input: string | ResponsesAPIInput[],
  options: {
    model: string
    instructions?: string
    previousResponseId?: string
    reasoningEffort?: 'low' | 'medium' | 'high'
    tools?: Array<{ type: string }>
    useStructuredOutput?: boolean
  }
): Promise<ResponsesAPIResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const payload: any = {
    model: options.model,
    input,
    // Store conversation for 30 days, enables previous_response_id
    store: true,
  }

  // System instructions
  if (options.instructions) {
    payload.instructions = options.instructions
  }

  // Continue conversation from previous response
  if (options.previousResponseId) {
    payload.previous_response_id = options.previousResponseId
  }

  // Reasoning effort (GPT-5.1) - omit for 'none'/default
  if (options.reasoningEffort) {
    payload.reasoning_effort = options.reasoningEffort
  }

  // Built-in tools
  if (options.tools && options.tools.length > 0) {
    payload.tools = options.tools
  }

  // Structured output with JSON schema
  if (options.useStructuredOutput !== false) {
    payload.text = {
      format: {
        type: 'json_schema',
        ...RESPONSE_JSON_SCHEMA,
      },
    }
  }

  // Token limit
  payload.max_output_tokens = 4096

  console.log('Responses API payload:', JSON.stringify(payload, null, 2))

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()

  if (!response.ok) {
    console.error('Responses API error:', responseText)
    // Parse error to get cleaner message
    try {
      const errorJson = JSON.parse(responseText)
      throw new Error(`OpenAI API error: ${errorJson.error?.message || responseText}`)
    } catch {
      throw new Error(`OpenAI API error: ${responseText}`)
    }
  }

  // Clean control characters before parsing
  const cleanedText = responseText.replace(/[\x00-\x1F\x7F]/g, (char) => {
    if (char === '\n' || char === '\t' || char === '\r') return char
    return ''
  })

  const data = JSON.parse(cleanedText)

  // Extract output text from Responses API format
  const outputText = extractOutputText(data)

  return {
    id: data.id,
    outputText,
    raw: data,
    usage: data.usage ? {
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      cachedTokens: data.usage.input_tokens_details?.cached_tokens,
    } : undefined,
  }
}

// Extract text from Responses API output format
function extractOutputText(response: any): string {
  // Try output_text shorthand first
  if (response.output_text) {
    return response.output_text
  }

  // Otherwise parse the output array
  const outputs = Array.isArray(response.output) ? response.output : []
  for (const output of outputs) {
    if (output.type === 'message' && Array.isArray(output.content)) {
      for (const content of output.content) {
        if (content.type === 'output_text' && content.text) {
          return content.text
        }
        // Also check for 'text' type (some responses use this)
        if (content.type === 'text' && content.text) {
          return content.text
        }
      }
    }
  }
  return ''
}

// Build input for Responses API (handles images)
function buildResponsesInput(
  messages: Array<{ role: string; content: string; image?: string }>,
  systemContext: string
): ResponsesAPIInput[] {
  const input: ResponsesAPIInput[] = []

  // Add system context as first user message with context
  // (Responses API uses 'instructions' for system prompt, but we can include context here)

  for (const msg of messages) {
    const contentParts: Array<{ type: string; text?: string; image_url?: string }> = []

    // Add text content
    contentParts.push({ type: 'input_text', text: msg.content })

    // Add image if present
    if (msg.image) {
      const imageUrl = msg.image.startsWith('data:')
        ? msg.image
        : `data:image/jpeg;base64,${msg.image}`
      contentParts.push({ type: 'input_image', image_url: imageUrl })
    }

    input.push({
      role: msg.role as 'user' | 'assistant',
      content: contentParts,
    })
  }

  return input
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

    // Check if any message has an image
    const hasImage = messages.some(m => m.image)

    // Determine agent and model
    const agent: AgentType = forceAgent || classifyIntent(latestUserMessage.content)
    const agentConfig = AGENT_CONFIGS[agent]

    // Select model
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

    // Build system instructions with agent specialization
    const instructions = [
      CHAT_SYSTEM_PROMPT,
      agentConfig.systemPromptAddition,
      buildActionsPrompt(),
      'Respond in JSON format: { "reply": "your message", "actions": [...] }',
    ].filter(Boolean).join('\n\n')

    // Build input for Responses API
    // If we have a previousResponseId, we only send the new message
    // Otherwise, send the conversation history
    let input: string | ResponsesAPIInput[]

    if (previousResponseId) {
      // Continuing conversation - only send new message
      if (hasImage && latestUserMessage.image) {
        input = [{
          role: 'user',
          content: [
            { type: 'input_text', text: latestUserMessage.content },
            {
              type: 'input_image',
              image_url: latestUserMessage.image.startsWith('data:')
                ? latestUserMessage.image
                : `data:image/jpeg;base64,${latestUserMessage.image}`
            },
          ],
        }]
      } else {
        // Simple string input for text-only continuation
        input = latestUserMessage.content
      }
    } else {
      // New conversation - send full history (last 8 messages)
      input = buildResponsesInput(messages.slice(-8), '')
    }

    // Optional: Enable web search for product/marketing research
    const tools: Array<{ type: string }> = []
    if (agent === 'product' || agent === 'marketing') {
      tools.push({ type: 'web_search_preview' })
    }

    // Call Responses API
    const result = await callResponsesAPI(input, {
      model: modelConfig.id,
      instructions,
      previousResponseId,
      reasoningEffort: modelConfig.reasoningEffort,
      tools: tools.length > 0 ? tools : undefined,
      useStructuredOutput: true,
    })

    // Parse the response
    let parsedResponse: z.infer<typeof assistantResponseSchema>

    const rawContent = result.outputText.trim()
    if (!rawContent) {
      throw new Error('Empty response from API')
    }

    try {
      // Try to parse as JSON
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = assistantResponseSchema.parse(JSON.parse(jsonMatch[0]))
      } else {
        parsedResponse = { reply: rawContent, actions: [] }
      }
    } catch {
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
          responseId: result.id,
          usage: result.usage,
        },
      },
    })

    return NextResponse.json({
      sessionId,
      message: parsedResponse.reply,
      actions: parsedResponse.actions ?? [],
      // Responses API conversation state - client should pass this back
      responseId: result.id,
      // Metadata
      agent,
      model: selectedModel,
      modelDisplayName: modelConfig.displayName,
      usage: result.usage,
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
