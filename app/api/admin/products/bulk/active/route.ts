import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-logger'

type Body = { ids: string[]; active: boolean }

export async function POST(req: NextRequest) {
  try {
    const { ids, active } = (await req.json()) as Body
    if (!Array.isArray(ids) || ids.length === 0 || typeof active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = createServiceClient() as any
    const { error } = await supabase.from('products').update({ active }).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    try {
      await writeAuditLog({ event_type: 'admin.products.bulk_active_update', changes: { ids, active } })
    } catch {}

    return NextResponse.json({ ok: true, updated: ids.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Bulk active update failed' }, { status: 500 })
  }
}

