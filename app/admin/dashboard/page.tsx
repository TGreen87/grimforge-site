import { createServiceClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'

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

async function fetchOrderSummary(): Promise<{ totalRevenue: number; paidOrders: number; pendingOrders: number; latestOrders: OrderRecord[] }> {
  const supabase = createServiceClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_status, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  const allOrders = orders ?? []

  const totalRevenue = allOrders
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total ?? 0), 0)

  const paidOrders = allOrders.filter((order) => order.payment_status === 'paid').length
  const pendingOrders = allOrders.filter((order) => order.payment_status !== 'paid').length

  return {
    totalRevenue,
    paidOrders,
    pendingOrders,
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

interface StripePayoutSummary {
  available: number
  pending: number
  currency: string
  nextPayout?: Date | null
  error?: string | null
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

export default async function AdminDashboardPage() {
  const [summary, lowStock, stripePayout] = await Promise.all([
    fetchOrderSummary(),
    fetchLowStock(),
    fetchStripePayoutSummary(),
  ])

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="blackletter text-4xl text-bone">Dashboard</h1>
          <p className="text-muted-foreground">Quick snapshot of store performance and actions that matter most today.</p>
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.totalRevenue > 0 ? `$${summary.totalRevenue.toFixed(2)} AUD` : '—'}</p>
            <p className="text-xs text-muted-foreground">Based on paid orders (latest 20)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.paidOrders}</p>
            <p className="text-xs text-muted-foreground">Marked as paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Awaiting action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{summary.pendingOrders}</p>
            <p className="text-xs text-muted-foreground">Orders not yet paid</p>
          </CardContent>
        </Card>
      <Card>
        <CardHeader>
          <CardTitle>Low stock alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{lowStock.length}</p>
          <p className="text-xs text-muted-foreground">Variants with ≤ 5 units available</p>
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
                  Manage payouts in Stripe → <a className="underline" href="https://dashboard.stripe.com/payouts" target="_blank" rel="noreferrer">dashboard</a>
                </div>
              </div>
            )}
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
                      <span className="text-muted-foreground">{order.total ? `$${Number(order.total).toFixed(2)}` : '—'}</span>
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
            <CardTitle>Low stock products</CardTitle>
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
                    <div className="text-xs text-muted-foreground mt-1">
                      Available: {item.available ?? 0} / On hand: {item.on_hand ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      <Link className="underline" href={`/admin/variants/edit/${item.variant_id}`}>Update stock</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Next steps for today</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li>• Confirm pending Stripe payouts and update order statuses once payments clear.</li>
            <li>• Capture product imagery and copy for any new releases you plan to add.</li>
            <li>• Use the Orders page to print packing slips once stock arrives.</li>
            <li>• Share a social post announcing fresh stock after you publish products.</li>
          </ul>
        </CardContent>
      </Card>
    </section>
  )
}
