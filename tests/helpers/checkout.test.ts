import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Stripe
const mockStripeCreate = vi.fn().mockResolvedValue({
  id: 'cs_test_123',
  url: 'https://checkout.stripe.com/test',
  expires_at: Math.floor(Date.now() / 1000) + 1800,
});

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockStripeCreate,
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

// Mock Supabase
const mockSupabaseClient = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({
    data: {
      id: 'test-variant-id',
      price: 45.00,
      name: 'Test Variant',
      product: {
        id: 'test-product-id',
        title: 'Test Product',
        artist: 'Test Artist',
        active: true,
        image: 'https://i.ytimg.com/vi/niiynXOXw30/sddefault.jpg',
      },
      inventory: {
        available: 10,
      },
    },
    error: null,
  }),
  rpc: vi.fn().mockResolvedValue({
    data: true,
    error: null,
  }),
};

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(),
}));

// Mock audit logger
vi.mock('@/lib/audit-logger', () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  createPaymentAuditLog: vi.fn().mockReturnValue({}),
}));

// Import the actual API handler
import { POST } from '@/app/api/checkout/route';
import { createServiceClient } from '@/lib/supabase/server';

describe('Checkout API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up the Supabase client mock
    vi.mocked(createServiceClient).mockReturnValue(mockSupabaseClient);
    
    // Reset default mock behavior
    mockSupabaseClient.single.mockResolvedValue({
      data: {
        id: 'test-variant-id',
        price: 45.00,
        name: 'Test Variant',
        product: {
          id: 'test-product-id',
          title: 'Test Product',
          artist: 'Test Artist',
          active: true,
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Consumer_Reports_-_product_testing_-_electric_light_longevity_and_brightness_testing.tif/lossless-page1-1200px-Consumer_Reports_-_product_testing_-_electric_light_longevity_and_brightness_testing.tif.png',
        },
        inventory: {
          available: 10,
        },
      },
      error: null,
    });
    
    mockSupabaseClient.insert.mockResolvedValue({
      data: {
        id: 'test-order-id',
        order_number: 'ORR-123456',
        status: 'pending',
        payment_status: 'pending',
        subtotal: 45.00,
        total: 45.00,
        currency: 'aud',
        metadata: {
          variant_id: 'test-variant-id',
          quantity: 1,
          created_via: 'api',
        },
      },
      error: null,
    });
  });

  describe('validateCheckoutRequest', () => {
    it('should validate variant_id and quantity', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('checkoutUrl');
      expect(data).toHaveProperty('sessionId');
    });
    
    it('should reject missing variant_id', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid variant_id or quantity');
    });
    
    it('should reject invalid quantity', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 0,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid variant_id or quantity');
    });
    
    it('should reject negative quantity', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: -1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid variant_id or quantity');
    });
  });
  
  describe('checkInventoryAvailability', () => {
    it('should handle sufficient inventory', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 5,
        }),
      });
      
      const response = await POST(request);
      expect(response.status).toBe(200);
    });
    
    it('should handle insufficient inventory', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 20,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient inventory available');
    });
    
    it('should handle zero inventory', async () => {
      // Mock zero inventory
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'test-variant-id',
          price: 45.00,
          name: 'Test Variant',
          product: {
            id: 'test-product-id',
            title: 'Test Product',
            artist: 'Test Artist',
            active: true,
          },
          inventory: {
            available: 0,
          },
        },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Insufficient inventory available');
    });
  });

  describe('product validation', () => {
    it('should handle variant not found', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Variant not found' },
      });
      
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'non-existent-variant',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(404);
      expect(data.error).toBe('Product variant not found');
    });
    
    it('should handle inactive product', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: 'test-variant-id',
          price: 45.00,
          name: 'Test Variant',
          product: {
            id: 'test-product-id',
            title: 'Test Product',
            artist: 'Test Artist',
            active: false, // Inactive product
          },
          inventory: {
            available: 10,
          },
        },
        error: null,
      });
      
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(400);
      expect(data.error).toBe('Product is not available for purchase');
    });
  });

  describe('order creation', () => {
    it('should create checkout session successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('checkoutUrl');
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('orderId');
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'aud',
                unit_amount: 4500, // 45.00 * 100
              }),
              quantity: 1,
            }),
          ]),
          mode: 'payment',
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^checkout_test-order-id_\d+$/),
        })
      );
    });
    
    it('should handle order creation failure', async () => {
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });
      
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 1,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create order');
    });
    
    it('should calculate correct amounts', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify({
          variant_id: 'test-variant-id',
          quantity: 2,
        }),
      });
      
      const response = await POST(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(mockStripeCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 4500, // 45.00 * 100
              }),
              quantity: 2,
            }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });
});
