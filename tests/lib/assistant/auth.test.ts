import { describe, expect, it, vi, afterEach } from 'vitest'

function mockModule(createClientImpl: () => any) {
  vi.doMock('@/lib/supabase/server', () => ({
    createClient: createClientImpl,
  }))
}

afterEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  delete process.env.ASSISTANT_ADMIN_TOKEN
  delete process.env.ASSISTANT_API_KEY
  delete process.env.ASSISTANT_ALLOW_PREVIEW
  delete process.env.ASSISTANT_ALLOW_LOCALHOST
  delete process.env.ASSISTANT_PREVIEW_HOSTS
})

describe('extractAssistantToken', () => {
  it('prefers explicit assistant header', async () => {
    mockModule(() => {
      throw new Error('createClient should not be called')
    })
    const { extractAssistantToken } = await import('@/lib/assistant/auth')
    const headers = new Headers({ 'x-assistant-api-key': 'secret ', authorization: 'Bearer nope' })
    expect(extractAssistantToken(headers)).toBe('secret')
  })

  it('falls back to bearer token', async () => {
    mockModule(() => {
      throw new Error('createClient should not be called')
    })
    const { extractAssistantToken } = await import('@/lib/assistant/auth')
    const headers = new Headers({ authorization: 'Bearer  second-secret  ' })
    expect(extractAssistantToken(headers)).toBe('second-secret')
  })
})

describe('assertAdmin', () => {
  it('authorises when assistant token matches header', async () => {
    process.env.ASSISTANT_ADMIN_TOKEN = 'token'
    mockModule(() => {
      throw new Error('Supabase should not be queried when token is provided')
    })
    const { assertAdmin } = await import('@/lib/assistant/auth')
    const request = { headers: new Headers({ 'x-assistant-api-key': 'token' }) } as any
    const result = await assertAdmin(request)
    expect(result.ok).toBe(true)
    expect(result.userId).toBeNull()
  })

  it('bypasses auth on Netlify preview host when user missing', async () => {
    mockModule(() => ({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    }))
    const { assertAdmin } = await import('@/lib/assistant/auth')
    const request = { headers: new Headers({ host: 'dev--obsidianriterecords.netlify.app' }) } as any
    const result = await assertAdmin(request)
    expect(result.ok).toBe(true)
  })
})
