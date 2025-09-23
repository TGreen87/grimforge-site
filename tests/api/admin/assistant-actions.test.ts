import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/assistant/actions/route'

const {
  mockCreateClient,
  mockCreateServiceClient,
  mockWriteAuditLog,
  mockGetAnalyticsSummary,
  mockFormatAnalyticsSummary,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateServiceClient: vi.fn(),
  mockWriteAuditLog: vi.fn(),
  mockGetAnalyticsSummary: vi.fn(),
  mockFormatAnalyticsSummary: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceClient: mockCreateServiceClient,
}))

vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

vi.mock('@/lib/analytics/overview', () => ({
  getAnalyticsSummary: mockGetAnalyticsSummary,
  formatAnalyticsSummary: mockFormatAnalyticsSummary,
}))

describe('Admin assistant actions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    const userRolesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
    }

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } } }),
      },
      from: vi.fn(() => userRolesQuery),
    })
  })

  it('runs summarize_analytics action and returns formatted summary', async () => {
    mockGetAnalyticsSummary.mockResolvedValue({
      range: '7d',
      since: new Date().toISOString(),
      totalEvents: 42,
      pageViews: 30,
      uniqueSessions: 12,
      internalEvents: 10,
      externalEvents: 32,
      topPages: [],
      topReferrers: [],
      events: [],
    })
    mockFormatAnalyticsSummary.mockReturnValue('Analytics summary text')

    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({ type: 'summarize_analytics', parameters: { range: '7d' } }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toBe('Analytics summary text')
    expect(mockGetAnalyticsSummary).toHaveBeenCalledWith({ range: '7d', pathname: undefined })
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'assistant.analytics.summarize' })
    )
  })

  it('runs lookup_order_status action and returns order details', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'order-id',
        order_number: 'ORR-123456',
        email: 'fan@example.com',
        status: 'processing',
        payment_status: 'paid',
        subtotal: 45,
        shipping: 10,
        total: 55,
        currency: 'AUD',
        created_at: '2025-09-20T10:00:00Z',
        metadata: {},
        customer: { first_name: 'Aria', last_name: 'Nocturne' },
        order_items: [
          { quantity: 1, price: 45, total: 45, product_name: 'Dark Rituals', variant_name: 'Vinyl' },
        ],
      },
      error: null,
    })

    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle,
    }

    mockCreateServiceClient.mockReturnValue({
      from: vi.fn(() => orderQuery),
    })

    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'lookup_order_status',
        parameters: { email: 'fan@example.com' },
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.message).toContain('ORR-123456')
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'assistant.order.lookup' })
    )
  })

  it('returns 404 when lookup_order_status finds no match', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null })

    const orderQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle,
    }

    mockCreateServiceClient.mockReturnValue({
      from: vi.fn(() => orderQuery),
    })

    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'lookup_order_status',
        parameters: { order_number: 'ORR-999999' },
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Order not found')
  })
})
