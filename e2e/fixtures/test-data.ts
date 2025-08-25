import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test data fixtures for e2e tests
 */

// Initialize Supabase client for test data setup
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL_STAGING || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY_1 || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_1 || '';

export const supabaseClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

/**
 * Test product data
 */
export const TEST_PRODUCTS = {
  vinyl: {
    id: uuidv4(),
    title: 'Test Vinyl - Dark Rituals',
    artist: 'Test Band',
    description: 'Limited edition test vinyl for e2e testing',
    price: 45.00,
    stock: 100,
    category: 'vinyl',
    active: true,
    image: '/placeholder.svg',
    metadata: {
      test: true,
      created_for: 'e2e',
    },
  },
  cd: {
    id: uuidv4(),
    title: 'Test CD - Ancient Spells',
    artist: 'Test Artist',
    description: 'Test CD for e2e testing',
    price: 25.00,
    stock: 50,
    category: 'cd',
    active: true,
    image: '/placeholder.svg',
    metadata: {
      test: true,
      created_for: 'e2e',
    },
  },
  outOfStock: {
    id: uuidv4(),
    title: 'Out of Stock Item',
    artist: 'Unavailable Band',
    description: 'This item is out of stock',
    price: 100.00,
    stock: 0,
    category: 'vinyl',
    active: true,
    image: '/placeholder.svg',
    metadata: {
      test: true,
      created_for: 'e2e',
    },
  },
  inactive: {
    id: uuidv4(),
    title: 'Inactive Product',
    artist: 'Disabled Band',
    description: 'This product is inactive',
    price: 50.00,
    stock: 10,
    category: 'vinyl',
    active: false,
    image: '/placeholder.svg',
    metadata: {
      test: true,
      created_for: 'e2e',
    },
  },
};

/**
 * Test variant data
 */
export const TEST_VARIANTS = {
  vinyl_black: {
    id: uuidv4(),
    product_id: TEST_PRODUCTS.vinyl.id,
    name: 'Black Vinyl',
    sku: 'TEST-VINYL-BLACK-001',
    price: 45.00,
    metadata: {
      color: 'black',
      test: true,
    },
  },
  vinyl_red: {
    id: uuidv4(),
    product_id: TEST_PRODUCTS.vinyl.id,
    name: 'Red Vinyl',
    sku: 'TEST-VINYL-RED-001',
    price: 55.00,
    metadata: {
      color: 'red',
      limited: true,
      test: true,
    },
  },
  cd_standard: {
    id: uuidv4(),
    product_id: TEST_PRODUCTS.cd.id,
    name: 'Standard Edition',
    sku: 'TEST-CD-STD-001',
    price: 25.00,
    metadata: {
      test: true,
    },
  },
  out_of_stock: {
    id: uuidv4(),
    product_id: TEST_PRODUCTS.outOfStock.id,
    name: 'Standard',
    sku: 'TEST-OOS-001',
    price: 100.00,
    metadata: {
      test: true,
    },
  },
  inactive: {
    id: uuidv4(),
    product_id: TEST_PRODUCTS.inactive.id,
    name: 'Standard',
    sku: 'TEST-INACTIVE-001',
    price: 50.00,
    metadata: {
      test: true,
    },
  },
};

/**
 * Test inventory data
 */
export const TEST_INVENTORY = {
  vinyl_black: {
    variant_id: TEST_VARIANTS.vinyl_black.id,
    available: 50,
    reserved: 0,
    sold: 0,
  },
  vinyl_red: {
    variant_id: TEST_VARIANTS.vinyl_red.id,
    available: 10,
    reserved: 0,
    sold: 0,
  },
  cd_standard: {
    variant_id: TEST_VARIANTS.cd_standard.id,
    available: 30,
    reserved: 0,
    sold: 0,
  },
  out_of_stock: {
    variant_id: TEST_VARIANTS.out_of_stock.id,
    available: 0,
    reserved: 0,
    sold: 50,
  },
  inactive: {
    variant_id: TEST_VARIANTS.inactive.id,
    available: 10,
    reserved: 0,
    sold: 0,
  },
};

/**
 * Test admin user
 */
export const TEST_ADMIN = {
  email: 'admin@grimforge.test',
  password: 'TestAdmin123!',
  role: 'admin',
};

/**
 * Setup test data in database
 */
export async function setupTestData() {
  try {
    // Insert test products
    const { error: productsError } = await supabaseClient
      .from('products')
      .upsert(Object.values(TEST_PRODUCTS), { onConflict: 'id' });
    
    if (productsError) {
      console.error('Failed to insert test products:', productsError);
      throw productsError;
    }

    // Insert test variants
    const { error: variantsError } = await supabaseClient
      .from('variants')
      .upsert(Object.values(TEST_VARIANTS), { onConflict: 'id' });
    
    if (variantsError) {
      console.error('Failed to insert test variants:', variantsError);
      throw variantsError;
    }

    // Insert test inventory
    const { error: inventoryError } = await supabaseClient
      .from('inventory')
      .upsert(Object.values(TEST_INVENTORY), { onConflict: 'variant_id' });
    
    if (inventoryError) {
      console.error('Failed to insert test inventory:', inventoryError);
      throw inventoryError;
    }

    console.log('Test data setup completed successfully');
    return true;
  } catch (error) {
    console.error('Failed to setup test data:', error);
    throw error;
  }
}

/**
 * Cleanup test data from database
 */
export async function cleanupTestData() {
  try {
    // Delete test orders first (due to foreign key constraints)
    const { error: ordersError } = await supabaseClient
      .from('orders')
      .delete()
      .or('metadata->test.eq.true,metadata->created_for.eq.e2e');
    
    if (ordersError) {
      console.error('Failed to delete test orders:', ordersError);
    }

    // Delete test inventory
    const { error: inventoryError } = await supabaseClient
      .from('inventory')
      .delete()
      .in('variant_id', Object.values(TEST_VARIANTS).map(v => v.id));
    
    if (inventoryError) {
      console.error('Failed to delete test inventory:', inventoryError);
    }

    // Delete test variants
    const { error: variantsError } = await supabaseClient
      .from('variants')
      .delete()
      .in('id', Object.values(TEST_VARIANTS).map(v => v.id));
    
    if (variantsError) {
      console.error('Failed to delete test variants:', variantsError);
    }

    // Delete test products
    const { error: productsError } = await supabaseClient
      .from('products')
      .delete()
      .in('id', Object.values(TEST_PRODUCTS).map(p => p.id));
    
    if (productsError) {
      console.error('Failed to delete test products:', productsError);
    }

    console.log('Test data cleanup completed');
    return true;
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
    // Don't throw here as cleanup should be best-effort
    return false;
  }
}

/**
 * Reset inventory for a specific variant
 */
export async function resetInventory(variantId: string, available: number) {
  const { error } = await supabaseClient
    .from('inventory')
    .update({ available, reserved: 0 })
    .eq('variant_id', variantId);
  
  if (error) {
    console.error('Failed to reset inventory:', error);
    throw error;
  }
}

/**
 * Get current inventory for a variant
 */
export async function getInventory(variantId: string) {
  const { data, error } = await supabaseClient
    .from('inventory')
    .select('available, reserved, sold')
    .eq('variant_id', variantId)
    .single();
  
  if (error) {
    console.error('Failed to get inventory:', error);
    throw error;
  }
  
  return data;
}

/**
 * Get order by ID
 */
export async function getOrder(orderId: string) {
  const { data, error } = await supabaseClient
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  
  if (error) {
    console.error('Failed to get order:', error);
    throw error;
  }
  
  return data;
}

/**
 * Create a test admin user
 */
export async function createTestAdmin() {
  // This would typically use Supabase Auth Admin API
  // For now, we assume the admin user exists in the test environment
  console.log('Test admin user should be pre-configured in test environment');
  return TEST_ADMIN;
}