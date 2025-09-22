import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'

const payloadSchema = z.object({
  eventType: z.string().min(1).max(64),
  pathname: z.string().min(1),
  search: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  metadata: z.record(z.any()).optional().default({}),
})

function parseIpAddress(value: string | null) {
  if (!value) return null
  return value.split(',')[0]?.trim() || null
}

async function parseRequestBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return request.json()
  }

  const text = await request.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request)
    const parsed = payloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { eventType, pathname, search, referrer, sessionId, metadata } = parsed.data

    const headers = request.headers
    const userAgent = headers.get('user-agent') || null
    const ipAddress = parseIpAddress(headers.get('x-forwarded-for'))

    const supabase = createServiceClient()

    await supabase.from('analytics_events').insert({
      event_type: eventType,
      pathname,
      search: search || null,
      referrer: referrer || null,
      session_id: sessionId || null,
      metadata,
      user_agent: userAgent,
      ip_address: ipAddress,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Analytics ingest failed', error)
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 })
  }
}
