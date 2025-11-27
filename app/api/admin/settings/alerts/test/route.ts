import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSlackMessage } from '@/lib/integrations/slack'

async function requireAdmin() {
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

export async function POST(_req: NextRequest) {
  const { session, error } = await requireAdmin()
  if (error) return error
  if (!session) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data, error: settingsError } = await service
    .from('admin_settings')
    .select('key, value')
    .eq('key', 'slack_webhooks')
    .maybeSingle()

  if (settingsError) {
    return NextResponse.json({ error: settingsError.message }, { status: 500 })
  }

  const webhookUrl = typeof data?.value?.ops_alert_webhook === 'string' ? data.value.ops_alert_webhook : null
  const enabled = Boolean(data?.value?.enable_ops_alerts)

  if (!enabled || !webhookUrl) {
    return NextResponse.json({ error: 'Slack alerts disabled or webhook missing' }, { status: 400 })
  }

  try {
    await sendSlackMessage(webhookUrl, {
      text: `:ghost: Obsidian Rite Ops Test — initiated by ${session.user.email ?? session.user.id}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Slack webhook failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
