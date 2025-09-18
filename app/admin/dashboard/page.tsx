import { Suspense } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'

import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import RevenueChart from './components/revenue-chart'
import LowStockChart from './components/low-stock-chart'
import NeedsFulfillmentPanel from './components/needs-fulfillment-panel'
import AnnouncementCard from './components/announcement-card'

interface OrderRecord {
  id: string
  order_number: string | null
  total: number | null
  status: string | null
  payment_status: string | null
  created_at: string
}

interface InventoryRecord {
  variant_id: string
  on_hand: number | null
  available: number | null
  variants: {
    id: string
    name: string | null
    price: number | null
    products: {
      id: string
      title: string | null
    } | null
  } | null
}

type RawInventoryRow = {
  variant_id: string
  on_hand: number | null
  available: number | null
  variants: Array<{
    id: string
    name: string | null
    price: number | null
    products: Array<{
      id: string
      title: string | null
    }>
  }> | null
}

interface RevenuePoint {
  day: string
  paid_total: number
  pending_total: number
}

interface LowStockPoint {
  day: string
  low_stock_count: number
}

interface AnnouncementRecord {
  id: string
  message: string
  updated_at: string
}

interface StripePayoutSummary {
  available: number
  pending: number
  currency: string
  nextPayout?: Date | null
  error?: string | null
}

interface AdminSettings {
  dashboard_alerts: {
    awaiting_fulfilment_threshold: number
    low_stock_threshold: number
    enable_dashboard_alerts?: boolean
  }
}

function sumPaid(series: RevenuePoint[]) {
  return series.reduce((sum, point) => sum + Number(point.paid_total ?? 0), 0)
}

function computeRevenueChange(series: RevenuePoint[]) {
  if (series.length === 0) {
    return { current: 0, previous: 0, changePct: null }
  }
  const currentWindow = series.slice(-7)
  const previousWindow = series.slice(-14, -7)

  const current = sumPaid(currentWindow)
  const previous = sumPaid(previousWindow)
  const changePct = previous > 0 ? ((current - previous) / previous) * 100 : null

  return { current, previous, changePct }
}

async function fetchOrderSummary() {
  const supabase = createServiceClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(40)

  const allOrders = orders ?? []

  const totalRevenue = allOrders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0)

  const paidOrders = allOrders.filter((order) => order.payment_status === 'paid').length
  const pendingOrders = allOrders.filter((order) => order.payment_status !== 'paid').length
  const awaitingFulfillment = allOrders.filter((order) => {
    if (order.payment_status !== 'paid') return false
    const status = (order.status ?? '').toLowerCase()
    return !['shipped', 'delivered', 'cancelled', 'refunded'].includes(status)
  }).length

  return {
    totalRevenue,
    paidOrders,
    pendingOrders,
    awaitingFulfillment,
    latestOrders: allOrders,
  }
}

async function fetchLowStock(): Promise<InventoryRecord[]> {
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('inventory')
    .select(`
      variant_id,
      on_hand,
      available,
      variants:variant_id!inner (
        id,
        name,
        price,
        products:product_id!inner (
          id,
          title
        )
      )
    `)
    .lte('available', 5)
    .order('available', { ascending: true })
    .limit(6)

  const rows: RawInventoryRow[] = (data as RawInventoryRow[]) ?? []

  return rows.map((row) => {
    const variant = Array.isArray(row.variants) ? row.variants[0] : null
    const product = variant && Array.isArray(variant.products) ? variant.products[0] : undefined

    return {
      variant_id: row.variant_id,
      on_hand: row.on_hand,
      available: row.available,
      variants: variant
        ? {
            id: variant.id,
            name: variant.name,
            price: variant.price,
            products: product ? { id: product.id, title: product.title } : null,
          }
        : null,
    }
  })
}

async function fetchStripePayoutSummary(): Promise<StripePayoutSummary | null> {
  const secretConfigured = process.env.STRIPE_SECRET_KEY_1 || process.env.STRIPE_SECRET_KEY
  if (!secretConfigured) return null

  try {
    const stripe = getStripe()
    const [balance, payouts] = await Promise.all([
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 1 }),
    ])

    const availableAmount = balance.available.reduce((sum, entry) => sum + (entry.amount || 0), 0)
    const pendingAmount = balance.pending.reduce((sum, entry) => sum + (entry.amount || 0), 0)
    const currency = (balance.available[0]?.currency || balance.pending[0]?.currency || 'aud').toUpperCase()
    const next = payouts.data?.[0]?.arrival_date ? new Date(payouts.data[0].arrival_date * 1000) : null

    return {
      available: availableAmount / 100,
      pending: pendingAmount / 100,
      currency,
      nextPayout: next,
    }
  } catch (error) {
    console.error('Stripe balance lookup failed', error)
    const message = error instanceof Error ? error.message : 'Unable to fetch Stripe payouts'
    return {
      available: 0,
      pending: 0,
      currency: 'AUD',
      nextPayout: null,
      error: message,
    }
  }
}

async function fetchRevenueSeries(days = 30): Promise<RevenuePoint[]> {
  const supabase = createServiceClient()
  const { data } = await supabase.rpc('orders_revenue_series', { days })
  const series = Array.isArray(data) ? data : []
  return series.map((row) => ({
    day: row.day,
    paid_total: Number(row.paid_total ?? 0),
    pending_total: Number(row.pending_total ?? 0),
  }))
}

async function fetchLowStockTrend(days = 14): Promise<LowStockPoint[]> {
  const supabase = createServiceClient()
  const { data } = await supabase.rpc('inventory_low_stock_trend', { days })
  const series = Array.isArray(data) ? data : []
  return series.map((row) => ({
    day: row.day,
    low_stock_count: Number(row.low_stock_count ?? 0),
  }))
}

async function fetchAnnouncement(): Promise<AnnouncementRecord | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('dashboard_announcements')
    .select('id, message, updated_at')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) return null
  return {
    id: data.id,
    message: data.message ?? '',
    updated_at: data.updated_at ?? new Date().toISOString(),
  }
}

async function fetchAdminSettings(): Promise<AdminSettings> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('admin_settings')
    .select('key, value')
    .in('key', ['dashboard_alerts'])

  const defaults = {
    dashboard_alerts: {
      awaiting_fulfilment_threshold: 3,
      low_stock_threshold: 5,
      enable_dashboard_alerts: true,
    },
  }

  if (!data) return defaults

  for (const row of data) {
    if (row.key === 'dashboard_alerts' && row.value) {
      defaults.dashboard_alerts = {
        awaiting_fulfilment_threshold: Number((row.value as any)?.awaiting_fulfilment_threshold ?? 3),
        low_stock_threshold: Number((row.value as any)?.low_stock_threshold ?? 5),
        enable_dashboard_alerts: Boolean((row.value as any)?.enable_dashboard_alerts ?? true),
      }
    }
  }

  return defaults
}

function formatCurrency(amount: number, currency = 'AUD') {
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(amount)
}

const EXPORT_TARGETS: Array<{
  label: string
  href: string
  description: string
}> = [
  {
    label: 'Orders CSV',
    href: '/api/admin/export/orders',
    description: 'All orders with status, totals, Stripe references',
  },
  {
    label: 'Customers CSV',
    href: '/api/admin/export/customers',
    description: 'Emails, total spend, opt-in flags',
  },
  {
    label: 'Inventory CSV',
    href: '/api/admin/export/inventory',
    description: 'Variants with on hand / allocated / available',
  },
]

export default async function AdminDashboardPage() {
  const [summary, lowStock, stripePayout, revenueSeries30, lowStockTrend, announcement, adminSettings] = await Promise.all([
    fetchOrderSummary(),
    fetchLowStock(),
    fetchStripePayoutSummary(),
    fetchRevenueSeries(30),
    fetchLowStockTrend(21),
    fetchAnnouncement(),
    fetchAdminSettings(),
  ])

  const revenueStats = computeRevenueChange(revenueSeries30)
  const revenueSeries7 = revenueSeries30.slice(-7)
  const alertsConfig = adminSettings.dashboard_alerts

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="blackletter text-4xl text-bone">Dashboard</h1>
          <p className="text-muted-foreground">
            See performance trends, fulfilment priorities, and quick actions to keep the label humming.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/admin/products/create">Add product</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/orders">View orders</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/inventory">Receive stock</Link>
          </Button>
        </div>
      </header>

      <AnnouncementCard announcement={announcement} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.totalRevenue > 0 ? formatCurrency(summary.totalRevenue) : '—'}</p>
            <p className="text-xs text-muted-foreground">Lifetime total from paid orders (latest 40)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.paidOrders}</p>
            <p className="text-xs text-muted-foreground">Orders marked paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting fulfilment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-3xl font-semibold', summary.awaitingFulfillment > 0 ? 'text-amber-400' : undefined)}>
              {summary.awaitingFulfillment}
            </p>
            <p className="text-xs text-muted-foreground">Paid orders not yet shipped or delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low stock alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn('text-3xl font-semibold', lowStock.length > 0 ? 'text-rose-400' : undefined)}>{lowStock.length}</p>
            <p className="text-xs text-muted-foreground">Variants with ≤ 5 units available</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle>Revenue trend (30 days)</CardTitle>
              <p className="text-xs text-muted-foreground">
                Last 7 days: {formatCurrency(revenueStats.current)}
                {revenueStats.changePct !== null && (
                  <span className={cn('ml-2 font-medium', revenueStats.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
                    {revenueStats.changePct >= 0 ? '+' : ''}{revenueStats.changePct.toFixed(1)}%
                  </span>
                )}
              </p>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading chart…</div>}>
              <RevenueChart data={revenueSeries30} highlightWindow={revenueSeries7} />
            </Suspense>
          </CardContent>
        </Card>
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Needs fulfilment</CardTitle>
          </CardHeader>
          <CardContent>
            <NeedsFulfillmentPanel
              awaitingFulfillment={summary.awaitingFulfillment}
              lowStockCount={lowStock.length}
              pendingPaymentCount={summary.pendingOrders}
              fulfilmentThreshold={alertsConfig.awaiting_fulfilment_threshold}
              lowStockThreshold={alertsConfig.low_stock_threshold}
              alertsEnabled={alertsConfig.enable_dashboard_alerts !== false}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low stock trend (21 days)</CardTitle>
            <p className="text-xs text-muted-foreground">Count of variants at or below threshold (≤5 available).</p>
          </CardHeader>
          <CardContent className="h-[240px]">
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading chart…</div>}>
              <LowStockChart data={lowStockTrend} />
            </Suspense>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick exports</CardTitle>
            <p className="text-xs text-muted-foreground">Download CSV snapshots for reporting or marketing tools.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {EXPORT_TARGETS.map((target) => (
              <div key={target.href} className="flex items-center justify-between rounded-md border border-border bg-background/40 p-3">
                <div>
                  <div className="text-sm font-medium text-bone">{target.label}</div>
                  <p className="text-xs text-muted-foreground">{target.description}</p>
                </div>
                <Button asChild size="sm" variant="secondary">
                  <Link href={target.href}>Export</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.latestOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Orders will appear here once Stripe checkout completes.</p>
            ) : (
              <ul className="space-y-3">
                {summary.latestOrders.slice(0, 6).map((order) => (
                  <li key={order.id} className="rounded-md border border-border bg-background/40 p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>{order.order_number || order.id.slice(0, 8)}</span>
                      <span className="text-muted-foreground">{order.total ? formatCurrency(Number(order.total)) : '—'}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Status: {order.status ?? 'pending'} / {order.payment_status ?? 'pending'}</span>
                      <span>{format(new Date(order.created_at), 'dd MMM yyyy')}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>Low stock roster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Everything is well stocked right now.</p>
            ) : (
              <ul className="space-y-3">
                {lowStock.map((item) => (
                  <li key={item.variant_id} className="rounded-md border border-border bg-background/40 p-3 text-sm">
                    <div className="font-medium">
                      {item.variants?.products?.title ?? 'Product'} — {item.variants?.name ?? 'Variant'}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Available: {item.available ?? 0} / On hand: {item.on_hand ?? 0}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <Link className="underline" href={`/admin/variants/edit/${item.variant_id}`}>
                        Update stock
                      </Link>
                      <Link className="underline" href={`/admin/inventory?variant=${item.variant_id}`}>
                        Receive stock
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Stripe payouts</CardTitle>
          </CardHeader>
          <CardContent>
            {stripePayout === null ? (
              <p className="text-sm text-muted-foreground">
                Connect your Stripe publishable key and secret key to see payout information.
              </p>
            ) : stripePayout.error ? (
              <p className="text-sm text-destructive">{stripePayout.error}</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-2xl font-semibold">{stripePayout.currency} {stripePayout.available.toFixed(2)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">Pending</span>
                  <span className="text-base">{stripePayout.currency} {stripePayout.pending.toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Next payout: {stripePayout.nextPayout ? format(stripePayout.nextPayout, 'dd MMM yyyy') : 'None scheduled'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Manage payouts in Stripe →{' '}
                  <a className="underline" href="https://dashboard.stripe.com/payouts" target="_blank" rel="noreferrer">
                    dashboard
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operator checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <li>• Confirm paid orders are shipped or scheduled.</li>
              <li>• Capture product imagery and copy for upcoming releases.</li>
              <li>• Export customers for newsletter campaigns.</li>
              <li>• Refill low-stock variants before weekend promos.</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </section>
  )
}
