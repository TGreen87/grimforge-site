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
    .from('story_newsletter_settings')
    .select('id, heading, subheading, cta_label')
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdminSession()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const heading = typeof body?.heading === 'string' ? body.heading.trim() : ''
  const subheading = typeof body?.subheading === 'string' ? body.subheading.trim() : ''
  const ctaLabel = typeof body?.cta_label === 'string' ? body.cta_label.trim() : ''

  const service = createServiceClient()
  const existing = await service
    .from('story_newsletter_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (existing.error) {
    return NextResponse.json({ error: existing.error.message }, { status: 500 })
  }

  const payload = {
    heading: heading || undefined,
    subheading: subheading || undefined,
    cta_label: ctaLabel || undefined,
    updated_at: new Date().toISOString(),
  }

  if (existing.data?.id) {
    const { data, error: updateError } = await service
      .from('story_newsletter_settings')
      .update(payload)
      .eq('id', existing.data.id)
      .select('*')
      .single()
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  const { data, error: insertError } = await service
    .from('story_newsletter_settings')
    .insert(payload)
    .select('*')
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
