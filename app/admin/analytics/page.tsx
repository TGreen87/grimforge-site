import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import AnalyticsDashboard from './AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const supabase = createClient()

  const [{ data: events, error: eventsError }, { data: daily, error: dailyError }] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(150),
    supabase
      .from('analytics_events_7d')
      .select('*')
      .order('event_day', { ascending: false }),
  ])

  if (eventsError) {
    throw new Error(`Failed to load events: ${eventsError.message}`)
  }

  if (dailyError) {
    throw new Error(`Failed to load rollups: ${dailyError.message}`)
  }

  return (
    <Suspense fallback={<div className="text-center text-sm text-muted-foreground">Loading analytics…</div>}>
      <AnalyticsDashboard initialEvents={events ?? []} initialDaily={daily ?? []} />
    </Suspense>
  )
}
