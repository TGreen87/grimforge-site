import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const orderId = params.id
  if (!orderId) {
    return NextResponse.json({ error: 'Missing order id' }, { status: 400 })
  }

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!role) {
    return NextResponse.json({ error: 'not_authorized' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data: order, error } = await service
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      payment_status,
      total,
      shipping_address,
      billing_address,
      created_at,
      customer:customers(email, first_name, last_name, phone),
      order_items(
        quantity,
        total,
        price,
        variant:variants(name, sku, product:products(title))
      )
    `)
    .eq('id', orderId)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: error?.message ?? 'Order not found' }, { status: 404 })
  }

  const customerRecord = Array.isArray(order.customer) ? order.customer[0] : order.customer
  const shipping = order.shipping_address as Record<string, string> | null
  const billing = order.billing_address as Record<string, string> | null

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8" />
  <title>Packing Slip ${order.order_number ?? order.id}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .section { margin-bottom: 16px; }
    .address { white-space: pre-wrap; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #ccc; padding: 8px; font-size: 13px; text-align: left; }
    th { background: #f3f4f6; }
  </style>
</head>
<body>
  <h1>Packing Slip</h1>
  <div class="section">
    <strong>Order:</strong> ${order.order_number ?? order.id}<br />
    <strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}<br />
    <strong>Status:</strong> ${order.status} / ${order.payment_status}
  </div>
  <div class="section">
    <strong>Customer:</strong><br />
    ${[customerRecord?.first_name, customerRecord?.last_name].filter(Boolean).join(' ') || '—'}<br />
    ${customerRecord?.email ?? '—'}<br />
    ${customerRecord?.phone ?? ''}
  </div>
  <div class="section">
    <strong>Ship to:</strong><br />
    <div class="address">${shipping ? formatAddress(shipping) : '—'}</div>
  </div>
  <div class="section">
    <strong>Bill to:</strong><br />
    <div class="address">${billing ? formatAddress(billing) : '—'}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th>Product</th>
        <th>Variant</th>
        <th>SKU</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items
        ?.map((item) => {
          const variant = item.variant as any
          return `<tr>
            <td>${variant?.product?.title ?? '—'}</td>
            <td>${variant?.name ?? '—'}</td>
            <td>${variant?.sku ?? '—'}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price ?? 0)}</td>
            <td>${formatCurrency(item.total ?? 0)}</td>
          </tr>`
        })
        .join('') ?? ''}
    </tbody>
  </table>
  <div class="section" style="margin-top: 16px;">
    <strong>Order Total:</strong> ${formatCurrency(order.total ?? 0)}
  </div>
</body>
</html>`

  const format = req.nextUrl.searchParams.get('format')
  if (format === 'html') {
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  try {
    const pdfBuffer = await renderPackingSlipPdf({
      order,
      shipping,
      billing,
      customer: customerRecord,
    })

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="packing-slip-${order.order_number ?? order.id}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Packing slip PDF generation failed', error)
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }
}

function formatAddress(address: Record<string, string>): string {
  const parts = [
    address.line1,
    address.line2,
    [address.city, address.state, address.postal_code].filter(Boolean).join(' '),
    address.country,
  ].filter(Boolean)
  return parts.join('\n')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(value)
}

async function renderPackingSlipPdf({
  order,
  shipping,
  billing,
  customer,
}: {
  order: any
  shipping: Record<string, string> | null
  billing: Record<string, string> | null
  customer: { first_name?: string | null; last_name?: string | null; email?: string | null; phone?: string | null } | undefined
}) {
  return await new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 })
    const buffers: Buffer[] = []
    doc.on('data', (chunk) => buffers.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    doc.fontSize(18).text('Obsidian Rite Records', { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`Packing Slip`, { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(10).text(`Order: ${order.order_number ?? order.id}`)
    doc.text(`Date: ${new Date(order.created_at).toLocaleString()}`)
    doc.text(`Status: ${order.status} / ${order.payment_status}`)
    doc.moveDown()

    const customerName = [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || '—'
    doc.fontSize(11).text('Customer', { underline: true })
    doc.fontSize(10).text(customerName)
    doc.text(customer?.email ?? '—')
    if (customer?.phone) doc.text(customer.phone)
    doc.moveDown()

    doc.fontSize(11).text('Ship to', { underline: true })
    doc.fontSize(10).text(shipping ? formatAddress(shipping) : '—')
    doc.moveDown()

    doc.fontSize(11).text('Bill to', { underline: true })
    doc.fontSize(10).text(billing ? formatAddress(billing) : '—')
    doc.moveDown()

    doc.fontSize(11).text('Items', { underline: true })
    doc.moveDown(0.5)
    const colWidths = [180, 120, 80, 40, 60, 60]
    const headers = ['Product', 'Variant', 'SKU', 'Qty', 'Unit', 'Total']

    doc.fontSize(10).font('Helvetica-Bold')
    headers.forEach((header, index) => {
      doc.text(header, doc.x + (index === 0 ? 0 : colWidths.slice(0, index).reduce((a, b) => a + b, 0)), doc.y, {
        width: colWidths[index],
        continued: index !== headers.length - 1,
      })
    })
    doc.font('Helvetica')
    doc.moveDown(0.5)

    const itemRows = order.order_items ?? []
    itemRows.forEach((item: any) => {
      const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
      const rowData = [
        variant?.product?.title ?? '—',
        variant?.name ?? '—',
        variant?.sku ?? '—',
        String(item.quantity ?? 0),
        formatCurrency(item.price ?? 0),
        formatCurrency(item.total ?? 0),
      ]

      rowData.forEach((val, index) => {
        doc.text(val, doc.x + (index === 0 ? 0 : colWidths.slice(0, index).reduce((a, b) => a + b, 0)), doc.y, {
          width: colWidths[index],
          continued: index !== rowData.length - 1,
        })
      })
      doc.moveDown(0.5)
    })

    doc.moveDown(0.5)
    doc.font('Helvetica-Bold').text(`Order Total: ${formatCurrency(order.total ?? 0)}`)

    doc.end()
  })
}
