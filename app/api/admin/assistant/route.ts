import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAssistantKnowledge } from '@/lib/assistant/knowledge'
import { assistantActionTypes, buildActionsPrompt } from '@/lib/assistant/actions'
import { createClient } from '@/lib/supabase/server'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'

const OPENAI_MODEL = 'gpt-4.1-mini'

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
        content:
          'You are Obsidian Rite Records Admin Copilot. You help the label owner manage the store, admin panel, and operations. ' +
          'Keep answers concise, reference relevant admin screens, and list actionable next steps. ' +
          'When the user requests help that matches a supported action, propose it in a structured way so the UI can confirm before running.'
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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: openAiMessages,
        temperature: 0.2,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'AssistantResponse',
            schema: {
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
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Assistant call failed', error)
      await logAssistantEvent({
        sessionId,
        userId: adminUserId,
        eventType: 'error',
        payload: { scope: 'openai', message: error || 'Assistant request failed' },
      })
      return NextResponse.json({ error: 'Assistant request failed', sessionId }, { status: 500 })
    }

    const completion = (await response.json()) as {
      choices: Array<{ message: { content: string } }>
    }

    const rawContent = completion.choices[0]?.message?.content?.trim()

    if (!rawContent) {
      return NextResponse.json({ error: 'No response generated' }, { status: 500 })
    }

    let parsedResponse: z.infer<typeof assistantResponseSchema>

    try {
      parsedResponse = assistantResponseSchema.parse(JSON.parse(rawContent))
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
        sources: knowledge,
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

async function assertAdmin(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (role?.role?.toLowerCase?.() === 'admin') {
    return { ok: true as const, userId: user.id }
  }

  return { ok: false as const, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
