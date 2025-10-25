import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAssistantKnowledge } from '@/lib/assistant/knowledge'
import { assistantActionTypes, assistantActions, buildActionsPrompt } from '@/lib/assistant/actions'
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
  actions: z.array(assistantActionSchema).default([]),
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

function parameterTypeToJsonSchema(type: 'string' | 'number' | 'boolean'): JsonSchema {
  switch (type) {
    case 'number':
      return { type: 'number' }
    case 'boolean':
      return { type: 'boolean' }
    case 'string':
    default:
      return { type: 'string' }
  }
}

const attachmentPropertySchema: JsonSchema = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['url'],
    properties: {
      url: { type: 'string' },
      name: { type: 'string' },
      type: { type: ['string', 'null'] },
      storagePath: { type: ['string', 'null'] },
      size: { type: ['number', 'null'] },
    },
  },
}

function createAssistantResponseJsonSchema(): JsonSchema {
  const actionSchemas = assistantActions.map((action) => {
    const parameterProperties: Record<string, JsonSchema> = {}
    const requiredParameters: string[] = []

    action.parameters.forEach((parameter) => {
      parameterProperties[parameter.name] = parameterTypeToJsonSchema(parameter.type)
      if (parameter.required) {
        requiredParameters.push(parameter.name)
      }
    })

    // Allow optional attachment metadata on any action
    parameterProperties.__attachments = attachmentPropertySchema
    parameterProperties.__autoExecute = { type: 'boolean' }

    return {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'summary', 'parameters'],
      properties: {
        type: { const: action.type },
        summary: { type: 'string' },
        parameters: {
          type: 'object',
          additionalProperties: false,
          properties: parameterProperties,
          ...(requiredParameters.length ? { required: requiredParameters } : {}),
        },
      },
    }
  })

  return {
    type: 'object',
    additionalProperties: false,
    required: ['reply', 'actions'],
    properties: {
      reply: { type: 'string' },
      actions: {
        type: 'array',
        items: { oneOf: actionSchemas },
        default: [],
      },
    },
  }
}

interface OpenAIResponsesContentItem {
  type?: string
  text?: string
}

interface OpenAIResponsesOutputItem {
  content?: OpenAIResponsesContentItem[]
}

interface OpenAIResponsesPayload {
  output?: OpenAIResponsesOutputItem[]
}

interface OpenAIErrorPayload {
  error?: {
    message?: string
  }
}

function extractResponsesText(payload: OpenAIResponsesPayload) {
  const outputs = Array.isArray(payload.output) ? payload.output : []
  for (const output of outputs) {
    const contentItems = Array.isArray(output?.content) ? output.content : []
    const match = contentItems.find(
      (item): item is OpenAIResponsesContentItem =>
        item?.type === 'output_text' && typeof item?.text === 'string',
    )
    if (match?.text) {
      return match.text.trim()
    }
  }
  return ''
}

const assistantResponseSchemaName = 'AssistantResponse'

type JsonSchema = Record<string, unknown>

const assistantResponseSchemaDefinition = createAssistantResponseJsonSchema()

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

    const responsesPayload = {
      model: OPENAI_MODEL,
      temperature: 0.2,
      input: toResponsesInput(openAiMessages),
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: assistantResponseSchemaName,
          schema: assistantResponseSchemaDefinition,
          strict: true,
        },
      },
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(responsesPayload),
    })

    let parsedResponse: z.infer<typeof assistantResponseSchema> | null = null
    let errorPayload: OpenAIErrorPayload | null = null

    if (openAiResponse.ok) {
      const responseJson = (await openAiResponse.json()) as OpenAIResponsesPayload
      const rawText = extractResponsesText(responseJson)

      if (rawText) {
        try {
          parsedResponse = assistantResponseSchema.parse(JSON.parse(rawText))
        } catch {
          parsedResponse = { reply: rawText, actions: [] }
        }
      } else {
        errorPayload = {
          error: { message: 'Responses API returned no output text' },
        }
      }
    } else {
      try {
        errorPayload = (await openAiResponse.json()) as OpenAIErrorPayload
      } catch {
        errorPayload = { error: { message: await openAiResponse.text() } }
      }
    }

    const responseSource = 'responses' as const

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
