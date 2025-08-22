import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/checkout/route'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'

// Mock dependencies
vi.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
  STRIPE_CONFIG: {
    currency: 'AUD',
    shippingOptions: [],
    allowedCountries: ['AU'],
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}))

vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: vi.fn(),
  createPaymentAuditLog: vi.fn(),
}))

vi.mock('uuid', () => ({
  v4: () => 'test-uuid',
}))

describe('/api/checkout', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    }
    
    vi.mocked(createServiceClient).mockReturnValue(mockSupabase)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should validate required parameters', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid variant_id or quantity')
  })

  it('should validate quantity is positive', async () => {
    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 0 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Invalid variant_id or quantity')
  })

  it('should handle variant not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Not found' },
    })

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'invalid-variant', quantity: 1 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.error).toBe('Product variant not found')
  })

  it('should handle inactive product', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant',
        price: 50,
        product: {
          active: false,
          title: 'Test Product',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 1 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Product is not available for purchase')
  })

  it('should handle insufficient inventory', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant',
        price: 50,
        product: {
          active: true,
          title: 'Test Product',
        },
        inventory: {
          available: 1,
        },
      },
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 5 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe('Insufficient inventory available')
  })

  it('should create checkout session successfully', async () => {
    // Mock variant fetch
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant',
        name: 'CD',
        price: 50,
        product: {
          id: 'test-product',
          active: true,
          title: 'Test Album',
          artist: 'Test Artist',
          image: 'https://example.com/image.jpg',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })

    // Mock order creation
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-order-id',
        order_number: 'ORR-123456',
        metadata: {},
      },
      error: null,
    })

    // Mock order item creation
    mockSupabase.insert.mockResolvedValueOnce({
      error: null,
    })

    // Mock Stripe session creation
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    } as any)

    // Mock order update
    mockSupabase.eq.mockResolvedValueOnce({
      error: null,
    })

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 2 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toHaveProperty('checkoutUrl')
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('orderId')
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_test_123')
    expect(data.sessionId).toBe('cs_test_123')

    // Verify Stripe session was created with correct parameters
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        automatic_tax: { enabled: true },
        line_items: [
          expect.objectContaining({
            quantity: 2,
            price_data: expect.objectContaining({
              currency: 'AUD',
              unit_amount: 5000, // $50 * 100 cents
              product_data: expect.objectContaining({
                name: 'Test Album - CD',
                description: 'By Test Artist',
              }),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringContaining('checkout_'),
      })
    )
  })

  it('should handle order creation failure', async () => {
    // Mock variant fetch
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant',
        price: 50,
        product: {
          active: true,
          title: 'Test Product',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })

    // Mock order creation failure
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 1 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe('Failed to create order')
  })

  it('should calculate correct amounts', async () => {
    // Mock variant fetch with specific price
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant',
        name: 'Vinyl',
        price: 75.50, // Testing decimal price
        product: {
          id: 'test-product',
          active: true,
          title: 'Test Album',
          artist: 'Test Artist',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })

    // Mock order creation
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-order-id',
        order_number: 'ORR-123456',
        metadata: {},
      },
      error: null,
    })

    // Mock order item creation
    mockSupabase.insert.mockResolvedValueOnce({
      error: null,
    })

    // Mock Stripe session creation
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValueOnce({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    } as any)

    const req = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ variant_id: 'test-variant', quantity: 3 }),
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    
    // Check that the correct amount was passed to Stripe (in cents)
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            quantity: 3,
            price_data: expect.objectContaining({
              unit_amount: 7550, // $75.50 * 100 cents
            }),
          }),
        ],
      }),
      expect.any(Object)
    )
  })
})