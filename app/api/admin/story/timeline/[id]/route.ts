import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdminSession() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  if (body.year !== undefined) updates.year = String(body.year ?? '').trim()
  if (body.title !== undefined) updates.title = String(body.title ?? '').trim()
  if (body.description !== undefined) updates.description = typeof body.description === 'string' ? body.description : ''
  if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order ?? 0)

  const service = createServiceClient()
  const { data, error: updateError } = await service
    .from('story_timeline')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAdminSession()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const service = createServiceClient()
  const { error: deleteError } = await service
    .from('story_timeline')
    .delete()
    .eq('id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
