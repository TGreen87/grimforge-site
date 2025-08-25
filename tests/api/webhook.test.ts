import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Mock dependencies
vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: vi.fn((name: string) => {
      if (name === 'stripe-signature') {
        return 'test-signature'
      }
      return null
    }),
  })),
}))

vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: vi.fn(),
  createPaymentAuditLog: vi.fn(),
}))

describe('/api/stripe/webhook', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      rpc: vi.fn(),
    }
    
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should handle missing signature header', async () => {
    vi.mock('next/headers', () => ({
      headers: vi.fn(() => ({
        get: vi.fn(() => null),
      })),
    }))

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'test-body',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('should handle invalid signature', async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error('Invalid signature')
    })

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: 'test-body',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Webhook signature verification failed')
  })

  describe('checkout.session.completed', () => {
    it('should process successful payment', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        livemode: false,
        created: 1234567890,
        api_version: '2025-07-30.basil',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              order_id: 'test-order-id',
              variant_id: 'test-variant-id',
              quantity: '2',
            },
            customer_email: 'test@example.com',
            payment_intent: 'pi_test_123',
            currency: 'aud',
            payment_status: 'paid',
            payment_method_types: ['card'],
          } as any,
        },
      } as Stripe.Event

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

      // Mock session retrieval with expanded data
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        id: 'cs_test_123',
        customer_email: 'test@example.com',
        amount_total: 11000, // $110 including tax
        total_details: {
          amount_tax: 1000, // $10 tax
          amount_shipping: 1000, // $10 shipping
        },
        payment_intent: {
          id: 'pi_test_123',
        },
        customer_details: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+61412345678',
        },
        shipping_details: {
          name: 'Test Customer',
          address: {
            line1: '123 Test Street',
            city: 'Sydney',
            state: 'NSW',
            postal_code: '2000',
            country: 'AU',
          },
        },
      } as any)

      // Mock order update
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'test-order-id',
          customer_id: null,
        },
        error: null,
      })

      // Mock customer check
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      })

      // Mock customer creation
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'test-customer-id',
        },
        error: null,
      })

      // Mock customer ID update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      // Mock address creation
      mockSupabase.insert.mockResolvedValueOnce({
        error: null,
      })

      // Mock inventory decrement
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.received).toBe(true)

      // Verify order was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
          payment_status: 'paid',
          email: 'test@example.com',
          tax: 10, // $10
          shipping: 10, // $10
          total: 110, // $110
        })
      )

      // Verify inventory was decremented
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_inventory', {
        p_variant_id: 'test-variant-id',
        p_quantity: 2,
        p_order_id: 'test-order-id',
      })
    })

    it('should handle missing order_id in metadata', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        livemode: false,
        created: 1234567890,
        api_version: '2025-07-30.basil',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {}, // Missing order_id
          } as any,
        },
      } as Stripe.Event

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.received).toBe(true)
      // Should not attempt to update order
      expect(mockSupabase.update).not.toHaveBeenCalled()
    })

    it('should handle inventory decrement failure gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        livemode: false,
        created: 1234567890,
        api_version: '2025-07-30.basil',
        data: {
          object: {
            id: 'cs_test_123',
            metadata: {
              order_id: 'test-order-id',
              variant_id: 'test-variant-id',
              quantity: '2',
            },
          } as any,
        },
      } as Stripe.Event

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

      // Mock session retrieval
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        id: 'cs_test_123',
        amount_total: 10000,
        total_details: {},
      } as any)

      // Mock order update
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'test-order-id' },
        error: null,
      })

      // Mock inventory decrement failure
      mockSupabase.rpc.mockResolvedValueOnce({
        data: false,
        error: { message: 'Insufficient inventory' },
      })

      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const res = await POST(req)
      const data = await res.json()

      // Should still return success to prevent Stripe retries
      expect(res.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  describe('payment_intent.payment_failed', () => {
    it('should handle payment failure', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_456',
        type: 'payment_intent.payment_failed',
        livemode: false,
        created: 1234567890,
        api_version: '2025-07-30.basil',
        data: {
          object: {
            id: 'pi_test_456',
            amount: 10000,
            currency: 'aud',
            metadata: {
              order_id: 'test-order-id',
            },
            last_payment_error: {
              message: 'Card declined',
              code: 'card_declined',
              type: 'card_error',
            },
            charges: {
              data: [],
            },
          } as any,
        },
      } as Stripe.Event

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

      // Mock order update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.received).toBe(true)

      // Verify order was updated with failure status
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_status: 'failed',
          metadata: expect.objectContaining({
            payment_failure_reason: 'Card declined',
            payment_failure_code: 'card_declined',
          }),
        })
      )
    })
  })

  describe('checkout.session.expired', () => {
    it('should handle session expiration', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test_789',
        type: 'checkout.session.expired',
        livemode: false,
        created: 1234567890,
        api_version: '2025-07-30.basil',
        data: {
          object: {
            id: 'cs_test_789',
            metadata: {
              order_id: 'test-order-id',
            },
            expires_at: 1234567890,
          } as any,
        },
      } as Stripe.Event

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

      // Mock order update
      mockSupabase.eq.mockResolvedValueOnce({
        error: null,
      })

      const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.received).toBe(true)

      // Verify order was cancelled
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'cancelled',
          payment_status: 'cancelled',
          metadata: expect.objectContaining({
            cancelled_reason: 'checkout_expired',
          }),
        })
      )
    })
  })

  it('should handle unhandled event types', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_999',
      type: 'charge.succeeded' as any, // Unhandled event type
      livemode: false,
      created: 1234567890,
      api_version: '2025-07-30.basil',
      data: {
        object: {} as any,
      },
    } as Stripe.Event

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('should handle processing errors gracefully', async () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_error',
      type: 'checkout.session.completed',
      livemode: false,
      created: 1234567890,
      api_version: '2025-07-30.basil',
      data: {
        object: {
          id: 'cs_test_error',
          metadata: {
            order_id: 'test-order-id',
          },
        } as any,
      },
    } as Stripe.Event

    vi.mocked(stripe.webhooks.constructEvent).mockReturnValueOnce(mockEvent)
    
    // Force an error during session retrieval
    vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValueOnce(
      new Error('Stripe API error')
    )

    const req = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    })

    const res = await POST(req)
    const data = await res.json()

    // Should still return success to prevent Stripe retries
    expect(res.status).toBe(200)
    expect(data.received).toBe(true)
  })
})