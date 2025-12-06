import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { assertAdmin } from '@/lib/assistant/auth'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { getAssistantTools, COPILOT_SYSTEM_PROMPT, AGENT_CONFIGS } from '@/lib/assistant/config'
import { randomUUID } from 'crypto'

// =============================================================================
// Streaming Responses API Implementation
// =============================================================================
// Based on official OpenAI starter app: https://github.com/openai/openai-responses-starter-app
//
// Key features:
// - Server-Sent Events (SSE) for real-time streaming
// - Native function calling for actions (create_product, receive_stock, etc.)
// - web_search tool for research
// - Conversation state via previous_response_id
// =============================================================================

const openai = new OpenAI()

const MODEL = 'gpt-5.1'

type AgentType = 'product' | 'operations' | 'marketing' | 'general'

// Request validation
const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  image: z.string().optional(),
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  sessionId: z.string().uuid().optional(),
  previousResponseId: z.string().optional(),
  forceAgent: z.enum(['product', 'operations', 'marketing', 'general']).optional(),
})

// Intent classification for agent routing
const INTENT_KEYWORDS: Array<{ agent: AgentType; keywords: string[] }> = [
  { agent: 'product', keywords: ['add product', 'new product', 'create product', 'add item', 'analyze image', 'what is this', 'identify', 'describe product', 'write description'] },
  { agent: 'operations', keywords: ['stock', 'inventory', 'how many', 'available', 'add stock', 'receive', 'restock', 'order status', 'shipping'] },
  { agent: 'marketing', keywords: ['social post', 'instagram', 'facebook', 'email', 'newsletter', 'article', 'blog', 'announce'] },
]

function classifyIntent(message: string): AgentType {
  const lower = message.toLowerCase()
  for (const { agent, keywords } of INTENT_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) {
      return agent
    }
  }
  return 'general'
}

// Build input for the API
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

export async function POST(request: NextRequest) {
  let sessionId: string | null = null
  let adminUserId: string | null = null

  try {
    // Auth check
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }
    adminUserId = adminCheck.userId

    // Parse and validate request
    const json = await request.json()
    const parsed = requestSchema.safeParse(json)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten() }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { messages, forceAgent, previousResponseId } = parsed.data
    const latestUserMessage = [...messages].reverse().find(m => m.role === 'user')

    if (!latestUserMessage) {
      return new Response(
        JSON.stringify({ error: 'Missing user message' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    sessionId = parsed.data.sessionId ?? randomUUID()
    const hasImage = messages.some(m => m.image)

    // Determine agent type
    const agent: AgentType = forceAgent || classifyIntent(latestUserMessage.content)
    const agentConfig = AGENT_CONFIGS[agent]

    // Session tracking
    await ensureAssistantSession({
      sessionId,
      userId: adminUserId,
      metadata: { agent, model: MODEL },
    })

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.user',
      payload: { content: latestUserMessage.content, hasImage },
    })

    // Build instructions
    const instructions = [
      COPILOT_SYSTEM_PROMPT,
      agentConfig.systemPromptAddition,
    ].filter(Boolean).join('\n\n')

    // Build input for API
    let input: string | OpenAI.Responses.EasyInputMessage[]
    if (previousResponseId) {
      // Continue conversation - only send latest message
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
      // New conversation - send last 8 messages
      input = buildInput(messages.slice(-8))
    }

    // Get tools (web_search + function tools)
    const tools = getAssistantTools()

    // Create streaming response
    const events = await openai.responses.create({
      model: MODEL,
      input,
      instructions,
      tools,
      stream: true,
      store: true,
      parallel_tool_calls: false,
      ...(previousResponseId && { previous_response_id: previousResponseId }),
      ...(agentConfig.reasoningEffort && { reasoning: { effort: agentConfig.reasoningEffort } }),
      max_output_tokens: 4096,
    })

    // Create SSE ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send session info first
          controller.enqueue(`data: ${JSON.stringify({
            event: 'session.info',
            data: { sessionId, agent, model: MODEL },
          })}\n\n`)

          for await (const event of events) {
            // Forward all events to client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            })
            controller.enqueue(`data: ${data}\n\n`)
          }
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(`data: ${JSON.stringify({
            event: 'error',
            data: { error: error instanceof Error ? error.message : 'Streaming failed' },
          })}\n\n`)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Assistant stream error:', errorMessage)

    if (sessionId) {
      try {
        await logAssistantEvent({
          sessionId,
          eventType: 'error',
          payload: { error: errorMessage },
          userId: adminUserId,
        })
      } catch {}
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
