import { z } from 'zod'

const DEFAULT_PIPELINE_MODEL = process.env.ASSISTANT_PIPELINE_MODEL || 'gpt-4.1-mini'

interface CallOpenAIJsonOptions<T extends z.ZodTypeAny> {
  systemPrompt: string
  userPrompt: string
  schema: T
  schemaDescription: string
  model?: string
  temperature?: number
}

export type JsonSchema = Record<string, unknown>

interface InputImagePart {
  type: 'input_image'
  image_url: { url: string }
  detail?: 'auto' | 'low' | 'high'
}

interface CallOpenAIJsonStrictOptions<T extends z.ZodTypeAny> extends CallOpenAIJsonOptions<T> {
  jsonSchema: JsonSchema
  attachments?: InputImagePart[]
}

interface ResponsesContentItem {
  type?: string
  text?: string
}

interface ResponsesOutputItem {
  content?: ResponsesContentItem[]
}

interface ResponsesPayload {
  output?: ResponsesOutputItem[]
  output_text?: string
  error?: { message?: string }
}

function extractJsonText(payload: ResponsesPayload): string | null {
  if (payload.output_text && payload.output_text.trim().length > 0) {
    return payload.output_text.trim()
  }
  const outputs = Array.isArray(payload.output) ? payload.output : []
  for (const output of outputs) {
    const content = Array.isArray(output?.content) ? output?.content : []
    const match = content.find((item) => item?.type === 'output_text' && typeof item?.text === 'string')
    if (match?.text) {
      return match.text.trim()
    }
  }
  return null
}

export async function callOpenAIJson<T extends z.ZodTypeAny>(options: CallOpenAIJsonStrictOptions<T>): Promise<z.infer<T>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured for assistant pipeline')
  }

  const model = options.model || DEFAULT_PIPELINE_MODEL
  const temperature = options.temperature ?? 0.2

  const systemContent = [
    {
      type: 'input_text' as const,
      text:
        `${options.systemPrompt}\n` +
        `You must respond with a JSON object that matches the supplied response format.`,
    },
  ]

  const attachments = options.attachments ?? []
  const userContent = [
    ...attachments.map((item) => ({
      type: item.type,
      image_url: item.image_url,
      ...(item.detail ? { detail: item.detail } : {}),
    })),
    { type: 'input_text' as const, text: options.userPrompt },
  ]

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      input: [
        {
          role: 'system',
          content: systemContent,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'assistant_pipeline_response',
          strict: true,
          schema: options.jsonSchema,
          description: options.schemaDescription,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI pipeline request failed (${response.status}): ${errorText}`)
  }

  const completion = (await response.json()) as ResponsesPayload

  if (completion.error?.message) {
    throw new Error(`OpenAI pipeline response error: ${completion.error.message}`)
  }

  const raw = extractJsonText(completion)
  if (!raw) {
    throw new Error('OpenAI pipeline response missing content')
  }

  try {
    const parsedJson = JSON.parse(raw)
    return options.schema.parse(parsedJson)
  } catch (error) {
    throw new Error(`Failed to parse OpenAI pipeline response: ${error instanceof Error ? error.message : String(error)}`)
  }
}
