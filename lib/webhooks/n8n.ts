/**
 * n8n Outbound Webhook Service
 *
 * Sends webhook events to n8n for workflow automation.
 * Supports signature verification, retries, and event queuing.
 */

import crypto from 'crypto'

// Event types that can be sent to n8n
export type N8nEventType =
  // Order events
  | 'orders:created'
  | 'orders:paid'
  | 'orders:fulfilled'
  | 'orders:cancelled'
  | 'orders:refunded'
  // Inventory events
  | 'inventory:low_stock'
  | 'inventory:out_of_stock'
  | 'inventory:restocked'
  // Customer events
  | 'customers:created'
  | 'customers:first_purchase'
  | 'carts:abandoned'
  // Product events
  | 'products:created'
  | 'products:updated'
  | 'products:published'
  // Assistant events
  | 'assistant:action_executed'
  | 'assistant:error'
  // System events
  | 'system:daily_summary'
  | 'system:health_check'

export interface N8nWebhookPayload<T = Record<string, unknown>> {
  event: N8nEventType
  timestamp: number
  webhookId: string
  data: T
  metadata?: {
    source: string
    version: string
    environment: string
  }
}

export interface N8nWebhookConfig {
  url: string
  secret: string
  enabled: boolean
  events: N8nEventType[]
  retryAttempts?: number
  timeoutMs?: number
}

// Default configuration
const DEFAULT_CONFIG: Partial<N8nWebhookConfig> = {
  retryAttempts: 3,
  timeoutMs: 10000,
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
function generateSignature(payload: string, timestamp: number, secret: string): string {
  const signaturePayload = `${timestamp}.${payload}`
  return crypto.createHmac('sha256', secret).update(signaturePayload).digest('hex')
}

/**
 * Generate a unique webhook ID
 */
function generateWebhookId(): string {
  return `wh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`
}

/**
 * Send a webhook event to n8n
 */
export async function sendN8nWebhook<T extends Record<string, unknown>>(
  event: N8nEventType,
  data: T,
  config?: Partial<N8nWebhookConfig>
): Promise<{ success: boolean; webhookId: string; error?: string }> {
  // Get configuration from environment or provided config
  const webhookUrl = config?.url || process.env.N8N_WEBHOOK_URL
  const webhookSecret = config?.secret || process.env.N8N_WEBHOOK_SECRET
  const isEnabled = config?.enabled ?? process.env.N8N_WEBHOOKS_ENABLED === 'true'
  const enabledEvents = config?.events || parseEnabledEvents()
  const retryAttempts = config?.retryAttempts ?? DEFAULT_CONFIG.retryAttempts!
  const timeoutMs = config?.timeoutMs ?? DEFAULT_CONFIG.timeoutMs!

  const webhookId = generateWebhookId()

  // Check if webhooks are enabled
  if (!isEnabled) {
    console.log(`[n8n] Webhooks disabled, skipping event: ${event}`)
    return { success: true, webhookId, error: 'Webhooks disabled' }
  }

  // Check if this event type is enabled
  if (enabledEvents.length > 0 && !enabledEvents.includes(event)) {
    console.log(`[n8n] Event type not enabled: ${event}`)
    return { success: true, webhookId, error: 'Event type not enabled' }
  }

  // Validate configuration
  if (!webhookUrl) {
    console.warn('[n8n] No webhook URL configured')
    return { success: false, webhookId, error: 'No webhook URL configured' }
  }

  // Build payload
  const timestamp = Date.now()
  const payload: N8nWebhookPayload<T> = {
    event,
    timestamp,
    webhookId,
    data,
    metadata: {
      source: 'obsidian-rite-admin',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  }

  const payloadString = JSON.stringify(payload)

  // Generate signature if secret is configured
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Webhook-Event': event,
    'X-Webhook-Id': webhookId,
    'X-Webhook-Timestamp': timestamp.toString(),
  }

  if (webhookSecret) {
    headers['X-Webhook-Signature'] = generateSignature(payloadString, timestamp, webhookSecret)
  }

  // Send with retries
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: payloadString,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        console.log(`[n8n] Webhook sent successfully: ${event} (${webhookId})`)
        return { success: true, webhookId }
      }

      const errorText = await response.text()
      lastError = new Error(`HTTP ${response.status}: ${errorText}`)
      console.warn(`[n8n] Webhook failed (attempt ${attempt}/${retryAttempts}): ${lastError.message}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn(`[n8n] Webhook error (attempt ${attempt}/${retryAttempts}): ${lastError.message}`)
    }

    // Exponential backoff between retries
    if (attempt < retryAttempts) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  console.error(`[n8n] Webhook failed after ${retryAttempts} attempts: ${event}`)
  return { success: false, webhookId, error: lastError?.message || 'Unknown error' }
}

/**
 * Parse enabled events from environment variable
 */
function parseEnabledEvents(): N8nEventType[] {
  const eventsEnv = process.env.N8N_WEBHOOK_EVENTS
  if (!eventsEnv) return []
  return eventsEnv.split(',').map((e) => e.trim()) as N8nEventType[]
}

// Convenience functions for common events

export async function notifyOrderCreated(order: {
  id: string
  orderNumber: string
  customerEmail: string
  totalAmount: number
  currency: string
  items: Array<{ productId: string; title: string; quantity: number; price: number }>
}) {
  return sendN8nWebhook('orders:created', order)
}

export async function notifyOrderPaid(order: {
  id: string
  orderNumber: string
  customerEmail: string
  paymentMethod: string
  paidAt: string
}) {
  return sendN8nWebhook('orders:paid', order)
}

export async function notifyOrderFulfilled(order: {
  id: string
  orderNumber: string
  customerEmail: string
  trackingNumber?: string
  carrier?: string
  fulfilledAt: string
}) {
  return sendN8nWebhook('orders:fulfilled', order)
}

export async function notifyLowStock(product: {
  id: string
  title: string
  sku: string
  currentStock: number
  threshold: number
}) {
  return sendN8nWebhook('inventory:low_stock', product)
}

export async function notifyOutOfStock(product: {
  id: string
  title: string
  sku: string
}) {
  return sendN8nWebhook('inventory:out_of_stock', product)
}

export async function notifyRestocked(product: {
  id: string
  title: string
  sku: string
  newStock: number
  previousStock: number
}) {
  return sendN8nWebhook('inventory:restocked', product)
}

export async function notifyNewCustomer(customer: {
  id: string
  email: string
  name?: string
  createdAt: string
}) {
  return sendN8nWebhook('customers:created', customer)
}

export async function notifyFirstPurchase(customer: {
  id: string
  email: string
  name?: string
  orderId: string
  orderTotal: number
}) {
  return sendN8nWebhook('customers:first_purchase', customer)
}

export async function notifyAbandonedCart(cart: {
  id: string
  customerEmail?: string
  items: Array<{ productId: string; title: string; quantity: number }>
  totalValue: number
  abandonedAt: string
}) {
  return sendN8nWebhook('carts:abandoned', cart)
}

export async function notifyAssistantAction(action: {
  actionType: string
  summary: string
  parameters: Record<string, unknown>
  result: 'success' | 'error'
  executedBy: string
  executedAt: string
}) {
  return sendN8nWebhook('assistant:action_executed', action)
}

export async function sendDailySummary(summary: {
  date: string
  ordersCount: number
  revenue: number
  newCustomers: number
  lowStockItems: number
  topProducts: Array<{ title: string; quantity: number }>
}) {
  return sendN8nWebhook('system:daily_summary', summary)
}

/**
 * Test webhook connectivity
 */
export async function testN8nWebhook(url: string, secret?: string): Promise<{
  success: boolean
  latencyMs: number
  error?: string
}> {
  const startTime = Date.now()
  const result = await sendN8nWebhook(
    'system:health_check',
    { test: true, timestamp: new Date().toISOString() },
    { url, secret: secret || '', enabled: true, events: ['system:health_check'] }
  )
  const latencyMs = Date.now() - startTime

  return {
    success: result.success,
    latencyMs,
    error: result.error,
  }
}
