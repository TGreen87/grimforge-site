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

export async function callOpenAIJson<T extends z.ZodTypeAny>(options: CallOpenAIJsonOptions<T>): Promise<z.infer<T>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured for assistant pipeline')
  }

  const model = options.model || DEFAULT_PIPELINE_MODEL
  const temperature = options.temperature ?? 0.2

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        {
          role: 'system',
          content:
            `${options.systemPrompt}\n` +
            `Respond with a single valid JSON object that matches this description without additional commentary or code fences.\n` +
            options.schemaDescription,
        },
        { role: 'user', content: options.userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI pipeline request failed (${response.status}): ${errorText}`)
  }

  const completion = (await response.json()) as {
    choices: Array<{ message: { content: string } }>
  }

  const raw = completion.choices[0]?.message?.content
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
