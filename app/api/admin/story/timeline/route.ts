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

export async function GET() {
  const service = createServiceClient()
  const { data, error } = await service
    .from('story_timeline')
    .select('id, year, title, description, sort_order, created_at, updated_at')
    .order('sort_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdminSession()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const year = String(body?.year ?? '').trim()
  const title = String(body?.title ?? '').trim()
  const description = typeof body?.description === 'string' ? body.description : ''
  const sortOrder = Number(body?.sort_order ?? 0)

  if (!year || !title) {
    return NextResponse.json({ error: 'Year and title are required' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error: insertError } = await service
    .from('story_timeline')
    .insert({
      year,
      title,
      description,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    })
    .select('*')
    .limit(1)
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
