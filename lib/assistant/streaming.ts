// =============================================================================
// Streaming Responses Client
// =============================================================================
// Client-side utilities for handling SSE streaming from the Copilot API
// Based on OpenAI Responses Starter App pattern
// =============================================================================

export interface StreamMessage {
  role: 'user' | 'assistant'
  content: string
  image?: string // Base64 for model vision
  imageUrl?: string // Public URL for product creation
}

export interface ToolCallItem {
  type: 'tool_call'
  toolType: 'web_search_call' | 'function_call'
  status: 'in_progress' | 'completed' | 'failed'
  id: string
  name?: string
  arguments?: string
  parsedArguments?: Record<string, any>
  output?: string
}

export interface MessageItem {
  type: 'message'
  role: 'user' | 'assistant'
  content: string
  id?: string
}

export type ConversationItem = MessageItem | ToolCallItem

export interface StreamCallbacks {
  onSessionInfo?: (data: { sessionId: string; agent: string; model: string }) => void
  onTextDelta?: (delta: string, itemId: string) => void
  onTextDone?: (text: string, itemId: string) => void
  onFunctionCall?: (call: { id: string; name: string; arguments: string }) => void
  onFunctionArgumentsDelta?: (delta: string, itemId: string) => void
  onFunctionArgumentsDone?: (args: string, itemId: string) => void
  onWebSearchStart?: (id: string) => void
  onWebSearchDone?: (id: string) => void
  onResponseDone?: (response: any) => void
  onError?: (error: string) => void
}

export async function streamCopilotResponse(
  messages: StreamMessage[],
  options: {
    sessionId?: string
    previousResponseId?: string
    forceAgent?: string
  },
  callbacks: StreamCallbacks
): Promise<{ responseId?: string }> {
  const response = await fetch('/api/admin/assistant/stream', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.map(({ role, content, image, imageUrl }) => ({ role, content, image, imageUrl })),
      sessionId: options.sessionId,
      previousResponseId: options.previousResponseId,
      forceAgent: options.forceAgent,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    let error = 'Request failed'
    try {
      const json = JSON.parse(text)
      error = json.error || error
    } catch {}
    callbacks.onError?.(error)
    throw new Error(error)
  }

  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let responseId: string | undefined

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value)
    const lines = buffer.split('\n\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const dataStr = line.slice(6)
      if (dataStr === '[DONE]') break

      try {
        const { event, data } = JSON.parse(dataStr)

        switch (event) {
          case 'session.info':
            callbacks.onSessionInfo?.(data)
            break

          case 'response.output_text.delta': {
            const { delta, item_id } = data
            if (typeof delta === 'string') {
              callbacks.onTextDelta?.(delta, item_id)
            }
            break
          }

          case 'response.output_text.done': {
            const { text, item_id } = data
            callbacks.onTextDone?.(text, item_id)
            break
          }

          case 'response.output_item.added': {
            const { item } = data
            if (!item) break

            switch (item.type) {
              case 'function_call':
                callbacks.onFunctionCall?.({
                  id: item.id,
                  name: item.name,
                  arguments: item.arguments || '',
                })
                break
              case 'web_search_call':
                callbacks.onWebSearchStart?.(item.id)
                break
            }
            break
          }

          case 'response.function_call_arguments.delta': {
            const { delta, item_id } = data
            callbacks.onFunctionArgumentsDelta?.(delta, item_id)
            break
          }

          case 'response.function_call_arguments.done': {
            const { arguments: args, item_id } = data
            callbacks.onFunctionArgumentsDone?.(args, item_id)
            break
          }

          case 'response.web_search_call.completed': {
            const { item_id } = data
            callbacks.onWebSearchDone?.(item_id)
            break
          }

          case 'response.completed': {
            const { response: resp } = data
            responseId = resp?.id
            callbacks.onResponseDone?.(resp)
            break
          }

          case 'error': {
            callbacks.onError?.(data.error || 'Unknown streaming error')
            break
          }
        }
      } catch (parseError) {
        console.error('Failed to parse SSE event:', parseError, dataStr)
      }
    }
  }

  // Handle remaining buffer
  if (buffer.startsWith('data: ')) {
    const dataStr = buffer.slice(6)
    if (dataStr !== '[DONE]') {
      try {
        const { event, data } = JSON.parse(dataStr)
        if (event === 'response.completed') {
          responseId = data.response?.id
          callbacks.onResponseDone?.(data.response)
        }
      } catch {}
    }
  }

  return { responseId }
}

// Execute a function call and return the result
export async function executeFunction(
  name: string,
  args: Record<string, any>,
  sessionId?: string
): Promise<any> {
  const response = await fetch('/api/admin/assistant/functions', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      arguments: args,
      sessionId,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    let error = 'Function execution failed'
    try {
      const json = JSON.parse(text)
      error = json.error || error
    } catch {}
    throw new Error(error)
  }

  return response.json()
}
