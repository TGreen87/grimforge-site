import { NextRequest, NextResponse } from 'next/server'
import { writeAuditLog } from '@/lib/audit-logger'

export async function POST(req: NextRequest) {
  try {
    const { message, stack, context, level = 'error', url } = await req.json()

    await writeAuditLog({
      event_type: level === 'error' ? 'client.error' : 'client.log',
      metadata: {
        message,
        stack,
        context,
        page_url: url,
        referer: req.headers.get('referer') || undefined,
      },
      user_agent: req.headers.get('user-agent') || undefined,
      ip_address: (req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || '') as any,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}

