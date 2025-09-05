import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/checkout/route'

// Mock Stripe
const mockStripeCreate = vi.fn()

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: mockStripeCreate,
      },
    },
  })),
  STRIPE_CONFIG: {
    currency: 'aud',
    shippingOptions: [],
    allowedCountries: ['AU'],
  },
}))

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}))

// Mock audit logger
vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: vi.fn(),
  createPaymentAuditLog: vi.fn(() => ({})),
}))

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-123',
}))

describe('/api/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default successful mocks (first single(): variant fetch)
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant-id',
        name: 'Test Variant',
        price: 45.00,
        product: {
          id: 'test-product-id',
          title: 'Test Product',
          artist: 'Test Artist',
          active: true,
          image: 'https://i.ytimg.com/vi/i6HMFBQAKrc/oardefault.jpg?sqp=-oaymwEYCJUDENAFSFqQAgHyq4qpAwcIARUAAIhC&rs=AOn4CLBw0e47tNMIxIEp3lg6BBEouFWuxA',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })
    
    // Second single(): order insert returning
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-uuid-123',
        order_number: 'ORR-123456',
        status: 'pending',
        payment_status: 'pending',
        subtotal: 45.00,
        total: 45.00,
        currency: 'aud',
      },
      error: null,
    })
    
    mockStripeCreate.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
      expires_at: Math.floor(Date.now() / 1000) + 1800,
    })
  })

  it('should validate required parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid variant_id or quantity')
  })

  it('should validate quantity is positive', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 0,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid variant_id or quantity')
  })

  it('should handle variant not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'No rows returned' },
    })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'non-existent-variant',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Product variant not found')
  })

  it('should handle inactive product', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant-id',
        name: 'Test Variant',
        price: 45.00,
        product: {
          id: 'test-product-id',
          title: 'Test Product',
          artist: 'Test Artist',
          active: false, // Inactive product
          image: 'https://i.ytimg.com/vi/LMWaDzGb0jE/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLDxGbR3gqwHEYq2h9gFuaP2BFQpZA',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Product is not available for purchase')
  })

  it('should handle insufficient inventory', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: 'test-variant-id',
        name: 'Test Variant',
        price: 45.00,
        product: {
          id: 'test-product-id',
          title: 'Test Product',
          artist: 'Test Artist',
          active: true,
          image: 'https://i.ytimg.com/vi/niiynXOXw30/sddefault.jpg',
        },
        inventory: {
          available: 2, // Less than requested quantity
        },
      },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 5,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Insufficient inventory available')
  })

  it('should create checkout session successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('checkoutUrl')
    expect(data).toHaveProperty('sessionId')
    expect(data).toHaveProperty('orderId')
    expect(data.checkoutUrl).toBe('https://checkout.stripe.com/test')
    expect(data.sessionId).toBe('cs_test_123')
    expect(data.orderId).toBe('test-uuid-123')

    // Verify Stripe session was created with correct parameters
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              currency: 'aud',
              product_data: expect.objectContaining({
                name: 'Test Product - Test Variant',
                description: 'By Test Artist',
                images: ['https://example.com/image.jpg'],
                metadata: {
                  variant_id: 'test-variant-id',
                  product_id: 'test-product-id',
                },
              }),
              unit_amount: 4500, // 45.00 * 100
            }),
            quantity: 1,
          }),
        ],
        mode: 'payment',
        automatic_tax: { enabled: true },
        shipping_address_collection: { allowed_countries: ['AU'] },
        billing_address_collection: 'required',
        phone_number_collection: { enabled: true },
        metadata: {
          order_id: 'test-uuid-123',
          variant_id: 'test-variant-id',
          quantity: '1',
        },
      }),
      expect.objectContaining({
        idempotencyKey: expect.stringMatching(/^checkout_test-uuid-123_\d+$/),
      })
    )
  })

  it('should handle order creation failure', async () => {
    mockSupabase.insert.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create order')
  })

  it('should calculate correct amounts', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 2,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    
    // Check that the correct amount was passed to Stripe (in cents)
    expect(mockStripeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: 4500, // 45.00 * 100
            }),
            quantity: 2,
          }),
        ],
      }),
      expect.any(Object)
    )

    // Check that order was created with correct totals
    expect(mockSupabase.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal: 90.00, // 45.00 * 2
        total: 90.00,
        metadata: expect.objectContaining({
          variant_id: 'test-variant-id',
          quantity: 2,
        }),
      })
    )
  })

  it('should handle Stripe session creation failure', async () => {
    mockStripeCreate.mockRejectedValueOnce(new Error('Stripe API error'))

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create checkout session')
  })

  it('should handle order item creation failure', async () => {
    // Mock successful order creation but failed order item creation
    mockSupabase.insert
      .mockResolvedValueOnce({
        data: {
          id: 'test-uuid-123',
          order_number: 'ORR-123456',
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed to create order item' },
      })

    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to create order items')
    
    // Should have attempted to clean up the order
    expect(mockSupabase.delete).toHaveBeenCalled()
  })

  it('should update order with Stripe session details', async () => {
    const request = new NextRequest('http://localhost:3000/api/checkout', {
      method: 'POST',
      body: JSON.stringify({
        variant_id: 'test-variant-id',
        quantity: 1,
      }),
    })

    const response = await POST(request)
    
    expect(response.status).toBe(200)
    
    // Should update order with Stripe session ID
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_session_id: 'cs_test_123',
        metadata: expect.objectContaining({
          stripe_session_url: 'https://checkout.stripe.com/test',
          stripe_session_expires_at: expect.any(Number),
        }),
      })
    )
  })
})
