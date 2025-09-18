import { NextRequest, NextResponse } from 'next/server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendSlackMessage } from '@/lib/integrations/slack'

async function requireAdminAndSettings() {
  const supabase = createClient()
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

  const service = createServiceClient()
  const { data, error } = await service
    .from('admin_settings')
    .select('key, value')
    .in('key', ['slack_webhooks', 'dashboard_alerts'])

  if (error) {
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) }
  }

  const map: Record<string, any> = {}
  for (const row of data ?? []) {
    map[row.key] = row.value
  }

  return { session, settings: map }
}

export async function POST(req: NextRequest) {
  const { session, settings, error } = await requireAdminAndSettings()
  if (error || !session) return error ?? NextResponse.json({ error: 'not_authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as {
    awaitingCount?: number
    lowStockCount?: number
  }

  const awaitingCount = typeof body.awaitingCount === 'number' ? body.awaitingCount : 0
  const lowStockCount = typeof body.lowStockCount === 'number' ? body.lowStockCount : 0

  const alerts = settings?.dashboard_alerts ?? {}
  const slack = settings?.slack_webhooks ?? {}

  if (!slack.enable_ops_alerts || typeof slack.ops_alert_webhook !== 'string' || slack.ops_alert_webhook.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'Slack alerts disabled' })
  }

  const thresholdFulfilment = Number(alerts.awaiting_fulfilment_threshold ?? 0)
  const thresholdLowStock = Number(alerts.low_stock_threshold ?? 0)

  const shouldAlertFulfilment = thresholdFulfilment > 0 && awaitingCount >= thresholdFulfilment
  const shouldAlertLowStock = thresholdLowStock > 0 && lowStockCount >= thresholdLowStock

  if (!shouldAlertFulfilment && !shouldAlertLowStock) {
    return NextResponse.json({ skipped: true, reason: 'Thresholds not exceeded' })
  }

  const nowIso = new Date().toISOString()
  const lastSent = (slack.last_sent ?? {}) as Record<string, string | null>
  const cooldownMs = 1000 * 60 * 30 // 30-minute cooldown

  const shouldSendFulfilment = shouldAlertFulfilment && (!lastSent.awaiting_fulfilment || Date.now() - Date.parse(lastSent.awaiting_fulfilment) > cooldownMs)
  const shouldSendLowStock = shouldAlertLowStock && (!lastSent.low_stock || Date.now() - Date.parse(lastSent.low_stock) > cooldownMs)

  if (!shouldSendFulfilment && !shouldSendLowStock) {
    return NextResponse.json({ skipped: true, reason: 'Cooldown active' })
  }

  const messages: string[] = []
  if (shouldSendFulfilment) {
    messages.push(`⚠️ Awaiting fulfilment count is ${awaitingCount} (threshold ${thresholdFulfilment}).`)
  }
  if (shouldSendLowStock) {
    messages.push(`⚠️ Low stock variants count is ${lowStockCount} (threshold ${thresholdLowStock}).`)
  }

  try {
    await sendSlackMessage(slack.ops_alert_webhook as string, {
      text: [
        ':warning: Obsidian Rite Ops Alert',
        ...messages,
        `Triggered ${nowIso}`,
      ].join('\n'),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Slack webhook failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const service = createServiceClient()
  const updatedLastSent = {
    ...lastSent,
    ...(shouldSendFulfilment ? { awaiting_fulfilment: nowIso } : {}),
    ...(shouldSendLowStock ? { low_stock: nowIso } : {}),
  }

  await service
    .from('admin_settings')
    .update({ value: { ...slack, last_sent: updatedLastSent } })
    .eq('key', 'slack_webhooks')

  return NextResponse.json({ ok: true, sent: messages.length })
}
