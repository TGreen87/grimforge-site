import { createServiceClient } from '@/lib/supabase/server'

export interface AuditLogEntry {
  event_type: string
  event_id?: string
  stripe_event_type?: string
  user_id?: string
  order_id?: string
  resource_type?: string
  resource_id?: string
  changes?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}

/**
 * Writes an audit log entry to the database
 * Uses service role client to bypass RLS
 */
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        event_type: entry.event_type,
        event_id: entry.event_id,
        user_id: entry.user_id,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        changes: (entry.changes as any) ?? null,
        metadata: (entry.metadata as any) ?? null,
        ip_address: entry.ip_address as any,
        user_agent: entry.user_agent,
        created_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Failed to write audit log:', error)
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Audit logging error:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Creates a formatted audit log entry for payment events
 */
export function createPaymentAuditLog({
  eventType,
  stripeEventId,
  stripeEventType,
  orderId,
  customerId,
  customerEmail,
  amount,
  currency,
  taxAmount,
  paymentStatus,
  stripeSessionId,
  stripePaymentIntentId,
  error,
  metadata = {},
}: {
  eventType: string
  stripeEventId?: string
  stripeEventType?: string
  orderId?: string
  customerId?: string
  customerEmail?: string
  amount?: number
  currency?: string
  taxAmount?: number
  paymentStatus?: string
  stripeSessionId?: string
  stripePaymentIntentId?: string
  error?: string
  metadata?: Record<string, unknown>
}): AuditLogEntry {
  return {
    event_type: eventType,
    event_id: stripeEventId,
    stripe_event_type: stripeEventType,
    order_id: orderId,
    metadata: {
      timestamp: new Date().toISOString(),
      customer_email: customerEmail,
      amount,
      currency,
      tax_amount: taxAmount,
      payment_status: paymentStatus,
      stripe_session_id: stripeSessionId,
      stripe_payment_intent_id: stripePaymentIntentId,
      error_message: error,
      ...metadata,
    },
  }
}
