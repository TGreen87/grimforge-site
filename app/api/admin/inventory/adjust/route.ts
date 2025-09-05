import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-logger'

type AdjustItem = {
  variant_id: string
  delta: number // positive to increase, negative to decrease
  reason?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { items?: AdjustItem[] }
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const results: Array<{ variant_id: string; delta: number }> = []

    for (const item of items) {
      const { variant_id, delta, reason } = item
      if (!variant_id || typeof delta !== 'number' || delta === 0) {
        return NextResponse.json({ error: 'Invalid variant_id or delta' }, { status: 400 })
      }

      const { data: current, error: currentError } = await supabase
        .from('inventory')
        .select('on_hand, available')
        .eq('variant_id', variant_id)
        .single()

      if (currentError) {
        return NextResponse.json({ error: currentError.message }, { status: 500 })
      }

      const onHand = current?.on_hand || 0
      const available = current?.available || 0

      const newOnHand = onHand + delta
      const newAvailable = available + delta

      if (newOnHand < 0) {
        return NextResponse.json({ error: 'Adjustment would make on_hand negative' }, { status: 400 })
      }
      if (newAvailable < 0) {
        return NextResponse.json({ error: 'Adjustment would make available negative' }, { status: 400 })
      }

      // Insert stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id,
          quantity: Math.abs(delta),
          type: 'adjustment',
          reason: reason || 'Inventory adjusted via admin panel',
        })

      if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 500 })
      }

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          on_hand: newOnHand,
          available: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_id', variant_id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      await writeAuditLog({
        event_type: 'admin.inventory.adjust',
        resource_type: 'inventory',
        resource_id: variant_id,
        changes: { delta, reason },
      })

      results.push({ variant_id, delta })
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

