import dayjs from 'dayjs'
import { createServiceClient } from '@/lib/supabase/server'

export type AnalyticsRange = '24h' | '7d' | '30d'

export interface AnalyticsEvent {
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

export interface AnalyticsSummary {
  range: AnalyticsRange
  since: string
  totalEvents: number
  pageViews: number
  uniqueSessions: number
  internalEvents: number
  externalEvents: number
  topPages: Array<{ path: string; count: number }>
  topReferrers: Array<{ referrer: string; count: number }>
  events: AnalyticsEvent[]
}

const RANGE_DAYS: Record<AnalyticsRange, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
}

function normaliseRange(range?: string | null): AnalyticsRange {
  if (range === '24h' || range === '7d' || range === '30d') {
    return range
  }
  return '7d'
}

export async function getAnalyticsSummary(options: { range?: string | null; pathname?: string | null }) {
  const range = normaliseRange(options.range)
  const pathname = options.pathname?.trim() || null
  const days = RANGE_DAYS[range]
  const since = dayjs().subtract(days, 'day').toISOString()

  const supabase = createServiceClient()
  const query = supabase
    .from('analytics_events')
    .select('*')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(200)

  if (pathname) {
    query.ilike('pathname', pathname)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  const analyticsEvents: AnalyticsEvent[] = Array.isArray(data) ? (data as AnalyticsEvent[]) : []

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

  const summary: AnalyticsSummary = {
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

  return summary
}

export function formatAnalyticsSummary(summary: AnalyticsSummary) {
  const rangeLabel = summary.range === '24h' ? '24 hours' : summary.range === '30d' ? '30 days' : '7 days'
  const topPage = summary.topPages[0]
  const topReferrer = summary.topReferrers[0]

  const parts: string[] = []
  parts.push(`In the last ${rangeLabel} we logged ${summary.pageViews} page views across ${summary.uniqueSessions} sessions.`)
  parts.push(`Internal admin traffic accounted for ${summary.internalEvents} events.`)

  if (topPage) {
    parts.push(`Top page: ${topPage.path} (${topPage.count} views).`)
  }
  if (topReferrer) {
    parts.push(`Top referrer: ${topReferrer.referrer} (${topReferrer.count}).`)
  }

  return parts.join(' ')
}
