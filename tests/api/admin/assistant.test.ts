import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/assistant/route'

const {
  mockAssertAdmin,
  mockEnsureAssistantSession,
  mockLogAssistantEvent,
  mockSearchAssistantKnowledge,
} = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  mockEnsureAssistantSession: vi.fn(),
  mockLogAssistantEvent: vi.fn(),
  mockSearchAssistantKnowledge: vi.fn(),
}))

vi.mock('@/lib/assistant/auth', () => ({
  assertAdmin: mockAssertAdmin,
}))

vi.mock('@/lib/assistant/sessions', () => ({
  ensureAssistantSession: mockEnsureAssistantSession,
  logAssistantEvent: mockLogAssistantEvent,
}))

vi.mock('@/lib/assistant/knowledge', () => ({
  searchAssistantKnowledge: mockSearchAssistantKnowledge,
}))

describe('Admin assistant API (responses)', () => {
  const originalEnv = { ...process.env }
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch)
    vi.clearAllMocks()
    process.env.OPENAI_API_KEY = 'sk-test-openai'
    mockAssertAdmin.mockResolvedValue({ ok: true, userId: 'admin-123' })
    mockEnsureAssistantSession.mockResolvedValue(undefined)
    mockLogAssistantEvent.mockResolvedValue(undefined)
    mockSearchAssistantKnowledge.mockResolvedValue([])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    process.env = { ...originalEnv }
  })

  it('returns assistant reply when OpenAI responds with structured output', async () => {
    const openAiPayload = {
      output: [
        {
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'output_text',
              text: JSON.stringify({ reply: 'Hello from the copilot', actions: [] }),
            },
          ],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(openAiPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = new NextRequest('http://localhost/api/admin/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say hi' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)

    const payload = await response.json()
    expect(payload.message).toBe('Hello from the copilot')
    expect(payload.actions).toEqual([])
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'message.assistant' }),
    )

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [, init] = mockFetch.mock.calls[0] ?? []
    const body = init?.body ? JSON.parse(init.body as string) : null
    expect(body?.response_format?.json_schema?.strict).toBe(true)
  })

  it('returns error when OpenAI request fails', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Unauthorised' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = new NextRequest('http://localhost/api/admin/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Say hi' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(500)
    const payload = await response.json()
    expect(payload.error).toBe('Unauthorised')
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'error', payload: expect.objectContaining({ scope: 'openai' }) }),
    )
  })

  it('falls back to plain text when schema parsing fails', async () => {
    const openAiPayload = {
      output: [
        {
          type: 'message',
          role: 'assistant',
          content: [
            {
              type: 'output_text',
              text: 'plain text reply',
            },
          ],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(openAiPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const request = new NextRequest('http://localhost/api/admin/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Anything' }],
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.message).toBe('plain text reply')
    expect(payload.actions).toEqual([])
  })
})
