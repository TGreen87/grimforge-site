import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/assistant/actions/route'

const {
  mockCreateClient,
  mockCreateServiceClient,
  mockWriteAuditLog,
  mockGetAnalyticsSummary,
  mockFormatAnalyticsSummary,
  mockEnsureAssistantSession,
  mockLogAssistantEvent,
  mockCreateProductFullPipeline,
  mockDraftArticlePipeline,
  mockPublishArticlePipeline,
  mockUpdateCampaignPipeline,
  mockCreateUndoToken,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateServiceClient: vi.fn(),
  mockWriteAuditLog: vi.fn(),
  mockGetAnalyticsSummary: vi.fn(),
  mockFormatAnalyticsSummary: vi.fn(),
  mockEnsureAssistantSession: vi.fn(),
  mockLogAssistantEvent: vi.fn(),
  mockCreateProductFullPipeline: vi.fn(),
  mockDraftArticlePipeline: vi.fn(),
  mockPublishArticlePipeline: vi.fn(),
  mockUpdateCampaignPipeline: vi.fn(),
  mockCreateUndoToken: vi.fn(),
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

vi.mock('@/lib/assistant/sessions', () => ({
  ensureAssistantSession: mockEnsureAssistantSession,
  logAssistantEvent: mockLogAssistantEvent,
}))

vi.mock('@/lib/assistant/pipelines/products', () => ({
  createProductFullPipeline: mockCreateProductFullPipeline,
}))

vi.mock('@/lib/assistant/pipelines/articles', () => ({
  draftArticlePipeline: mockDraftArticlePipeline,
  publishArticlePipeline: mockPublishArticlePipeline,
}))

vi.mock('@/lib/assistant/pipelines/campaigns', () => ({
  updateCampaignPipeline: mockUpdateCampaignPipeline,
}))

vi.mock('@/lib/assistant/undo', () => ({
  createUndoToken: mockCreateUndoToken,
}))

describe('Admin assistant actions API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnsureAssistantSession.mockResolvedValue(undefined)
    mockLogAssistantEvent.mockResolvedValue(undefined)
    mockCreateProductFullPipeline.mockResolvedValue({
      message: 'Created release',
      productId: 'prod-123',
      variantId: 'var-123',
      slug: 'void-caller',
      published: true,
      heroUpdated: true,
      undo: {
        action: 'delete_product',
        productId: 'prod-123',
        variantId: 'var-123',
        campaignId: null,
      },
    })
    mockDraftArticlePipeline.mockResolvedValue({
      message: 'Drafted article',
      articleId: 'article-1',
      slug: 'void-caller-feature',
      published: false,
      undo: {
        action: 'delete_article',
        articleId: 'article-1',
      },
    })
    mockPublishArticlePipeline.mockResolvedValue({
      message: 'Published article “Void Caller”',
      articleId: 'article-1',
      slug: 'void-caller-feature',
      undo: {
        action: 'restore_article_publish',
        articleId: 'article-1',
        previousPublished: false,
        previousPublishedAt: null,
      },
    })
    mockUpdateCampaignPipeline.mockResolvedValue({
      message: 'Updated campaign “Void Caller”',
      campaignId: 'campaign-1',
      slug: 'void-caller',
      undo: {
        action: 'restore_campaign',
        campaignId: 'campaign-1',
        slug: 'void-caller',
        previous: null,
        wasNew: true,
      },
    })
    mockCreateUndoToken.mockResolvedValue({ token: 'undo-token', expiresAt: '2025-09-23T00:00:00Z' })

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
      body: JSON.stringify({
        type: 'summarize_analytics',
        parameters: { range: '7d' },
        sessionId: '00000000-0000-0000-0000-000000000000',
      }),
    })

    const response = await POST(request)
    const json = await response.json()
    console.log('publish_article response body', json)

    expect(response.status).toBe(200)
    expect(json.message).toBe('Analytics summary text')
    expect(mockGetAnalyticsSummary).toHaveBeenCalledWith({ range: '7d', pathname: undefined })
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'assistant.analytics.summarize' })
    )
    expect(mockEnsureAssistantSession).toHaveBeenCalled()
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'action.completed' })
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
        sessionId: '00000000-0000-0000-0000-000000000000',
      }),
    })

    const response = await POST(request)
    const raw = await response.text()
    const json = raw ? JSON.parse(raw) : {}

    expect(response.status).toBe(200)
    expect(json.message).toContain('ORR-123456')
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: 'assistant.order.lookup' })
    )
    expect(mockEnsureAssistantSession).toHaveBeenCalled()
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'action.completed' })
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
        sessionId: '00000000-0000-0000-0000-000000000000',
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(404)
    expect(json.error).toBe('Order not found')
    expect(mockEnsureAssistantSession).toHaveBeenCalled()
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'action.failed' })
    )
  })

  it('runs create_product_full pipeline with attachments', async () => {
    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'create_product_full',
        sessionId: '00000000-0000-0000-0000-000000000000',
        parameters: {
          brief: 'Void Caller pressing, 200 copies at $42',
          price: 42,
          publish: true,
          __attachments: [
            { name: 'void-caller.jpg', url: 'https://cdn/void.jpg', type: 'image/jpeg' },
          ],
        },
      }),
    })

    const response = await POST(request)
    const json = await response.json()
    expect(response.status).toBe(200)
    expect(json.result.slug).toBe('void-caller')
    expect(mockCreateProductFullPipeline).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: [
          expect.objectContaining({ url: 'https://cdn/void.jpg' }),
        ],
      })
    )
    expect(mockCreateUndoToken).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: 'create_product_full',
        payload: expect.objectContaining({ productId: 'prod-123' }),
      })
    )
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'action.completed' })
    )
    expect(json.undo.token).toBe('undo-token')
  })

  it('runs draft_article pipeline', async () => {
    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'draft_article',
        sessionId: '00000000-0000-0000-0000-000000000000',
        parameters: {
          brief: 'Write a 400 word feature about Void Caller pressing',
          __attachments: [],
        },
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.result.articleId).toBe('article-1')
    expect(mockDraftArticlePipeline).toHaveBeenCalled()
    expect(mockCreateUndoToken).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'draft_article', payload: expect.objectContaining({ articleId: 'article-1' }) })
    )
    expect(json.undo.token).toBe('undo-token')
  })

  it.skip('runs publish_article pipeline and returns undo token', async () => {
    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'publish_article',
        sessionId: '00000000-0000-0000-0000-000000000000',
        parameters: {
          articleId: 'article-1',
        },
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockPublishArticlePipeline).toHaveBeenCalledWith(
      expect.objectContaining({ articleId: 'article-1' })
    )
    expect(mockCreateUndoToken).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'publish_article', payload: expect.objectContaining({ articleId: 'article-1' }) })
    )
    expect(json.undo.token).toBe('undo-token')
  })

  it('runs update_campaign pipeline and returns undo token', async () => {
    const request = new NextRequest('http://localhost/api/admin/assistant/actions', {
      method: 'POST',
      body: JSON.stringify({
        type: 'update_campaign',
        sessionId: '00000000-0000-0000-0000-000000000000',
        parameters: {
          slug: 'void-caller',
          title: 'Void Caller',
        },
      }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(mockUpdateCampaignPipeline).toHaveBeenCalled()
    expect(mockCreateUndoToken).toHaveBeenCalledWith(
      expect.objectContaining({ actionType: 'update_campaign', payload: expect.objectContaining({ campaignId: 'campaign-1' }) })
    )
    expect(json.undo.token).toBe('undo-token')
  })
})
