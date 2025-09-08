import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-logger'

type Body = {
  ids: string[]
  mode: 'absolute' | 'percent' | 'delta'
  value: number
}

export async function POST(req: NextRequest) {
  try {
    const { ids, mode, value } = (await req.json()) as Body
    if (!Array.isArray(ids) || ids.length === 0 || !mode || typeof value !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createServiceClient() as any

    // Fetch current prices
    const { data: rows, error: selErr } = await supabase
      .from('products')
      .select('id, price')
      .in('id', ids)
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 })

    // Compute updates
    const updates = (rows || []).map((r: any) => {
      let newPrice = Number(r.price || 0)
      if (mode === 'absolute') newPrice = value
      else if (mode === 'percent') newPrice = Math.max(0, Number((r.price || 0) * (1 + value / 100)).valueOf())
      else if (mode === 'delta') newPrice = Math.max(0, Number((r.price || 0) + value).valueOf())
      return { id: r.id, price: Number(newPrice.toFixed(2)) }
    })

    // Apply updates one by one (safe, small batches)
    for (const u of updates) {
      const { error } = await supabase.from('products').update({ price: u.price }).eq('id', u.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Audit log (best effort)
    try {
      await writeAuditLog({
        event_type: 'admin.products.bulk_price_update',
        changes: { ids, mode, value },
      })
    } catch {}

    return NextResponse.json({ ok: true, updated: updates.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bulk price update failed' }, { status: 500 })
  }
}

