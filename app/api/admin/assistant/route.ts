import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAssistantKnowledge } from '@/lib/assistant/knowledge'
import { assistantActionTypes, buildActionsPrompt } from '@/lib/assistant/actions'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { assertAdmin } from '@/lib/assistant/auth'

// Multi-model configuration
type ModelProvider = 'openai' | 'google' | 'anthropic'
type AgentType = 'product' | 'operations' | 'marketing' | 'general'

interface ModelConfig {
  id: string
  provider: ModelProvider
  displayName: string
  supportsVision: boolean
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high' // GPT-5.1 reasoning_effort parameter
}

const MODELS: Record<string, ModelConfig> = {
  // OpenAI GPT-5.1 series (Nov 2025) - with reasoning_effort parameter
  // Per API docs: GPT-5.1 defaults to 'none', use 'high' for intelligence/reliability over speed
  'gpt-5.1-high': { id: 'gpt-5.1-chat-latest', provider: 'openai', displayName: 'GPT-5.1 High Reasoning', supportsVision: true, reasoningEffort: 'high' },
  'gpt-5.1-medium': { id: 'gpt-5.1-chat-latest', provider: 'openai', displayName: 'GPT-5.1 Medium', supportsVision: true, reasoningEffort: 'medium' },
  'gpt-5.1': { id: 'gpt-5.1', provider: 'openai', displayName: 'GPT-5.1', supportsVision: true, reasoningEffort: 'none' },
  'gpt-5.1-chat-latest': { id: 'gpt-5.1-chat-latest', provider: 'openai', displayName: 'GPT-5.1 Chat', supportsVision: true, reasoningEffort: 'none' },
  'gpt-5.1-codex': { id: 'gpt-5.1-codex', provider: 'openai', displayName: 'GPT-5.1 Codex', supportsVision: true, reasoningEffort: 'medium' },
  // OpenAI GPT-5 series (Aug 2025) - reasoning_effort defaults to 'medium'
  'gpt-5': { id: 'gpt-5', provider: 'openai', displayName: 'GPT-5', supportsVision: true },
  'gpt-5-mini': { id: 'gpt-5-mini', provider: 'openai', displayName: 'GPT-5 Mini', supportsVision: true },
  'gpt-5-codex': { id: 'gpt-5-codex', provider: 'openai', displayName: 'GPT-5 Codex', supportsVision: true },
  'gpt-5-pro': { id: 'gpt-5-pro', provider: 'openai', displayName: 'GPT-5 Pro', supportsVision: true },
  // OpenAI o-series reasoning models
  'o3-mini': { id: 'o3-mini', provider: 'openai', displayName: 'o3 Mini', supportsVision: false },
  'o4-mini': { id: 'o4-mini', provider: 'openai', displayName: 'o4 Mini', supportsVision: false },
  // Google models - Gemini series
  'gemini-2.0-flash': { id: 'gemini-2.0-flash', provider: 'google', displayName: 'Gemini 2.0 Flash', supportsVision: true },
  'gemini-2.5-flash': { id: 'gemini-2.5-flash', provider: 'google', displayName: 'Gemini 2.5 Flash', supportsVision: true },
  // Anthropic models - Claude 4.5 series
  'claude-sonnet-4-5': { id: 'claude-sonnet-4-5-20250929', provider: 'anthropic', displayName: 'Claude 4.5 Sonnet', supportsVision: true },
}

// Agent configurations with specialized system prompts
// Upgraded per user request: high reasoning for complex tasks, gpt-5.1-chat-latest for general
const AGENT_CONFIGS: Record<AgentType, { defaultModel: string; systemPromptAddition: string }> = {
  product: {
    defaultModel: 'gpt-5.1-high', // High reasoning for product analysis and descriptions
    systemPromptAddition: `
You specialize in product management for a metal music import business (vinyls, CDs, cassettes).
When analyzing images: identify band/artist, album title, format, special editions, condition.
Generate compelling metal-scene-appropriate product descriptions.
Suggest categories, tags, and pricing based on format and rarity.`,
  },
  operations: {
    defaultModel: 'gpt-5.1-chat-latest', // Upgraded from gpt-5-mini
    systemPromptAddition: `
You specialize in inventory and order operations for an Australian music import business.
Help with stock management, order processing, shipping estimates (AU focused).
Provide clear summaries, flag issues (low stock, delays), and suggest optimizations.`,
  },
  marketing: {
    defaultModel: 'gpt-5.1-high', // High reasoning for creative marketing content
    systemPromptAddition: `
You specialize in marketing content for underground metal music.
Your voice: authentic to metal/underground scene, knowledgeable, passionate but professional.
Create social posts (Instagram, Facebook), articles, email campaigns, release announcements.
Use genre-appropriate language, relevant hashtags, mention local AU shipping/AUD pricing.`,
  },
  general: {
    defaultModel: 'gpt-5.1-chat-latest', // Upgraded from gpt-5-mini
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

const OPENAI_MODEL = process.env.ASSISTANT_CHAT_MODEL || 'gpt-5.1-chat-latest'
const CHAT_SYSTEM_PROMPT =
  process.env.ASSISTANT_CHAT_SYSTEM_PROMPT ||
  [
    'You are Obsidian Rite Records Copilot, a calm and encouraging operations helper for a busy label owner.',
    'Explain everything in friendly, everyday language—no technical jargon, no acronyms without expanding them first.',
    'When you reference the admin, mention the exact screen or button the owner should look for.',
    'Offer clear next steps in short checklists the owner can follow immediately.',
    'Only suggest automated actions when you already have the required details. If something essential is missing (price, title, artist, etc.), ask a follow-up question instead of guessing.',
    'Describe in one sentence what will happen if the owner confirms an automated action.',
  ].join(' ')

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
  image: z.string().optional(), // Base64 encoded image for vision
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  topic: z.string().optional(),
  sessionId: z.string().uuid().optional(),
  forceAgent: z.enum(['product', 'operations', 'marketing', 'general']).optional(),
  forceModel: z.string().optional(),
})

// API call functions for each provider
// Per OpenAI API docs: GPT-5.1 uses reasoning.effort parameter (none/low/medium/high)
async function callOpenAI(
  messages: Array<{ role: string; content: any }>,
  model: string,
  useStructuredOutput: boolean = true,
  reasoningEffort?: 'none' | 'low' | 'medium' | 'high'
): Promise<{ text: string; raw: any }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  // Check if this is a reasoning model (o-series)
  const isOSeriesModel = model.startsWith('o3') || model.startsWith('o4')
  // Check if this is a GPT-5.1 model (supports reasoning.effort parameter)
  const isGpt51 = model.startsWith('gpt-5.1')
  // Check if this is a GPT-5+ model (use max_completion_tokens instead of deprecated params)
  const isGpt5Plus = model.startsWith('gpt-5')

  const payload: any = {
    model,
    messages,
  }

  // GPT-5.1 models: add reasoning.effort parameter per API docs
  // Per docs: "GPT-5.1 defaults to 'none', use 'high' for intelligence/reliability over speed"
  if (isGpt51 && reasoningEffort) {
    payload.reasoning = {
      effort: reasoningEffort,
    }
  }

  // O-series models don't support temperature, top_p, etc.
  if (isOSeriesModel) {
    payload.max_completion_tokens = 4096
  } else if (isGpt5Plus) {
    // GPT-5+ models use max_completion_tokens
    payload.max_completion_tokens = 4096
    // When reasoning is enabled (not 'none'), temperature may not be supported
    if (!reasoningEffort || reasoningEffort === 'none') {
      payload.temperature = 0.2
    }
  } else {
    // Legacy models use max_tokens
    payload.max_tokens = 4096
    payload.temperature = 0.2
  }

  if (useStructuredOutput && !isOSeriesModel) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: assistantResponseSchemaName,
        schema: assistantResponseSchemaDefinition,
      },
    }
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return { text: data.choices[0]?.message?.content || '', raw: data }
}

async function callGemini(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<{ text: string; raw: any }> {
  const apiKey = process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured')

  // Convert to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemMessage = messages.find(m => m.role === 'system')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: systemMessage
          ? { parts: [{ text: systemMessage.content }] }
          : undefined,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.2,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${error}`)
  }

  const data = await response.json()
  return { text: data.candidates?.[0]?.content?.parts?.[0]?.text || '', raw: data }
}

async function callClaude(
  messages: Array<{ role: string; content: string }>,
  model: string
): Promise<{ text: string; raw: any }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const systemMessage = messages.find(m => m.role === 'system')
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemMessage?.content,
      messages: chatMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${error}`)
  }

  const data = await response.json()
  return { text: data.content?.[0]?.text || '', raw: data }
}

// Route to the appropriate provider
async function callModel(
  messages: Array<{ role: string; content: any }>,
  modelId: string,
  useStructuredOutput: boolean = true
): Promise<{ text: string; raw: any; provider: ModelProvider }> {
  const config = MODELS[modelId]
  if (!config) {
    // Fallback to OpenAI for unknown models
    const result = await callOpenAI(messages, modelId, useStructuredOutput)
    return { ...result, provider: 'openai' }
  }

  switch (config.provider) {
    case 'google':
      const geminiResult = await callGemini(messages, config.id)
      return { ...geminiResult, provider: 'google' }
    case 'anthropic':
      const claudeResult = await callClaude(messages, config.id)
      return { ...claudeResult, provider: 'anthropic' }
    default:
      // Pass the actual model ID and reasoning effort from config
      const openaiResult = await callOpenAI(messages, config.id, useStructuredOutput, config.reasoningEffort)
      return { ...openaiResult, provider: 'openai' }
  }
}

function toResponsesInput(messages: Array<{ role: string; content: string }>) {
  return messages.map((message) => ({
    role: message.role,
    content: [
      {
        type: 'input_text' as const,
        text: message.content,
      },
    ],
  }))
}

function extractResponsesText(json: any) {
  const outputs = Array.isArray(json?.output) ? json.output : []
  for (const output of outputs) {
    const contentItems = Array.isArray(output?.content) ? output.content : []
    const match = contentItems.find((item: any) => item?.type === 'output_text' && typeof item?.text === 'string')
    if (match?.text) {
      return match.text.trim()
    }
  }
  return ''
}

const assistantResponseSchemaName = 'AssistantResponse'

const assistantResponseSchemaDefinition = {
  type: 'object',
  required: ['reply'],
  properties: {
    reply: { type: 'string' },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['type', 'summary', 'parameters'],
        properties: {
          type: {
            type: 'string',
            enum: actionTypeEnum.options,
          },
          summary: { type: 'string' },
          parameters: { type: 'object', additionalProperties: true },
        },
      },
    },
  },
  additionalProperties: false,
} as const

function buildContextSnippet(docs: Awaited<ReturnType<typeof searchAssistantKnowledge>>) {
  return docs
    .map((doc, index) => {
      const heading = doc.title || doc.metadata?.title || doc.source_path
      return `Source ${index + 1}: ${heading}\n${doc.content.trim()}`
    })
    .join('\n\n')
}

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
      return NextResponse.json({ error: 'Invalid request', details: parsedRequest.error.flatten() }, { status: 400 })
    }

    const { messages, forceAgent, forceModel } = parsedRequest.data
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 })
    }

    sessionId = parsedRequest.data.sessionId ?? randomUUID()

    // Check if any message has an image (for vision routing)
    const hasImage = messages.some(m => m.image)

    // Determine agent and model
    const agent: AgentType = forceAgent || classifyIntent(latestUserMessage.content)
    const agentConfig = AGENT_CONFIGS[agent]

    // Select model: force > vision-capable > agent default
    let selectedModel = forceModel || agentConfig.defaultModel
    if (hasImage && !MODELS[selectedModel]?.supportsVision) {
      // Upgrade to vision-capable model with high reasoning for best image analysis
      selectedModel = 'gpt-5.1-high'
    }

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

    const knowledge = await searchAssistantKnowledge(latestUserMessage.content, {
      matchCount: 6,
      threshold: 0.2,
    })

    const contextText = knowledge.length ? buildContextSnippet(knowledge) : 'No context available'

    // Build system prompt with agent specialization
    const systemPrompt = [
      CHAT_SYSTEM_PROMPT,
      agentConfig.systemPromptAddition,
      `\nRespond in JSON format with this structure: { "reply": "your message", "actions": [...] }`,
    ].filter(Boolean).join('\n')

    // Build messages for the API
    const apiMessages: Array<{ role: string; content: any }> = [
      { role: 'system', content: systemPrompt },
      { role: 'system', content: `Context from internal documentation:\n\n${contextText}` },
      { role: 'system', content: buildActionsPrompt() },
    ]

    // Add conversation history with image support
    for (const msg of messages.slice(-8)) {
      if (msg.image && MODELS[selectedModel]?.provider === 'openai') {
        // OpenAI vision format
        apiMessages.push({
          role: msg.role,
          content: [
            { type: 'text', text: msg.content },
            {
              type: 'image_url',
              image_url: {
                url: msg.image.startsWith('data:') ? msg.image : `data:image/jpeg;base64,${msg.image}`,
              },
            },
          ],
        })
      } else {
        apiMessages.push({ role: msg.role, content: msg.content })
      }
    }

    // Call the selected model
    let parsedResponse: z.infer<typeof assistantResponseSchema> | null = null
    let responseProvider: ModelProvider = 'openai'

    try {
      const useStructuredOutput = MODELS[selectedModel]?.provider === 'openai'
      const result = await callModel(apiMessages, selectedModel, useStructuredOutput)
      responseProvider = result.provider

      const rawContent = result.text.trim()
      if (rawContent) {
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Model call failed'
      console.error(`${selectedModel} call failed:`, error)

      // Fallback to default OpenAI model if the selected one fails
      if (selectedModel !== OPENAI_MODEL && process.env.OPENAI_API_KEY) {
        console.log(`Falling back to ${OPENAI_MODEL}`)
        try {
          const fallbackConfig = MODELS[OPENAI_MODEL]
          const fallbackResult = await callOpenAI(
            apiMessages,
            fallbackConfig?.id || OPENAI_MODEL,
            true,
            fallbackConfig?.reasoningEffort
          )
          responseProvider = 'openai'
          const rawContent = fallbackResult.text.trim()
          if (rawContent) {
            try {
              parsedResponse = assistantResponseSchema.parse(JSON.parse(rawContent))
            } catch {
              parsedResponse = { reply: rawContent, actions: [] }
            }
          }
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError)
        }
      }

      if (!parsedResponse) {
        await logAssistantEvent({
          sessionId,
          userId: adminUserId,
          eventType: 'error',
          payload: { scope: selectedModel, message: errorMessage },
        })
        return NextResponse.json({ error: errorMessage, sessionId }, { status: 500 })
      }
    }

    if (!parsedResponse) {
      return NextResponse.json({ error: 'No response generated', sessionId }, { status: 500 })
    }

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.assistant',
      payload: {
        content: parsedResponse.reply,
        actions: parsedResponse.actions ?? [],
        sources: knowledge,
        metadata: { agent, model: selectedModel, provider: responseProvider },
      },
    })

    return NextResponse.json({
      sessionId,
      message: parsedResponse.reply,
      sources: knowledge.map((doc, index) => ({
        id: doc.id,
        title: doc.title ?? doc.metadata?.title ?? doc.source_path,
        snippet: doc.content.slice(0, 280),
        similarity: doc.similarity,
        order: index + 1,
      })),
      actions: parsedResponse.actions ?? [],
      // Include agent/model info for UI display
      agent,
      model: selectedModel,
      provider: responseProvider,
      modelDisplayName: MODELS[selectedModel]?.displayName || selectedModel,
    })
  } catch (error) {
    const errorDetail = error instanceof Error ? `${error.name}: ${error.message}\n${error.stack}` : String(error)
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
    // Always return error detail for now (can be restricted later)
    return NextResponse.json({
      error: errorDetail.slice(0, 1000),
      sessionId: sessionId ?? undefined
    }, { status: 500 })
  }
}
