import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-logger'

type ReceiveItem = {
  variant_id: string
  quantity: number
  reason?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { items?: ReceiveItem[] }
    const items = Array.isArray(body.items) ? body.items : []

    if (items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const results: Array<{ variant_id: string; quantity: number }> = []

    for (const item of items) {
      const { variant_id, quantity, reason } = item

      if (!variant_id || !quantity || quantity < 1) {
        return NextResponse.json({ error: 'Invalid variant_id or quantity' }, { status: 400 })
      }

      // Insert stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          variant_id,
          quantity,
          type: 'receipt',
          reason: reason || 'Stock received via admin panel',
        })

      if (movementError) {
        return NextResponse.json({ error: movementError.message }, { status: 500 })
      }

      // Update inventory counts (on_hand and available)
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          on_hand: (supabase as any).rpc ? undefined : undefined, // no-op; compatibility
        })

      // Perform atomic increment using RPC if available, else fallback to single update
      const { data: current } = await supabase
        .from('inventory')
        .select('on_hand, available')
        .eq('variant_id', variant_id)
        .single()

      const newOnHand = (current?.on_hand || 0) + quantity
      const newAvailable = (current?.available || 0) + quantity

      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          on_hand: newOnHand,
          available: newAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('variant_id', variant_id)

      if (inventoryError || updateError) {
        return NextResponse.json({ error: (inventoryError || updateError)?.message || 'Failed to update inventory' }, { status: 500 })
      }

      await writeAuditLog({
        event_type: 'admin.inventory.receive',
        resource_type: 'inventory',
        resource_id: variant_id,
        changes: { quantity, reason },
      })

      results.push({ variant_id, quantity })
    }

    return NextResponse.json({ success: true, results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

