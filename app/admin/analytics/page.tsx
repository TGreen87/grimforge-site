import AnalyticsDashboard from './AnalyticsDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  return <AnalyticsDashboard defaultRange="7d" />
}
