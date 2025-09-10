import { NextRequest, NextResponse } from 'next/server'
import { writeAuditLog } from '@/lib/audit-logger'

// Simple in-memory rate limiting and dedupe (best-effort in serverless)
const WINDOW_MS = 60_000
const LIMIT_PER_IP = 20
const DEDUPE_TTL_MS = 5 * 60_000
const ipHits = new Map<string, { count: number; resetAt: number }>()
const recent = new Map<string, number>() // key -> expiresAt

function rateLimited(ip: string) {
  const now = Date.now()
  const rec = ipHits.get(ip)
  if (!rec || rec.resetAt <= now) {
    ipHits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  rec.count += 1
  return rec.count > LIMIT_PER_IP
}

function dedupe(key: string) {
  const now = Date.now()
  // Clean out old
  for (const [k, exp] of recent.entries()) {
    if (exp <= now) recent.delete(k)
  }
  if (recent.has(key)) return true
  recent.set(key, now + DEDUPE_TTL_MS)
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '')
    if (rateLimited(ip)) {
      // Acknowledge without storing to avoid client retry storms
      return NextResponse.json({ ok: true, limited: true })
    }

    const { message, stack, context = {}, level = 'error', url, cid } = await req.json()

    // correlation id precedence: header > body > cookie
    const headerCid = req.headers.get('x-correlation-id') || undefined
    const cookieCid = (req.cookies as any)?.get?.('orr_cid')?.value
    const correlationId = headerCid || cid || cookieCid

    // Truncate overly large message/stack and breadcrumbs
    const safeMessage = typeof message === 'string' ? message.slice(0, 2000) : String(message).slice(0, 2000)
    const safeStack = typeof stack === 'string' ? stack.slice(0, 8000) : undefined
    const breadcrumbs = Array.isArray((context as any).breadcrumbs)
      ? ((context as any).breadcrumbs as any[]).slice(-30)
      : undefined
    const safeContext = {
      ...(context as Record<string, unknown>),
      ...(breadcrumbs ? { breadcrumbs } : {}),
    }

    const fingerprint = `${correlationId || ''}|${level}|${url}|${safeMessage}|${(safeStack || '').slice(0, 200)}`
    if (dedupe(fingerprint)) {
      return NextResponse.json({ ok: true, deduped: true })
    }

    await writeAuditLog({
      event_type: level === 'error' ? 'client.error' : level === 'warn' ? 'client.warn' : 'client.log',
      metadata: {
        message: safeMessage,
        stack: safeStack,
        context: safeContext,
        page_url: url,
        referer: req.headers.get('referer') || undefined,
        correlation_id: correlationId,
      },
      user_agent: req.headers.get('user-agent') || undefined,
      ip_address: ip as any,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    // Always 200 to avoid client retries
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
