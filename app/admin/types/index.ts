// Admin Panel Type Definitions

export interface Product {
  id: string;
  title: string;
  artist: string;
  description: string | null;
  price: number;
  format: string;
  image: string | null;
  active: boolean;
  featured: boolean;
  limited: boolean;
  pre_order: boolean;
  stock: number;
  sku: string | null;
  tags: string[];
  release_year: number | null;
  created_at: string;
  updated_at: string;
}

export interface Variant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price: number;
  size?: string | null;
  color?: string | null;
  weight?: number | null;
  dimensions?: string | null;
  barcode?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  product?: Product;
  inventory?: Inventory;
}

export interface Inventory {
  id: string;
  variant_id: string;
  on_hand: number;
  allocated: number;
  available: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  updated_at: string;
  variant?: Variant;
}

export interface StockMovement {
  id: string;
  variant_id: string;
  quantity: number;
  movement_type: 'receipt' | 'sale' | 'adjustment' | 'return' | 'transfer';
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  user_id?: string | null;
  created_at: string;
  variant?: Variant;
}

export interface Order {
  id: string;
  customer_id?: string | null;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status?: string | null;
  total: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  currency: string;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  shipping_address?: Address;
  billing_address?: Address;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  total: number;
  created_at: string;
  order?: Order;
  variant?: Variant;
}

export interface Customer {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  stripe_customer_id?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  orders?: Order[];
  addresses?: Address[];
}

export interface Address {
  id: string;
  customer_id: string;
  type: 'billing' | 'shipping';
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface AuditLog {
  id: string;
  event_type: string;
  event_id?: string | null;
  user_id?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'staff';
  first_name?: string | null;
  last_name?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  background_video_url?: string | null;
  cta_primary_label?: string | null;
  cta_primary_href?: string | null;
  cta_secondary_label?: string | null;
  cta_secondary_href?: string | null;
  audio_preview_url?: string | null;
  layout: 'classic' | 'split' | 'minimal' | string;
  badge_text?: string | null;
  highlight_items?: string[] | null;
  active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  sort_order: number;
  revision_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignRevision {
  id: string;
  campaign_id: string;
  snapshot: Record<string, unknown>;
  created_by?: string | null;
  created_at: string;
}

// Form types for create/edit operations
export interface ProductFormValues {
  slug?: string;
  title: string;
  artist: string;
  description?: string;
  price: number;
  format: string;
  image?: string;
  active: boolean;
  featured: boolean;
  limited: boolean;
  pre_order: boolean;
  stock: number;
  sku?: string;
  tags: string[];
  release_year?: number;
}

export interface VariantFormValues {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  size?: string;
  color?: string;
  weight?: number;
  dimensions?: string;
  barcode?: string;
  active: boolean;
}

export interface ReceiveStockFormValues {
  variant_id: string;
  quantity: number;
  notes?: string;
}

export interface CustomerFormValues {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  notes?: string;
}
