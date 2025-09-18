import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

const MANAGED_KEYS = new Set(['dashboard_alerts', 'slack_webhooks'])

async function getSession() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return { session, supabase }
}

async function requireAdmin() {
  const { session, supabase } = await getSession()
  if (!session) {
    return { error: NextResponse.json({ error: 'not_authenticated' }, { status: 401 }) }
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .maybeSingle()

  if (!role) {
    return { error: NextResponse.json({ error: 'not_authorized' }, { status: 403 }) }
  }

  return { session }
}

export async function GET() {
  const { session, error } = await requireAdmin()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data, error: fetchError } = await service
    .from('admin_settings')
    .select('key, value')
    .in('key', Array.from(MANAGED_KEYS))

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const map: Record<string, unknown> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }

  return NextResponse.json({ settings: map })
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const payload = await req.json().catch(() => ({} as Record<string, unknown>))

  const updates: Array<{ key: string; value: unknown }> = []

  for (const key of Object.keys(payload)) {
    if (!MANAGED_KEYS.has(key)) continue
    updates.push({ key, value: payload[key] })
  }

  if (updates.length === 0) {
    return NextResponse.json({ updated: 0 })
  }

  const service = createServiceClient()
  const { error: upsertError } = await service.from('admin_settings').upsert(
    updates.map((entry) => ({
      key: entry.key,
      value: entry.value ?? {},
      updated_by: session.user.id,
    }))
  )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ updated: updates.length })
}
