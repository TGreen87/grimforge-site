import { getSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/types'

type ProductRow = Database['public']['Tables']['products']['Row']
type VariantRow = Database['public']['Tables']['variants']['Row']
type InventoryRow = Database['public']['Tables']['inventory']['Row']

type ProductRowWithLegacyFields = Omit<ProductRow, 'format'> & {
  /** Historical seeds sometimes store non-string formats */
  format: ProductRow['format'] | ProductRow['format'][] | null
  /** Legacy storefront data may include a secondary image field */
  image_url?: string | null
  /** Early imports used `name` instead of `title` */
  name?: string | null
  /** Optional gallery assets stored as JSON */
  gallery_images?: string[] | null
}

type VariantRowWithInventoryJoin = VariantRow & {
  inventory: InventoryRow | InventoryRow[] | null
  format?: string | null
  stripe_price_id?: string | null
  stripePriceId?: string | null
  price_id?: string | null
  priceId?: string | null
  metadata?: Record<string, unknown> | null
}

export type VariantWithInventory = VariantRow & {
  inventory: InventoryRow | null
  /** Legacy seeds occasionally stored a display format on the variant */
  format?: string | null
  stripe_price_id?: string | null
  stripePriceId?: string | null
  price_id?: string | null
  priceId?: string | null
  metadata?: Record<string, unknown> | null
}

export type ProductWithVariants = ProductRowWithLegacyFields & {
  variants: VariantWithInventory[]
}

function normalizeVariants(variants: VariantRowWithInventoryJoin[] | null | undefined): VariantWithInventory[] {
  if (!variants) return []
  return variants.map((variant) => {
    const { inventory, ...rest } = variant
    const normalizedInventory = Array.isArray(inventory) ? inventory[0] ?? null : inventory ?? null
    return {
      ...rest,
      inventory: normalizedInventory,
    }
  })
}

export async function getProduct(slug: string): Promise<ProductWithVariants | null> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()

    let finalProduct = (product as ProductRowWithLegacyFields | null) ?? null

    if (!finalProduct) {
      const { data: productByTitle } = await supabase
        .from('products')
        .select('*')
        .eq('title', slug.replace(/-/g, ' '))
        .eq('active', true)
        .maybeSingle()

      finalProduct = (productByTitle as ProductRowWithLegacyFields | null) ?? null
    }

    if (!finalProduct) return null

    const { data: variantData, error: variantsError } = await supabase
      .from('variants')
      .select('*, inventory(*)')
      .eq('product_id', finalProduct.id)

    if (variantsError) {
      console.warn('Failed to load variants for product', { slug, error: variantsError.message })
    }

    const variants = normalizeVariants(variantData as VariantRowWithInventoryJoin[] | null)

    return {
      ...finalProduct,
      variants,
    }
  } catch (error) {
    console.warn('Supabase lookup failed, returning fallback product payload', error)
    const now = new Date().toISOString()
    const fallbackVariantId = `${slug}-variant-1`
    const fallbackVariant: VariantWithInventory = {
      id: fallbackVariantId,
      name: 'Standard Edition',
      price: 29.99,
      product_id: slug,
      sku: `${slug}-variant-1`,
      active: true,
      barcode: null,
      color: null,
      created_at: now,
      dimensions: null,
      size: null,
      updated_at: now,
      weight: null,
      inventory: {
        id: `${fallbackVariantId}-inventory`,
        variant_id: fallbackVariantId,
        on_hand: 10,
        allocated: 0,
        available: 10,
        reorder_point: null,
        reorder_quantity: null,
        updated_at: now,
      },
    }

    const fallbackProduct: ProductWithVariants = {
      id: slug,
      title: 'Sample Product',
      name: 'Sample Product',
      description: 'This is a sample product description',
      price: 29.99,
      image: '/placeholder.svg',
      image_url: '/placeholder.svg',
      active: true,
      slug,
      sku: slug,
      created_at: now,
      updated_at: now,
      artist: 'Obsidian Rite Records',
      featured: false,
      limited: false,
      pre_order: false,
      release_year: new Date().getFullYear(),
      stock: 10,
      tags: [],
      format: 'vinyl',
      variants: [fallbackVariant],
      gallery_images: ['/placeholder.svg'],
    }

    return fallbackProduct
  }
}
