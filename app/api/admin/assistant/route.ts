import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAssistantKnowledge } from '@/lib/assistant/knowledge'
import { assistantActionTypes, buildActionsPrompt } from '@/lib/assistant/actions'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { assertAdmin } from '@/lib/assistant/auth'

const OPENAI_MODEL = process.env.ASSISTANT_CHAT_MODEL || 'gpt-4.1-mini'
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
})

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1),
  topic: z.string().optional(),
  sessionId: z.string().uuid().optional(),
})

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

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    const json = await request.json()
    const parsedRequest = requestSchema.safeParse(json)

    if (!parsedRequest.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsedRequest.error.flatten() }, { status: 400 })
    }

    const { messages } = parsedRequest.data
    const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'Missing user message' }, { status: 400 })
    }

    sessionId = parsedRequest.data.sessionId ?? randomUUID()

    await ensureAssistantSession({
      sessionId,
      userId: adminUserId,
      metadata: parsedRequest.data.topic ? { topic: parsedRequest.data.topic } : undefined,
    })

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.user',
      payload: { content: latestUserMessage.content },
    })

    const knowledge = await searchAssistantKnowledge(latestUserMessage.content, {
      matchCount: 6,
      threshold: 0.2,
    })

    const contextText = knowledge.length ? buildContextSnippet(knowledge) : 'No context available'

    const openAiMessages = [
      {
        role: 'system',
        content: CHAT_SYSTEM_PROMPT,
      },
      {
        role: 'system',
        content: `Context from internal documentation and dashboards:\n\n${contextText}`,
      },
      {
        role: 'system',
        content: buildActionsPrompt(),
      },
      ...messages.slice(-8),
    ]

    const basePayload = {
      model: OPENAI_MODEL,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: assistantResponseSchemaName,
          schema: assistantResponseSchemaDefinition,
        },
      },
    }

    const responsesBasePayload = {
      model: OPENAI_MODEL,
      temperature: 0.2,
    }

    let parsedResponse: z.infer<typeof assistantResponseSchema> | null = null
    let responseSource: 'chat' | 'responses' = 'chat'

    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...basePayload,
        messages: openAiMessages,
      }),
    })

    let errorPayload: any = null

    if (chatResponse.ok) {
      const completion = (await chatResponse.json()) as {
        choices: Array<{ message: { content: string } }>
      }
      const rawContent = completion.choices[0]?.message?.content?.trim()
      if (rawContent) {
        try {
          parsedResponse = assistantResponseSchema.parse(JSON.parse(rawContent))
        } catch {
          parsedResponse = { reply: rawContent, actions: [] }
        }
      }
    } else {
      try {
        errorPayload = await chatResponse.json()
      } catch {
        errorPayload = { error: { message: await chatResponse.text() } }
      }
    }

    if (!parsedResponse) {
      const message: string = errorPayload?.error?.message ?? ''
      const requiresResponses =
        chatResponse.status === 404 && typeof message === 'string' && message.includes('v1/responses')

      if (requiresResponses) {
        responseSource = 'responses'
        const responsesResponse = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            ...responsesBasePayload,
            input: toResponsesInput(openAiMessages),
          }),
        })

        if (responsesResponse.ok) {
          const fallbackJson = await responsesResponse.json()
          const rawText = extractResponsesText(fallbackJson)
          if (rawText) {
            try {
              parsedResponse = assistantResponseSchema.parse(JSON.parse(rawText))
            } catch {
              parsedResponse = { reply: rawText, actions: [] }
            }
            errorPayload = null
          } else {
            errorPayload = {
              error: { message: 'Responses API returned no output text' },
            }
          }
        } else {
          try {
            errorPayload = await responsesResponse.json()
          } catch {
            errorPayload = { error: { message: await responsesResponse.text() } }
          }
        }
      }
    }

    if (!parsedResponse) {
      const errorMessage = errorPayload?.error?.message || 'Assistant request failed'
      console.error('Assistant call failed', errorPayload)
      await logAssistantEvent({
        sessionId,
        userId: adminUserId,
        eventType: 'error',
        payload: { scope: 'openai', message: errorMessage },
      })
      return NextResponse.json({ error: errorMessage, sessionId }, { status: 500 })
    }

    await logAssistantEvent({
      sessionId,
      userId: adminUserId,
      eventType: 'message.assistant',
      payload: {
        content: parsedResponse.reply,
        actions: parsedResponse.actions ?? [],
        sources: knowledge,
        metadata: { responseSource },
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
    })
  } catch (error) {
    console.error('Assistant handler failure', error)
    if (sessionId) {
      try {
        await logAssistantEvent({
          sessionId,
          eventType: 'error',
          payload: { scope: 'unexpected', detail: String(error) },
          userId: adminUserId ?? null,
        })
      } catch (logError) {
        console.error('Failed to log assistant error', logError)
      }
    }
    return NextResponse.json({ error: 'Unexpected error', sessionId: sessionId ?? undefined }, { status: 500 })
  }
}
