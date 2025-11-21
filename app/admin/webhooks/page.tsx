import { createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'

export const revalidate = 0

export default async function WebhooksPage() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('stripe_events')
    .select('id, event_id, type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="p-4 md:p-8 space-y-4">
      <Card className="border-border/70 bg-card/70">
        <CardHeader>
          <CardTitle>Stripe webhook log</CardTitle>
          {error ? <p className="text-sm text-destructive">{error.message || 'Unable to load events'}</p> : null}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border/60">
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Age</th>
                <th className="py-2 pr-4">Event ID</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((row) => (
                <tr key={row.id} className="border-b border-border/40">
                  <td className="py-2 pr-4 text-foreground">{row.type}</td>
                  <td className="py-2 pr-4">
                    <span className={row.status === 'ok' ? 'text-emerald-400' : 'text-amber-400'}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">
                    {row.created_at ? formatDistanceToNow(new Date(row.created_at), { addSuffix: true }) : '—'}
                  </td>
                  <td className="py-2 pr-4 text-muted-foreground">{row.event_id}</td>
                </tr>
              ))}
              {!error && (!data || data.length === 0) ? (
                <tr>
                  <td className="py-4 text-muted-foreground" colSpan={4}>No webhook events recorded yet. Run a checkout to populate this log.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </main>
  )
}
