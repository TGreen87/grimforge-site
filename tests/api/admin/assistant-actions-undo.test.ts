import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/assistant/actions/undo/route'

const {
  mockCreateClient,
  mockCreateServiceClient,
  mockLoadUndoToken,
  mockMarkUndoCompleted,
  mockLogAssistantEvent,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockCreateServiceClient: vi.fn(),
  mockLoadUndoToken: vi.fn(),
  mockMarkUndoCompleted: vi.fn(),
  mockLogAssistantEvent: vi.fn(),
}))

let undoToken: string

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
  createServiceClient: mockCreateServiceClient,
}))

vi.mock('@/lib/assistant/undo', () => ({
  loadUndoToken: mockLoadUndoToken,
  markUndoCompleted: mockMarkUndoCompleted,
}))

vi.mock('@/lib/assistant/sessions', () => ({
  logAssistantEvent: mockLogAssistantEvent,
}))

describe.skip('Assistant action undo API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'admin-user' } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { role: 'admin' } }),
      })),
    })

    const orderItemsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    const deleteProductsEq = vi.fn().mockResolvedValue({ error: null })
    const productsQuery = {
      delete: vi.fn().mockReturnValue({ eq: deleteProductsEq }),
    }
    const deleteCampaignEq = vi.fn().mockResolvedValue({ error: null })
    const campaignsQuery = {
      delete: vi.fn().mockReturnValue({ eq: deleteCampaignEq }),
    }

    mockCreateServiceClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'order_items') return orderItemsQuery
        if (table === 'products') return productsQuery
        if (table === 'campaigns') return campaignsQuery
        throw new Error(`Unexpected table ${table}`)
      }),
    })

    undoToken = '00000000-0000-0000-0000-000000000001'
    mockLoadUndoToken.mockResolvedValue({
      id: undoToken,
      action_type: 'create_product_full',
      payload: {
        productId: 'prod-123',
        variantId: 'var-123',
        campaignId: 'camp-123',
      },
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      undone_at: null,
      session_id: 'session-1',
    })

    mockMarkUndoCompleted.mockResolvedValue(undefined)
    mockLogAssistantEvent.mockResolvedValue(undefined)
  })

  it('undoes create_product_full by deleting product and campaign', async () => {
    const request = new NextRequest('http://localhost/api/admin/assistant/actions/undo', {
      method: 'POST',
      body: JSON.stringify({ token: undoToken }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockMarkUndoCompleted).toHaveBeenCalledWith(undoToken)
    expect(mockLogAssistantEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'action.undo_completed' })
    )
  })

  it('rejects expired undo tokens', async () => {
    mockLoadUndoToken.mockResolvedValueOnce({
      id: '00000000-0000-0000-0000-000000000002',
      action_type: 'create_product_full',
      payload: {
        productId: 'prod-123',
        variantId: 'var-123',
      },
      expires_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      undone_at: null,
      session_id: null,
    })

    const request = new NextRequest('http://localhost/api/admin/assistant/actions/undo', {
      method: 'POST',
      body: JSON.stringify({ token: '00000000-0000-0000-0000-000000000002' }),
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(410)
    expect(json.error).toBe('Undo token expired')
    expect(mockMarkUndoCompleted).not.toHaveBeenCalled()
  })
})
