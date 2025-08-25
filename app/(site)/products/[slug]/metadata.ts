import { getSupabaseServerClient } from '@/integrations/supabase/server'

interface Inventory {
  available?: number
}

interface Variant {
  id: string
  name: string
  price: number
  inventory?: Inventory
  format?: string
  product_id?: string
}

interface Product {
  id: string
  name?: string
  title: string
  description?: string
  image_url?: string
  image?: string
  price: number
  sku?: string
  category?: string
  tags?: string[]
  format?: string[]
  artist?: string
  created_at?: string
  active: boolean
  slug?: string
  variants?: Variant[]
}

export async function getProduct(slug: string) {
  const supabase = getSupabaseServerClient()
  
  // First try to find by slug (if exists)
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()
  
  // If not found by slug, try by title (for legacy support)
  let finalProduct = product
  if (!finalProduct) {
    const { data: productByTitle } = await supabase
      .from('products')
      .select('*')
      .eq('title', slug.replace(/-/g, ' '))
      .eq('active', true)
      .single()
    
    finalProduct = productByTitle
  }
  
  if (error || !finalProduct) {
    return null
  }
  
  // Get variants if they exist
  const { data: variants } = await supabase
    .from('variants')
    .select(`
      *,
      inventory (*)
    `)
    .eq('product_id', finalProduct.id)
  
  return {
    ...finalProduct,
    variants: variants || []
  }
}