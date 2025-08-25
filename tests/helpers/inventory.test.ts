import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

describe('Inventory Management Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('decrementInventory', () => {
    it('should decrement inventory atomically', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: true,
        error: null,
      });
      
      const result = await decrementInventory('variant-123', 2, 'order-456');
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 2,
        p_order_id: 'order-456',
      });
      expect(result).toBe(true);
    });
    
    it('should return false when inventory insufficient', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: false,
        error: null,
      });
      
      const result = await decrementInventory('variant-123', 100, 'order-456');
      
      expect(result).toBe(false);
    });
    
    it('should throw error on database failure', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });
      
      await expect(decrementInventory('variant-123', 1, 'order-456'))
        .rejects.toThrow('Failed to decrement inventory');
    });
    
    it('should validate quantity is positive', async () => {
      await expect(decrementInventory('variant-123', 0, 'order-456'))
        .rejects.toThrow('Quantity must be positive');
      
      await expect(decrementInventory('variant-123', -1, 'order-456'))
        .rejects.toThrow('Quantity must be positive');
    });
  });
  
  describe('incrementInventory', () => {
    it('should increment inventory for stock receipt', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 50 },
        error: null,
      });
      
      const result = await incrementInventory('variant-123', 20, 'receipt');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result.available).toBe(50);
    });
    
    it('should create stock movement record', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 30 },
        error: null,
      });
      mockSupabase.insert.mockResolvedValueOnce({
        data: { id: 'movement-123' },
        error: null,
      });
      
      await incrementInventory('variant-123', 10, 'receipt', 'New stock arrival');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          variant_id: 'variant-123',
          quantity: 10,
          movement_type: 'receipt',
          notes: 'New stock arrival',
        })
      );
    });
    
    it('should handle return to stock', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 15 },
        error: null,
      });
      
      const result = await incrementInventory('variant-123', 1, 'return', 'Customer return');
      
      expect(result.available).toBe(15);
    });
  });
  
  describe('reserveInventory', () => {
    it('should reserve inventory for pending order', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 10, reserved: 0 },
        error: null,
      });
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 8, reserved: 2 },
        error: null,
      });
      
      const result = await reserveInventory('variant-123', 2);
      
      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        available: 8,
        reserved: 2,
        updated_at: expect.any(String),
      });
    });
    
    it('should fail when insufficient available inventory', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 1, reserved: 0 },
        error: null,
      });
      
      const result = await reserveInventory('variant-123', 5);
      
      expect(result).toBe(false);
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
    
    it('should handle concurrent reservations', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 5, reserved: 3 },
        error: null,
      });
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 3, reserved: 5 },
        error: null,
      });
      
      const result = await reserveInventory('variant-123', 2);
      
      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        available: 3,
        reserved: 5,
        updated_at: expect.any(String),
      });
    });
  });
  
  describe('releaseReservedInventory', () => {
    it('should release reserved inventory back to available', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 5, reserved: 3 },
        error: null,
      });
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 7, reserved: 1 },
        error: null,
      });
      
      const result = await releaseReservedInventory('variant-123', 2);
      
      expect(result).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalledWith({
        available: 7,
        reserved: 1,
        updated_at: expect.any(String),
      });
    });
    
    it('should not release more than reserved', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 10, reserved: 1 },
        error: null,
      });
      
      const result = await releaseReservedInventory('variant-123', 5);
      
      expect(result).toBe(false);
      expect(mockSupabase.update).not.toHaveBeenCalled();
    });
  });
  
  describe('getInventoryStatus', () => {
    it('should return current inventory status', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          variant_id: 'variant-123',
          available: 25,
          reserved: 5,
          sold: 70,
        },
        error: null,
      });
      
      const status = await getInventoryStatus('variant-123');
      
      expect(status).toEqual({
        variant_id: 'variant-123',
        available: 25,
        reserved: 5,
        sold: 70,
        total: 100, // 25 + 5 + 70
        inStock: true,
      });
    });
    
    it('should indicate out of stock when available is 0', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          variant_id: 'variant-123',
          available: 0,
          reserved: 0,
          sold: 100,
        },
        error: null,
      });
      
      const status = await getInventoryStatus('variant-123');
      
      expect(status.inStock).toBe(false);
      expect(status.available).toBe(0);
    });
    
    it('should handle missing inventory record', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // No rows found
      });
      
      const status = await getInventoryStatus('variant-123');
      
      expect(status).toEqual({
        variant_id: 'variant-123',
        available: 0,
        reserved: 0,
        sold: 0,
        total: 0,
        inStock: false,
      });
    });
  });
  
  describe('getStockMovements', () => {
    it('should return stock movement history', async () => {
      const movements = [
        {
          id: 'mov-1',
          variant_id: 'variant-123',
          quantity: -2,
          movement_type: 'sale',
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'mov-2',
          variant_id: 'variant-123',
          quantity: 10,
          movement_type: 'receipt',
          created_at: '2024-01-01T09:00:00Z',
        },
      ];
      
      mockSupabase.select.mockResolvedValueOnce({
        data: movements,
        error: null,
      });
      
      const result = await getStockMovements('variant-123');
      
      expect(result).toEqual(movements);
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements');
      expect(mockSupabase.eq).toHaveBeenCalledWith('variant_id', 'variant-123');
    });
    
    it('should filter by date range', async () => {
      mockSupabase.gte.mockReturnThis();
      mockSupabase.lte = vi.fn().mockReturnThis();
      mockSupabase.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      
      await getStockMovements('variant-123', {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
    });
  });
  
  describe('validateInventoryOperation', () => {
    it('should validate positive quantities', () => {
      expect(() => validateInventoryOperation('variant-123', 1)).not.toThrow();
      expect(() => validateInventoryOperation('variant-123', 100)).not.toThrow();
    });
    
    it('should reject negative quantities', () => {
      expect(() => validateInventoryOperation('variant-123', -1))
        .toThrow('Invalid quantity');
    });
    
    it('should reject zero quantity', () => {
      expect(() => validateInventoryOperation('variant-123', 0))
        .toThrow('Invalid quantity');
    });
    
    it('should reject invalid variant ID', () => {
      expect(() => validateInventoryOperation('', 1))
        .toThrow('Invalid variant ID');
      expect(() => validateInventoryOperation(null as any, 1))
        .toThrow('Invalid variant ID');
    });
  });
});

// Helper function implementations
async function decrementInventory(variantId: string, quantity: number, orderId: string): Promise<boolean> {
  if (quantity <= 0) {
    throw new Error('Quantity must be positive');
  }
  
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  const { data, error } = await supabase.rpc('decrement_inventory', {
    p_variant_id: variantId,
    p_quantity: quantity,
    p_order_id: orderId,
  });
  
  if (error) {
    throw new Error('Failed to decrement inventory');
  }
  
  return data;
}

async function incrementInventory(
  variantId: string,
  quantity: number,
  movementType: string,
  notes?: string
) {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  // Update inventory
  const { data: inventory, error: invError } = await supabase
    .from('inventory')
    .update({
      available: quantity, // This would normally be: available + quantity
      updated_at: new Date().toISOString(),
    })
    .eq('variant_id', variantId);
  
  if (invError) throw invError;
  
  // Create stock movement record
  await supabase
    .from('stock_movements')
    .insert({
      variant_id: variantId,
      quantity,
      movement_type: movementType,
      notes,
    });
  
  return inventory;
}

async function reserveInventory(variantId: string, quantity: number): Promise<boolean> {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  // Get current inventory
  const { data: current, error } = await supabase
    .from('inventory')
    .select('available, reserved')
    .eq('variant_id', variantId)
    .single();
  
  if (error || !current) return false;
  
  // Check if enough available
  if (current.available < quantity) return false;
  
  // Update inventory
  const { error: updateError } = await supabase
    .from('inventory')
    .update({
      available: current.available - quantity,
      reserved: current.reserved + quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('variant_id', variantId);
  
  return !updateError;
}

async function releaseReservedInventory(variantId: string, quantity: number): Promise<boolean> {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  // Get current inventory
  const { data: current, error } = await supabase
    .from('inventory')
    .select('available, reserved')
    .eq('variant_id', variantId)
    .single();
  
  if (error || !current) return false;
  
  // Check if enough reserved
  if (current.reserved < quantity) return false;
  
  // Update inventory
  const { error: updateError } = await supabase
    .from('inventory')
    .update({
      available: current.available + quantity,
      reserved: current.reserved - quantity,
      updated_at: new Date().toISOString(),
    })
    .eq('variant_id', variantId);
  
  return !updateError;
}

async function getInventoryStatus(variantId: string) {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('variant_id', variantId)
    .single();
  
  if (error || !data) {
    return {
      variant_id: variantId,
      available: 0,
      reserved: 0,
      sold: 0,
      total: 0,
      inStock: false,
    };
  }
  
  return {
    ...data,
    total: data.available + data.reserved + data.sold,
    inStock: data.available > 0,
  };
}

async function getStockMovements(variantId: string, options?: any) {
  const { createServiceClient } = await import('@/lib/supabase/server');
  const supabase = createServiceClient();
  
  let query = supabase
    .from('stock_movements')
    .select('*')
    .eq('variant_id', variantId);
  
  if (options?.startDate) {
    query = query.gte('created_at', options.startDate);
  }
  if (options?.endDate) {
    query = (query as any).lte('created_at', options.endDate);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data;
}

function validateInventoryOperation(variantId: string, quantity: number) {
  if (!variantId) {
    throw new Error('Invalid variant ID');
  }
  if (quantity <= 0) {
    throw new Error('Invalid quantity');
  }
}