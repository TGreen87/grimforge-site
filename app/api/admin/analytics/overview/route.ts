import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAnalyticsSummary } from '@/lib/analytics/overview'

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

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdmin(request)
    if (!admin.ok) {
      return admin.error
    }

    const { searchParams } = new URL(request.url)
    const summary = await getAnalyticsSummary({
      range: searchParams.get('range'),
      pathname: searchParams.get('pathname'),
    })
    const analyticsEvents = summary.events

    if (searchParams.get('download') === 'csv') {
      const headers = [
        'occurred_at',
        'event_type',
        'pathname',
        'search',
        'referrer',
        'session_id',
        'internal',
      ]
      const rows = analyticsEvents.map((event) => [
        event.occurred_at,
        event.event_type,
        event.pathname,
        event.search ?? '',
        event.referrer ?? 'Direct',
        event.session_id ?? '',
        event.pathname?.startsWith('/admin') ? 'yes' : 'no',
      ])
      const csv = [
        headers.join(','),
        ...rows.map((row) => row.map((col) => `"${String(col ?? '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${summary.range}.csv"`,
        },
      })
    }

    return NextResponse.json({ ok: true, summary })
  } catch (error) {
    console.error('Analytics overview failed', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
