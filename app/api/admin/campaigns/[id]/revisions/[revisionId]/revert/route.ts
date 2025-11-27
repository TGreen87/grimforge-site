import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

async function requireAdmin(sessionOnly = false) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: NextResponse.json({ error: 'not_authenticated' }, { status: 401 }) }
  }

  if (sessionOnly) return { session }

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

export async function POST(_req: NextRequest, { params }: { params: { id: string; revisionId: string } }) {
  const { session, error } = await requireAdmin()
  if (error || !session) return error ?? NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const campaignId = params.id
  const revisionId = params.revisionId

  if (!campaignId || !revisionId) {
    return NextResponse.json({ error: 'Missing campaign or revision id' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: revision, error: revError } = await service
    .from('campaign_revisions')
    .select('campaign_id, snapshot')
    .eq('id', revisionId)
    .eq('campaign_id', campaignId)
    .maybeSingle()

  if (revError || !revision) {
    return NextResponse.json({ error: revError?.message ?? 'Revision not found' }, { status: 404 })
  }

  const snapshot = revision.snapshot as Record<string, unknown>

  const updatableFields = [
    'title',
    'subtitle',
    'description',
    'hero_image_url',
    'background_video_url',
    'cta_primary_label',
    'cta_primary_href',
    'cta_secondary_label',
    'cta_secondary_href',
    'audio_preview_url',
    'active',
    'starts_at',
    'ends_at',
    'sort_order',
    'revision_note',
  ] as const

  const payload: Record<string, unknown> = {}
  for (const field of updatableFields) {
    if (field in snapshot) {
      payload[field] = snapshot[field]
    }
  }

  const { error: updateError } = await service
    .from('campaigns')
    .update(payload)
    .eq('id', campaignId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
