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
  try {
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
    
    // If both lookups failed, treat as not found. Do not gate on the first query's error
    // if the fallback lookup succeeded.
    if (!finalProduct) return null
    
    // Get variants if they exist — be defensive and normalize inventory shape
    let variants: any[] = []
    try {
      const { data } = await supabase
        .from('variants')
        .select(`
          *,
          inventory (* )
        `)
        .eq('product_id', finalProduct.id)
      variants = Array.isArray(data) ? data : []
    } catch {
      variants = []
    }

    // Normalize inventory: some PostgREST joins return an array
    const normalized = variants.map((v: any) => ({
      ...v,
      inventory: Array.isArray(v?.inventory) ? (v.inventory[0] || null) : (v?.inventory ?? null),
    }))

    return { ...finalProduct, variants: normalized }
  } catch (error) {
    // During build time or if Supabase is not available, return mock data
    console.warn('Supabase not available during build, returning mock product data')
    return {
      id: slug,
      title: 'Sample Product',
      name: 'Sample Product',
      description: 'This is a sample product description',
      price: 29.99,
      image_url: '/placeholder.svg',
      active: true,
      slug: slug,
      category: 'merchandise',
      sku: slug,
      created_at: new Date().toISOString(),
      variants: [
        {
          id: `${slug}-variant-1`,
          name: 'Standard Edition',
          price: 29.99,
          inventory: { available: 10 },
          format: 'standard',
          product_id: slug
        }
      ]
    }
  }
}
