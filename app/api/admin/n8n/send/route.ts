import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/assistant/auth'
import { sendN8nWebhook, N8nEventType } from '@/lib/webhooks/n8n'

export const dynamic = 'force-dynamic'

// Sample data for each event type (for testing)
const SAMPLE_DATA: Record<N8nEventType, Record<string, unknown>> = {
  'orders:created': {
    id: 'order_sample_123',
    orderNumber: 'ORR-2024-0001',
    customerEmail: 'test@example.com',
    totalAmount: 89.99,
    currency: 'AUD',
    items: [
      { productId: 'prod_1', title: 'Darkthrone - Transilvanian Hunger Vinyl', quantity: 1, price: 49.99 },
      { productId: 'prod_2', title: 'Mayhem Patch', quantity: 2, price: 20.00 },
    ],
  },
  'orders:paid': {
    id: 'order_sample_123',
    orderNumber: 'ORR-2024-0001',
    customerEmail: 'test@example.com',
    paymentMethod: 'card',
    paidAt: new Date().toISOString(),
  },
  'orders:fulfilled': {
    id: 'order_sample_123',
    orderNumber: 'ORR-2024-0001',
    customerEmail: 'test@example.com',
    trackingNumber: 'AP123456789AU',
    carrier: 'Australia Post',
    fulfilledAt: new Date().toISOString(),
  },
  'orders:cancelled': {
    id: 'order_sample_123',
    orderNumber: 'ORR-2024-0001',
    customerEmail: 'test@example.com',
    reason: 'Customer request',
    cancelledAt: new Date().toISOString(),
  },
  'orders:refunded': {
    id: 'order_sample_123',
    orderNumber: 'ORR-2024-0001',
    customerEmail: 'test@example.com',
    refundAmount: 89.99,
    refundReason: 'Product damaged in transit',
    refundedAt: new Date().toISOString(),
  },
  'inventory:low_stock': {
    id: 'prod_sample_456',
    title: 'Emperor - In The Nightside Eclipse Vinyl',
    sku: 'VNL-EMP-001',
    currentStock: 3,
    threshold: 5,
  },
  'inventory:out_of_stock': {
    id: 'prod_sample_789',
    title: 'Burzum - Filosofem Vinyl',
    sku: 'VNL-BRZ-001',
  },
  'inventory:restocked': {
    id: 'prod_sample_456',
    title: 'Emperor - In The Nightside Eclipse Vinyl',
    sku: 'VNL-EMP-001',
    newStock: 25,
    previousStock: 0,
  },
  'customers:created': {
    id: 'cust_sample_001',
    email: 'newcustomer@example.com',
    name: 'John Metalhead',
    createdAt: new Date().toISOString(),
  },
  'customers:first_purchase': {
    id: 'cust_sample_001',
    email: 'newcustomer@example.com',
    name: 'John Metalhead',
    orderId: 'order_sample_123',
    orderTotal: 89.99,
  },
  'carts:abandoned': {
    id: 'cart_sample_001',
    customerEmail: 'interested@example.com',
    items: [
      { productId: 'prod_1', title: 'Immortal - At The Heart Of Winter Vinyl', quantity: 1 },
    ],
    totalValue: 54.99,
    abandonedAt: new Date().toISOString(),
  },
  'products:created': {
    id: 'prod_new_001',
    title: 'Bathory - Blood Fire Death Vinyl',
    sku: 'VNL-BTH-001',
    price: 44.99,
    createdAt: new Date().toISOString(),
  },
  'products:updated': {
    id: 'prod_sample_456',
    title: 'Emperor - In The Nightside Eclipse Vinyl',
    changes: ['price', 'description'],
    updatedAt: new Date().toISOString(),
  },
  'products:published': {
    id: 'prod_new_001',
    title: 'Bathory - Blood Fire Death Vinyl',
    publishedAt: new Date().toISOString(),
  },
  'assistant:action_executed': {
    actionType: 'product_update',
    summary: 'Updated product description for Emperor vinyl',
    parameters: { productId: 'prod_sample_456', field: 'description' },
    result: 'success',
    executedBy: 'admin@obsidianrite.com',
    executedAt: new Date().toISOString(),
  },
  'assistant:error': {
    actionType: 'inventory_sync',
    error: 'Connection timeout to Shopify API',
    context: { attemptedAt: new Date().toISOString() },
  },
  'system:daily_summary': {
    date: new Date().toISOString().split('T')[0],
    ordersCount: 12,
    revenue: 847.88,
    newCustomers: 3,
    lowStockItems: 2,
    topProducts: [
      { title: 'Darkthrone - Transilvanian Hunger Vinyl', quantity: 4 },
      { title: 'Mayhem Patches', quantity: 8 },
    ],
  },
  'system:health_check': {
    test: true,
    timestamp: new Date().toISOString(),
  },
}

/**
 * POST /api/admin/n8n/send
 * Send a manual webhook event to n8n
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }

    const body = await request.json()
    const { event, data, useSampleData = true } = body

    if (!event) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!SAMPLE_DATA[event as N8nEventType]) {
      return NextResponse.json(
        { error: `Unknown event type: ${event}` },
        { status: 400 }
      )
    }

    // Use sample data or provided data
    const eventData = useSampleData ? SAMPLE_DATA[event as N8nEventType] : data

    if (!eventData) {
      return NextResponse.json(
        { error: 'Event data is required when useSampleData is false' },
        { status: 400 }
      )
    }

    // Send the webhook
    const result = await sendN8nWebhook(event as N8nEventType, eventData)

    return NextResponse.json({
      success: result.success,
      webhookId: result.webhookId,
      event,
      error: result.error,
      sentAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('n8n send endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Send failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/n8n/send
 * Get available event types and sample data
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin auth
    const adminCheck = await assertAdmin(request)
    if (!adminCheck.ok) {
      return adminCheck.error
    }

    // Return available events with descriptions
    const events = [
      { event: 'orders:created', category: 'Orders', description: 'New order placed' },
      { event: 'orders:paid', category: 'Orders', description: 'Payment confirmed' },
      { event: 'orders:fulfilled', category: 'Orders', description: 'Order shipped' },
      { event: 'orders:cancelled', category: 'Orders', description: 'Order cancelled' },
      { event: 'orders:refunded', category: 'Orders', description: 'Refund issued' },
      { event: 'inventory:low_stock', category: 'Inventory', description: 'Stock below threshold' },
      { event: 'inventory:out_of_stock', category: 'Inventory', description: 'Product out of stock' },
      { event: 'inventory:restocked', category: 'Inventory', description: 'Stock replenished' },
      { event: 'customers:created', category: 'Customers', description: 'New customer registered' },
      { event: 'customers:first_purchase', category: 'Customers', description: 'First order completed' },
      { event: 'carts:abandoned', category: 'Customers', description: 'Cart abandoned' },
      { event: 'products:created', category: 'Products', description: 'New product added' },
      { event: 'products:updated', category: 'Products', description: 'Product updated' },
      { event: 'products:published', category: 'Products', description: 'Product published' },
      { event: 'assistant:action_executed', category: 'Assistant', description: 'AI action completed' },
      { event: 'assistant:error', category: 'Assistant', description: 'AI action failed' },
      { event: 'system:daily_summary', category: 'System', description: 'Daily business summary' },
      { event: 'system:health_check', category: 'System', description: 'Connectivity test' },
    ]

    return NextResponse.json({
      events,
      sampleData: SAMPLE_DATA,
    })
  } catch (error) {
    console.error('n8n events endpoint error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load events' },
      { status: 500 }
    )
  }
}
