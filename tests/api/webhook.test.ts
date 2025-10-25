import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/stripe/webhook/route'
import type Stripe from 'stripe'

// Mock Stripe
const mockConstructEvent = vi.fn()
const mockRetrieve = vi.fn()

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
    checkout: {
      sessions: {
        retrieve: mockRetrieve,
      },
    },
  })),
}))

// Mock Next.js headers
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

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}))

// Mock audit logger
vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: vi.fn(),
  createPaymentAuditLog: vi.fn(() => ({})),
}))

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    
    // Reset default mocks
    mockSupabase.single.mockResolvedValue({
      data: { id: 'test-order-id' },
      error: null,
    })
    
    mockSupabase.rpc.mockResolvedValue({
      data: true,
      error: null,
    })
  })

  it('should handle missing signature header', async () => {
    // Mock headers module to return null for stripe-signature
    const mockHeaders = vi.fn(() => ({
      get: vi.fn(() => null),
    }))
    
    vi.doMock('next/headers', () => ({
      headers: mockHeaders,
    }))

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing stripe-signature header')
  })

  it('should handle invalid signature', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature')
    })

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Webhook signature verification failed')
  })

  describe('checkout.session.completed', () => {
    const mockEvent: Stripe.Event = {
      id: 'evt_test_123',
      object: 'event',
      api_version: '2020-08-27',
      created: Date.now(),
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          amount_total: 4500,
          currency: 'aud',
          customer_email: 'test@example.com',
          payment_status: 'paid',
          metadata: {
            order_id: 'test-order-id',
            variant_id: 'test-variant-id',
            quantity: '1',
          },
          payment_intent: 'pi_test_123',
        } as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_123',
        idempotency_key: null,
      },
      type: 'checkout.session.completed',
    }

    beforeEach(() => {
      mockConstructEvent.mockReturnValue(mockEvent)
      
      // Mock full session retrieval
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_123',
        amount_total: 4500,
        currency: 'aud',
        customer_email: 'test@example.com',
        payment_status: 'paid',
        payment_intent: { id: 'pi_test_123' },
        customer: 'cus_test_123',
        total_details: {
          amount_tax: 450,
          amount_shipping: 0,
        },
        customer_details: {
          name: 'Test Customer',
          phone: '+61400000000',
        },
        shipping_details: {
          address: {
            line1: '123 Test St',
            city: 'Sydney',
            state: 'NSW',
            postal_code: '2000',
            country: 'AU',
          },
        },
        metadata: {
          order_id: 'test-order-id',
          variant_id: 'test-variant-id',
          quantity: '1',
        },
      })
    })

    it('should process successful payment', async () => {
      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      
      // Verify order was updated
      expect(mockSupabase.from).toHaveBeenCalledWith('orders')
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'paid',
          payment_status: 'paid',
          email: 'test@example.com',
        })
      )
      
      // Verify inventory was decremented
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_inventory', {
        p_variant_id: 'test-variant-id',
        p_quantity: 1,
        p_order_id: 'test-order-id',
      })
    })

    it('should handle missing order_id in metadata', async () => {
      const eventWithoutOrderId = {
        ...mockEvent,
        data: {
          object: {
            ...mockEvent.data.object,
            metadata: {
              variant_id: 'test-variant-id',
              quantity: '1',
              // order_id missing
            },
          },
        },
      }
      
      mockConstructEvent.mockReturnValue(eventWithoutOrderId)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(eventWithoutOrderId),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      
      // Should not attempt to update order or decrement inventory
      expect(mockSupabase.update).not.toHaveBeenCalled()
      expect(mockSupabase.rpc).not.toHaveBeenCalled()
    })

    it('should handle inventory decrement failure gracefully', async () => {
      // Mock inventory decrement failure
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insufficient inventory' },
      })

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      
      // Should still process the payment even if inventory fails
      expect(mockSupabase.update).toHaveBeenCalled()
    })
  })

  describe('payment_intent.payment_failed', () => {
    const mockFailedEvent: Stripe.Event = {
      id: 'evt_test_failed',
      object: 'event',
      api_version: '2020-08-27',
      created: Date.now(),
      data: {
        object: {
          id: 'pi_test_failed',
          object: 'payment_intent',
          amount: 4500,
          currency: 'aud',
          status: 'requires_payment_method',
          last_payment_error: {
            message: 'Your card was declined.',
            code: 'card_declined',
          },
          metadata: {
            order_id: 'test-order-id',
          },
        } as Stripe.PaymentIntent,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_failed',
        idempotency_key: null,
      },
      type: 'payment_intent.payment_failed',
    }

    it('should handle payment failure', async () => {
      mockConstructEvent.mockReturnValue(mockFailedEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockFailedEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
      
      // Verify order was updated with failure status
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_status: 'failed',
          metadata: expect.objectContaining({
            payment_failure_reason: 'Your card was declined.',
            payment_failure_code: 'card_declined',
          }),
        })
      )
    })
  })

  describe('checkout.session.expired', () => {
    const mockExpiredEvent: Stripe.Event = {
      id: 'evt_test_expired',
      object: 'event',
      api_version: '2020-08-27',
      created: Date.now(),
      data: {
        object: {
          id: 'cs_test_expired',
          object: 'checkout.session',
          status: 'expired',
          metadata: {
            order_id: 'test-order-id',
          },
        } as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_expired',
        idempotency_key: null,
      },
      type: 'checkout.session.expired',
    }

    it('should handle session expiration', async () => {
      mockConstructEvent.mockReturnValue(mockExpiredEvent)

      const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        body: JSON.stringify(mockExpiredEvent),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.received).toBe(true)
    })
  })

  it('should handle unhandled event types', async () => {
    const mockUnhandledEvent: Stripe.Event = {
      id: 'evt_test_unhandled',
      object: 'event',
      api_version: '2020-08-27',
      created: Date.now(),
      data: {
        object: {} as any,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_unhandled',
        idempotency_key: null,
      },
      type: 'invoice.payment_succeeded' as any,
    }

    mockConstructEvent.mockReturnValue(mockUnhandledEvent)

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(mockUnhandledEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.received).toBe(true)
  })

  it('should handle processing errors gracefully', async () => {
    const testEvent: Stripe.Event = {
      id: 'evt_test_error',
      object: 'event',
      api_version: '2020-08-27',
      created: Date.now(),
      data: {
        object: {
          id: 'cs_test_error',
          object: 'checkout.session',
          amount_total: 4500,
          currency: 'aud',
          customer_email: 'test@example.com',
          payment_status: 'paid',
          metadata: {
            order_id: 'test-order-id',
            variant_id: 'test-variant-id',
            quantity: '1',
          },
          payment_intent: 'pi_test_error',
        } as Stripe.Checkout.Session,
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_error',
        idempotency_key: null,
      },
      type: 'checkout.session.completed',
    }
    
    mockConstructEvent.mockReturnValue(testEvent)

    // Mock database error
    mockSupabase.update.mockRejectedValueOnce(new Error('Database connection failed'))

    const request = new NextRequest('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify(testEvent),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Webhook processing failed')
  })
})
