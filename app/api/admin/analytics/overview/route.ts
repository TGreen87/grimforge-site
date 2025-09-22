import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const RANGE_DAYS: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
}

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

interface AnalyticsEvent {
  id: string
  event_type: string
  pathname: string
  search: string | null
  referrer: string | null
  session_id: string | null
  metadata: Record<string, unknown> | null
  user_agent: string | null
  ip_address: string | null
  occurred_at: string
}

export async function GET(request: NextRequest) {
  try {
    const admin = await assertAdmin(request)
    if (!admin.ok) {
      return admin.error
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') ?? '7d'
    const days = RANGE_DAYS[range] ?? RANGE_DAYS['7d']
    const since = dayjs().subtract(days, 'day').toISOString()
    const pathnameFilter = searchParams.get('pathname')

    const supabase = createServiceClient()

    const query = supabase
      .from('analytics_events')
      .select('*')
      .gte('occurred_at', since)
      .order('occurred_at', { ascending: false })
      .limit(200)

    if (pathnameFilter) {
      query.ilike('pathname', pathnameFilter)
    }

    const { data: events, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    const analyticsEvents: AnalyticsEvent[] = Array.isArray(events) ? (events as unknown as AnalyticsEvent[]) : []

    const pageViews = analyticsEvents.filter((event) => event.event_type === 'page_view')
    const uniqueSessions = new Set<string>()
    const pathCounts = new Map<string, number>()
    const referrerCounts = new Map<string, number>()
    let internalEvents = 0

    for (const event of analyticsEvents) {
      if (event.session_id) {
        uniqueSessions.add(event.session_id)
      }
      const path = event.pathname || 'unknown'
      pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1)
      const ref = event.referrer ? event.referrer.replace(/^https?:\/\//, '') : 'Direct'
      referrerCounts.set(ref, (referrerCounts.get(ref) ?? 0) + 1)
      if (path.startsWith('/admin')) {
        internalEvents += 1
      }
    }

    const totalEvents = analyticsEvents.length
    const totalPageViews = pageViews.length

    const topPages = Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const topReferrers = Array.from(referrerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    const summary = {
      range,
      since,
      totalEvents,
      pageViews: totalPageViews,
      uniqueSessions: uniqueSessions.size,
      internalEvents,
      externalEvents: totalEvents - internalEvents,
      topPages: topPages.map(([path, count]) => ({ path, count })),
      topReferrers: topReferrers.map(([referrer, count]) => ({ referrer, count })),
      events: analyticsEvents,
    }

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
      const csv = [headers.join(','), ...rows.map((row) => row.map((col) => `"${String(col ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${range}.csv"`,
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
