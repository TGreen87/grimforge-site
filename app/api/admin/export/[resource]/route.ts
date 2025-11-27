import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface CsvRow {
  [key: string]: string | number | boolean | null | undefined
}

const DATE_SUFFIX = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escapeCell = (value: CsvRow[keyof CsvRow]) => {
    if (value === null || value === undefined) return ''
    const str = String(value).replace(/"/g, '""')
    if (/[",\n]/.test(str)) return `"${str}"`
    return str
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCell(row[header])).join(','))
  }
  return lines.join('\n')
}

async function assertAdmin() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('unauthenticated')
  }

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!data) {
    throw new Error('forbidden')
  }

  return session.user.id
}

type OrdersRow = {
  id: string
  order_number: string | null
  status: string | null
  payment_status: string | null
  total: number | null
  shipping: Record<string, unknown> | null
  currency: string | null
  stripe_payment_intent_id: string | null
  stripe_session_id: string | null
  created_at: string
  customer: { email: string | null } | { email: string | null }[] | null
}

async function fetchOrdersCsv() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('orders')
    .select(
      `id, order_number, status, payment_status, total, shipping, currency, stripe_payment_intent_id, stripe_session_id, created_at, customer:customers(email)`
    )
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as OrdersRow[]

  return rows.map((order) => {
    const customerEmail = Array.isArray(order.customer)
      ? order.customer[0]?.email
      : order.customer?.email

    return {
      order_id: order.order_number || order.id,
      email: customerEmail ?? 'Guest',
      status: order.status,
      payment_status: order.payment_status,
      total: Number(order.total ?? 0).toFixed(2),
      currency: order.currency ?? 'AUD',
      shipping_country: (order.shipping as any)?.country ?? '',
      stripe_payment_intent_id: order.stripe_payment_intent_id ?? '',
      stripe_session_id: order.stripe_session_id ?? '',
      created_at: order.created_at,
    }
  })
}

type CustomerOrderSummary = {
  total: number | null
  payment_status: string | null
}

type CustomerRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  marketing_opt_in: boolean | null
  created_at: string
  orders: CustomerOrderSummary[] | null
}

async function fetchCustomersCsv() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('customers')
    .select('id, email, first_name, last_name, phone, marketing_opt_in, created_at, orders(total, payment_status)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as CustomerRow[]

  return rows.map((customer) => {
    const orders = Array.isArray(customer.orders) ? customer.orders : []
    const paidTotal = orders
      .filter((order) => order.payment_status === 'paid')
      .reduce((sum, order) => sum + Number(order.total ?? 0), 0)

    return {
      customer_id: customer.id,
      email: customer.email,
      first_name: customer.first_name ?? '',
      last_name: customer.last_name ?? '',
      phone: customer.phone ?? '',
      marketing_opt_in: customer.marketing_opt_in ? 'yes' : 'no',
      order_count: orders.length,
      paid_total_aud: paidTotal.toFixed(2),
      created_at: customer.created_at,
    }
  })
}

type InventoryVariant = {
  name?: string | null
  products?: { title?: string | null } | { title?: string | null }[] | null
}

type InventoryRow = {
  variant_id: string
  on_hand: number | null
  allocated: number | null
  available: number | null
  reorder_point: number | null
  reorder_quantity: number | null
  updated_at: string | null
  variants: InventoryVariant | InventoryVariant[] | null
}

async function fetchInventoryCsv() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('inventory')
    .select(`
      variant_id,
      on_hand,
      allocated,
      available,
      reorder_point,
      reorder_quantity,
      updated_at,
      variants:variant_id (
        name,
        products:product_id (
          title
        )
      )
    `)

  if (error) throw new Error(error.message)

  const rows = (data ?? []) as InventoryRow[]

  return rows.map((row) => {
    const variantEntity = Array.isArray(row.variants) ? row.variants[0] : row.variants
    const productEntity = Array.isArray(variantEntity?.products)
      ? variantEntity?.products?.[0]
      : variantEntity?.products

    return {
      product: productEntity?.title ?? '',
      variant: variantEntity?.name ?? row.variant_id,
      variant_id: row.variant_id,
      on_hand: row.on_hand ?? 0,
      allocated: row.allocated ?? 0,
      available: row.available ?? 0,
      reorder_point: row.reorder_point ?? '',
      reorder_quantity: row.reorder_quantity ?? '',
      updated_at: row.updated_at ?? '',
    }
  })
}

export async function GET(request: NextRequest, { params }: { params: { resource: string } }) {
  try {
    await assertAdmin()
  } catch (error) {
    const message = (error as Error).message
    const status = message === 'unauthenticated' ? 401 : 403
    return NextResponse.json({ error: 'not_authorized' }, { status })
  }

  const resource = params.resource
  const search = request.nextUrl.searchParams

  let rows: CsvRow[] = []
  let filename = `export-${DATE_SUFFIX()}.csv`

  try {
    switch (resource) {
      case 'orders': {
        const scope = search.get('scope')
        rows = await fetchOrdersCsv()
        if (scope === 'awaiting-fulfilment') {
          rows = rows.filter((row) => {
            const paymentStatus = String(row.payment_status ?? '').toLowerCase()
            const status = String(row.status ?? '').toLowerCase()
            if (paymentStatus !== 'paid') return false
            return !['shipped', 'delivered', 'cancelled', 'refunded'].includes(status)
          })
        } else if (scope === 'pending-payment') {
          rows = rows.filter((row) => String(row.payment_status ?? '').toLowerCase() !== 'paid')
        }
        filename = `orders-${DATE_SUFFIX()}.csv`
        break
      }
      case 'customers':
        rows = await fetchCustomersCsv()
        filename = `customers-${DATE_SUFFIX()}.csv`
        break
      case 'inventory': {
        rows = await fetchInventoryCsv()
        const scope = search.get('scope')
        if (scope === 'low-stock') {
          const thresholdRaw = Number(search.get('threshold') ?? '5')
          const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : 5
          rows = rows.filter((row) => Number(row.available ?? 0) <= threshold)
        }
        filename = `inventory-${DATE_SUFFIX()}.csv`
        break
      }
      default:
        return NextResponse.json({ error: 'unsupported_resource' }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'export_failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const csv = toCsv(rows)
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
