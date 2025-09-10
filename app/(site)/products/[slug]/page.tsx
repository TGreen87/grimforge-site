import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateProductMetadata } from '@/lib/seo/metadata'
import { getProduct } from './metadata'
import BuyNowButton from '@/components/BuyNowButton'
import Image from 'next/image'

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

interface ProductPageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product not found', description: 'Product not found' }
  const price = product.variants?.[0]?.price ?? product.price
  const availability = (product.variants?.[0] as any)?.inventory?.available > 0 ? 'In stock' : 'Out of stock'
  return generateProductMetadata({
    name: product.title || product.name || slug,
    description: product.description || 'Product from Obsidian Rite Records',
    image: (product.image as string) || product.image_url,
    slug: product.slug || slug,
    price,
    availability,
  })
}

// Disable static generation for now to avoid SSR issues
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) notFound()

  const primaryVariant = product.variants?.[0]
  const price = primaryVariant?.price ?? product.price
  const available = (primaryVariant as any)?.inventory?.available ?? 0
  const canBuy = !!primaryVariant && available > 0

  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative w-full aspect-square bg-secondary/20 rounded overflow-hidden">
            <Image
              src={(product.image as string) || product.image_url || '/placeholder.svg'}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className="object-cover"
            />
          </div>

          <div>
            <h1 className="blackletter text-3xl md:text-5xl text-bone mb-4">{product.title}</h1>
            {product.artist && (
              <p className="text-muted-foreground mb-6">{product.artist}</p>
            )}
            {product.description && (
              <p className="mb-6 text-muted-foreground leading-relaxed">{product.description}</p>
            )}

            <div className="mb-6">
              <p className="text-2xl font-bold text-accent">${Number(price ?? 0).toFixed(2)} AUD</p>
              <p className="text-sm {available > 0 ? 'text-green-500' : 'text-muted-foreground'}">
                {available > 0 ? `In stock (${available} available)` : 'Out of stock'}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <BuyNowButton variantId={primaryVariant?.id} quantity={1} />
              {!canBuy && (
                <span className="text-sm text-muted-foreground">Select variant unavailable</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
