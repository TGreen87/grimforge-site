import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = new Set(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null)
  const ids: string[] = Array.isArray(payload?.ids)
    ? (payload.ids as unknown[]).filter((id): id is string => typeof id === 'string')
    : []
  const nextStatus: string | undefined = typeof payload?.status === 'string' ? payload.status : undefined
  const reason: string | undefined = typeof payload?.reason === 'string' ? payload.reason.trim() : undefined

  if (ids.length === 0 || !nextStatus || !ALLOWED_STATUSES.has(nextStatus)) {
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 })
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

  const { data: ordersBefore, error: selectError } = await service
    .from('orders')
    .select('id, status')
    .in('id', ids)

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 })
  }

  if (!ordersBefore || ordersBefore.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }

  if (nextStatus === 'refunded') {
    updatePayload.payment_status = 'refunded'
  }

  const { error: updateError } = await service
    .from('orders')
    .update(updatePayload)
    .in('id', ids)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const logRows = ordersBefore.map((order) => ({
    event_type: 'order.status_changed',
    resource_type: 'order',
    resource_id: order.id,
    user_id: session.user.id,
    changes: {
      from: order.status,
      to: nextStatus,
    },
    metadata: {
      via: 'bulk_status_update',
      status: nextStatus,
      reason: reason || null,
      ids,
    },
  }))

  const { error: logError } = await service.from('audit_logs').insert(logRows)

  if (logError) {
    console.error('Failed to insert audit logs for bulk status update', logError)
  }

  return NextResponse.json({ updated: ordersBefore.length })
}
