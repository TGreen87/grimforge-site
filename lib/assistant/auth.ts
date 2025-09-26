import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_FALLBACK_TOKEN = (process.env.ASSISTANT_ADMIN_TOKEN || process.env.ASSISTANT_API_KEY || '').trim()

export type AssertAdminResult =
  | { ok: true; userId: string | null }
  | { ok: false; error: NextResponse }

function isPreviewHost(request: NextRequest) {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const host = forwardedHost || request.headers.get('host') || ''
  const previewEnv = process.env.ASSISTANT_ALLOW_PREVIEW === '1'
  const allowLocalhost =
    process.env.ASSISTANT_ALLOW_LOCALHOST === '1' || process.env.NODE_ENV !== 'production'
  return (
    previewEnv ||
    /netlify\.app$/.test(host) ||
    (allowLocalhost && /^localhost(?::\d+)?$/.test(host))
  )
}

export function extractAssistantToken(headers: Headers) {
  const headerValue = headers.get('x-assistant-api-key') || headers.get('x-api-key')
  if (headerValue) {
    return headerValue.trim()
  }

  const bearer = headers.get('authorization')
  if (bearer?.toLowerCase().startsWith('bearer ')) {
    return bearer.slice(7).trim()
  }

  return null
}

function timingSafeCompare(expected: string, provided: string) {
  const encoder = new TextEncoder()
  const expectedBytes = encoder.encode(expected)
  const providedBytes = encoder.encode(provided)

  if (expectedBytes.length !== providedBytes.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < expectedBytes.length; index += 1) {
    diff |= expectedBytes[index]! ^ providedBytes[index]!
  }

  return diff === 0
}

function tokensMatch(expected: string, provided: string | null) {
  if (!expected || !provided) {
    return false
  }

  return timingSafeCompare(expected, provided)
}

export async function assertAdmin(request: NextRequest): Promise<AssertAdminResult> {
  if (ADMIN_FALLBACK_TOKEN && tokensMatch(ADMIN_FALLBACK_TOKEN, extractAssistantToken(request.headers))) {
    return { ok: true, userId: null }
  }

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isPreviewHost(request)) {
      return { ok: true as const, userId: null }
    }
    if (ADMIN_FALLBACK_TOKEN) {
      return {
        ok: false as const,
        error: NextResponse.json({ error: 'Unauthorized – provide a valid assistant API key' }, { status: 401 }),
      }
    }
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

  if (isPreviewHost(request)) {
    return { ok: true as const, userId: user.id }
  }

  return { ok: false as const, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}
