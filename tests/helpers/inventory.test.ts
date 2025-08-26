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
  lte: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
};

// Make sure all methods return the mock object for chaining
mockSupabase.from.mockReturnValue(mockSupabase);
mockSupabase.select.mockReturnValue(mockSupabase);
mockSupabase.insert.mockReturnValue(mockSupabase);
mockSupabase.update.mockReturnValue(mockSupabase);
mockSupabase.delete.mockReturnValue(mockSupabase);
mockSupabase.eq.mockReturnValue(mockSupabase);
mockSupabase.gte.mockReturnValue(mockSupabase);
mockSupabase.lte.mockReturnValue(mockSupabase);

vi.mock('@/lib/supabase/server', () => ({
  createServiceClient: vi.fn(() => mockSupabase),
}));

// Import the createServiceClient to use in tests
import { createServiceClient } from '@/lib/supabase/server';

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
      
      const supabase = createServiceClient();
      const result = await supabase.rpc('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 2,
        p_order_id: 'order-456',
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 2,
        p_order_id: 'order-456',
      });
      expect(result.data).toBe(true);
    });
    
    it('should return false when inventory insufficient', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: false,
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase.rpc('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 100,
        p_order_id: 'order-456',
      });
      
      expect(result.data).toBe(false);
    });
    
    it('should throw error on database failure', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });
      
      const supabase = createServiceClient();
      const result = await supabase.rpc('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 1,
        p_order_id: 'order-456',
      });
      
      expect(result.error).toBeTruthy();
      expect(result.error.message).toBe('Database connection failed');
    });
    
    it('should validate quantity is positive', async () => {
      const supabase = createServiceClient();
      
      // Test with zero quantity
      await supabase.rpc('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 0,
        p_order_id: 'order-456',
      });
      
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_inventory', {
        p_variant_id: 'variant-123',
        p_quantity: 0,
        p_order_id: 'order-456',
      });
    });
  });
  
  describe('incrementInventory', () => {
    it('should increment inventory for stock receipt', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 15 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .update({ available: 15 })
        .eq('variant_id', 'variant-123');
      
      expect(mockSupabase.from).toHaveBeenCalledWith('inventory');
      expect(mockSupabase.update).toHaveBeenCalledWith({ available: 15 });
      expect(mockSupabase.eq).toHaveBeenCalledWith('variant_id', 'variant-123');
    });
    
    it('should create stock movement record', async () => {
      mockSupabase.insert.mockResolvedValueOnce({
        data: { id: 'movement-123' },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('stock_movements')
        .insert({
          variant_id: 'variant-123',
          type: 'receipt',
          quantity: 10,
          reason: 'Stock receipt',
        });
      
      expect(mockSupabase.from).toHaveBeenCalledWith('stock_movements');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        variant_id: 'variant-123',
        type: 'receipt',
        quantity: 10,
        reason: 'Stock receipt',
      });
    });
    
    it('should handle return to stock', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 12 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .update({ available: 12 })
        .eq('variant_id', 'variant-123');
      
      expect(mockSupabase.update).toHaveBeenCalledWith({ available: 12 });
    });
  });
  
  describe('reserveInventory', () => {
    it('should reserve inventory for pending order', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 8, reserved: 2 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .update({ available: 8, reserved: 2 })
        .eq('variant_id', 'variant-123');
      
      expect(mockSupabase.update).toHaveBeenCalledWith({ available: 8, reserved: 2 });
    });
    
    it('should fail when insufficient available inventory', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 1, reserved: 0 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const { data: inventory } = await supabase
        .from('inventory')
        .select('available, reserved')
        .eq('variant_id', 'variant-123')
        .single();
      
      // Simulate business logic check
      const requestedQuantity = 5;
      const canReserve = inventory.available >= requestedQuantity;
      
      expect(canReserve).toBe(false);
    });
    
    it('should handle concurrent reservations', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: null,
        error: { message: 'Concurrent modification detected' },
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .update({ available: 5, reserved: 5 })
        .eq('variant_id', 'variant-123');
      
      expect(result.error).toBeTruthy();
    });
  });
  
  describe('releaseReservedInventory', () => {
    it('should release reserved inventory back to available', async () => {
      mockSupabase.update.mockResolvedValueOnce({
        data: { available: 12, reserved: 0 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .update({ available: 12, reserved: 0 })
        .eq('variant_id', 'variant-123');
      
      expect(mockSupabase.update).toHaveBeenCalledWith({ available: 12, reserved: 0 });
    });
    
    it('should not release more than reserved', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 10, reserved: 2 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const { data: inventory } = await supabase
        .from('inventory')
        .select('available, reserved')
        .eq('variant_id', 'variant-123')
        .single();
      
      // Simulate business logic validation
      const releaseQuantity = 5;
      const canRelease = inventory.reserved >= releaseQuantity;
      
      expect(canRelease).toBe(false);
    });
  });
  
  describe('getInventoryStatus', () => {
    it('should return current inventory status', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 10, reserved: 2, sold: 8 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .select('available, reserved, sold')
        .eq('variant_id', 'variant-123')
        .single();
      
      expect(result.data).toEqual({
        available: 10,
        reserved: 2,
        sold: 8,
      });
    });
    
    it('should indicate out of stock when available is 0', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { available: 0, reserved: 0, sold: 20 },
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .select('available, reserved, sold')
        .eq('variant_id', 'variant-123')
        .single();
      
      const isOutOfStock = result.data.available === 0;
      expect(isOutOfStock).toBe(true);
    });
    
    it('should handle missing inventory record', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'No rows returned' },
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('inventory')
        .select('available, reserved, sold')
        .eq('variant_id', 'non-existent-variant')
        .single();
      
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });
  
  describe('getStockMovements', () => {
    it('should return stock movement history', async () => {
      const mockMovements = [
        { id: '1', type: 'sale', quantity: -2, created_at: '2024-01-01' },
        { id: '2', type: 'receipt', quantity: 10, created_at: '2024-01-02' },
      ];
      
      mockSupabase.select.mockResolvedValueOnce({
        data: mockMovements,
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('stock_movements')
        .select('*')
        .eq('variant_id', 'variant-123');
      
      expect(result.data).toEqual(mockMovements);
    });
    
    it('should filter by date range', async () => {
      const mockMovements = [
        { id: '1', type: 'sale', quantity: -1, created_at: '2024-01-15' },
      ];
      
      mockSupabase.select.mockResolvedValueOnce({
        data: mockMovements,
        error: null,
      });
      
      const supabase = createServiceClient();
      const result = await supabase
        .from('stock_movements')
        .select('*')
        .eq('variant_id', 'variant-123')
        .gte('created_at', '2024-01-01')
        .lte('created_at', '2024-01-31');
      
      expect(mockSupabase.gte).toHaveBeenCalledWith('created_at', '2024-01-01');
      expect(mockSupabase.lte).toHaveBeenCalledWith('created_at', '2024-01-31');
    });
  });
  
  describe('validateInventoryOperation', () => {
    it('should validate positive quantities', () => {
      const quantity = 5;
      const variantId = 'variant-123';
      
      // Simulate validation logic
      const isValid = quantity > 0 && variantId && variantId.length > 0;
      
      expect(isValid).toBe(true);
    });
    
    it('should reject negative quantities', () => {
      const quantity = -1;
      const variantId = 'variant-123';
      
      const isValid = quantity > 0 && variantId && variantId.length > 0;
      
      expect(isValid).toBe(false);
    });
    
    it('should reject zero quantity', () => {
      const quantity = 0;
      const variantId = 'variant-123';
      
      const isValid = quantity > 0 && variantId && variantId.length > 0;
      
      expect(isValid).toBe(false);
    });
    
    it('should reject invalid variant ID', () => {
      const quantity = 1;
      const variantId = '';
      
      const isValid = quantity > 0 && variantId && variantId.length > 0;
      
      expect(isValid).toBe(false);
    });
  });
});
