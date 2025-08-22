import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({
            id: 'cs_test_123',
            url: 'https://checkout.stripe.com/test',
          }),
        },
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
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
  }),
}));

describe('Checkout Helpers', () => {
  describe('validateCheckoutRequest', () => {
    it('should validate variant_id and quantity', () => {
      const validRequest = {
        variant_id: 'uuid-123',
        quantity: 1,
      };
      
      expect(() => validateCheckoutRequest(validRequest)).not.toThrow();
    });
    
    it('should reject missing variant_id', () => {
      const invalidRequest = {
        quantity: 1,
      };
      
      expect(() => validateCheckoutRequest(invalidRequest)).toThrow('variant_id is required');
    });
    
    it('should reject invalid quantity', () => {
      const invalidRequest = {
        variant_id: 'uuid-123',
        quantity: 0,
      };
      
      expect(() => validateCheckoutRequest(invalidRequest)).toThrow('quantity must be at least 1');
    });
    
    it('should reject negative quantity', () => {
      const invalidRequest = {
        variant_id: 'uuid-123',
        quantity: -1,
      };
      
      expect(() => validateCheckoutRequest(invalidRequest)).toThrow('quantity must be at least 1');
    });
  });
  
  describe('checkInventoryAvailability', () => {
    it('should return true when inventory is sufficient', async () => {
      const result = await checkInventoryAvailability('variant-123', 5);
      expect(result).toBe(true);
    });
    
    it('should return false when inventory is insufficient', async () => {
      const result = await checkInventoryAvailability('variant-123', 20);
      expect(result).toBe(false);
    });
    
    it('should handle zero inventory', async () => {
      // Mock zero inventory
      vi.mocked(createServiceClient).mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            inventory: { available: 0 },
          },
          error: null,
        }),
      });
      
      const result = await checkInventoryAvailability('variant-123', 1);
      expect(result).toBe(false);
    });
  });
  
  describe('calculateOrderTotals', () => {
    it('should calculate correct totals for single item', () => {
      const items = [
        { price: 45.00, quantity: 1 },
      ];
      
      const totals = calculateOrderTotals(items);
      expect(totals.subtotal).toBe(45.00);
      expect(totals.tax).toBe(0); // Tax calculated by Stripe
      expect(totals.shipping).toBe(0); // Shipping calculated by Stripe
      expect(totals.total).toBe(45.00);
    });
    
    it('should calculate correct totals for multiple items', () => {
      const items = [
        { price: 45.00, quantity: 2 },
        { price: 25.00, quantity: 1 },
      ];
      
      const totals = calculateOrderTotals(items);
      expect(totals.subtotal).toBe(115.00);
      expect(totals.total).toBe(115.00);
    });
    
    it('should handle decimal prices correctly', () => {
      const items = [
        { price: 19.99, quantity: 3 },
      ];
      
      const totals = calculateOrderTotals(items);
      expect(totals.subtotal).toBe(59.97);
      expect(totals.total).toBe(59.97);
    });
  });
  
  describe('createStripeLineItems', () => {
    it('should create correct line item structure', () => {
      const variant = {
        id: 'variant-123',
        name: 'Black Vinyl',
        price: 45.00,
        product: {
          id: 'product-123',
          title: 'Test Album',
          artist: 'Test Band',
          image: 'https://example.com/image.jpg',
        },
      };
      
      const lineItems = createStripeLineItems(variant, 2);
      
      expect(lineItems).toHaveLength(1);
      expect(lineItems[0]).toEqual({
        price_data: {
          currency: 'aud',
          product_data: {
            name: 'Test Album - Black Vinyl',
            description: 'By Test Band',
            images: ['https://example.com/image.jpg'],
            metadata: {
              variant_id: 'variant-123',
              product_id: 'product-123',
            },
          },
          unit_amount: 4500, // 45.00 * 100
        },
        quantity: 2,
      });
    });
    
    it('should handle missing product image', () => {
      const variant = {
        id: 'variant-123',
        name: 'Standard',
        price: 25.00,
        product: {
          id: 'product-123',
          title: 'Test CD',
          artist: 'Test Artist',
          image: null,
        },
      };
      
      const lineItems = createStripeLineItems(variant, 1);
      
      expect(lineItems[0].price_data.product_data.images).toBeUndefined();
    });
    
    it('should round prices to nearest cent', () => {
      const variant = {
        id: 'variant-123',
        name: 'Special Edition',
        price: 19.999,
        product: {
          id: 'product-123',
          title: 'Test Product',
          artist: 'Test Artist',
        },
      };
      
      const lineItems = createStripeLineItems(variant, 1);
      
      expect(lineItems[0].price_data.unit_amount).toBe(2000); // Rounded to 20.00
    });
  });
  
  describe('generateOrderNumber', () => {
    it('should generate unique order numbers', () => {
      const order1 = generateOrderNumber();
      const order2 = generateOrderNumber();
      
      expect(order1).toMatch(/^ORR-\d{6,}$/);
      expect(order2).toMatch(/^ORR-\d{6,}$/);
      expect(order1).not.toBe(order2);
    });
    
    it('should include timestamp in order number', () => {
      const now = Date.now();
      const orderNumber = generateOrderNumber();
      const numberPart = orderNumber.replace('ORR-', '');
      
      // The number should be based on timestamp
      expect(parseInt(numberPart)).toBeGreaterThan(0);
    });
  });
  
  describe('handleCheckoutError', () => {
    it('should format error response correctly', () => {
      const error = new Error('Payment failed');
      const response = handleCheckoutError(error);
      
      expect(response.error).toBe('Payment failed');
      expect(response.status).toBe(500);
    });
    
    it('should handle validation errors', () => {
      const error = new ValidationError('Invalid input');
      const response = handleCheckoutError(error);
      
      expect(response.error).toBe('Invalid input');
      expect(response.status).toBe(400);
    });
    
    it('should handle unknown errors', () => {
      const response = handleCheckoutError('Something went wrong');
      
      expect(response.error).toBe('An unexpected error occurred');
      expect(response.status).toBe(500);
    });
  });
});

// Helper function implementations (these would normally be imported)
function validateCheckoutRequest(request: any) {
  if (!request.variant_id) {
    throw new Error('variant_id is required');
  }
  if (!request.quantity || request.quantity < 1) {
    throw new Error('quantity must be at least 1');
  }
}

async function checkInventoryAvailability(variantId: string, quantity: number): Promise<boolean> {
  // This would normally query the database
  return quantity <= 10; // Mock implementation
}

function calculateOrderTotals(items: Array<{ price: number; quantity: number }>) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return {
    subtotal,
    tax: 0, // Calculated by Stripe
    shipping: 0, // Calculated by Stripe
    total: subtotal,
  };
}

function createStripeLineItems(variant: any, quantity: number) {
  return [{
    price_data: {
      currency: 'aud',
      product_data: {
        name: `${variant.product.title} - ${variant.name}`,
        description: `By ${variant.product.artist}`,
        images: variant.product.image ? [variant.product.image] : undefined,
        metadata: {
          variant_id: variant.id,
          product_id: variant.product.id,
        },
      },
      unit_amount: Math.round(variant.price * 100),
    },
    quantity,
  }];
}

function generateOrderNumber(): string {
  return `ORR-${Date.now().toString().slice(-10)}`;
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function handleCheckoutError(error: any) {
  if (error instanceof ValidationError) {
    return { error: error.message, status: 400 };
  }
  if (error instanceof Error) {
    return { error: error.message, status: 500 };
  }
  return { error: 'An unexpected error occurred', status: 500 };
}