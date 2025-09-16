import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateProductMetadata } from '@/lib/seo/metadata'
import { ProductJsonLd } from '@/components/seo/JsonLd'
import { getProduct } from './metadata'
import Image from 'next/image'
import nextDynamic from 'next/dynamic'

const VariantClientBlock = nextDynamic(() => import('./variant-client-block'), { ssr: false })

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
  try {
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
  } catch (e) {
    return { title: 'Product', description: 'Product' }
  }
}

// Disable static generation for now to avoid SSR issues
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: ProductPageProps) {
  try {
    const { slug } = await params
    const product = await getProduct(slug)
    if (!product) return notFound()

    const primaryVariant = product.variants?.[0]
    const initialPrice = primaryVariant?.price ?? product.price

    return (
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* JSON-LD for SEO */}
          <ProductJsonLd
            name={product.title || product.name || slug}
            description={product.description || 'Underground black metal release'}
            image={(product as any).image || (product as any).image_url || '/placeholder.svg'}
            sku={(product as any).sku}
            price={Number(initialPrice ?? 0)}
            availability={((product as any)?.variants?.[0]?.inventory?.available ?? 0) > 0}
            brand={(product as any).artist || 'Obsidian Rite Records'}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="relative w-full aspect-square bg-secondary/20 rounded overflow-hidden">
              <Image
                src={(product as any).image || (product as any).image_url || '/placeholder.svg'}
                alt={product.title || slug}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                className="object-cover"
              />
            </div>

            <div>
              <h1 className="blackletter text-3xl md:text-5xl text-bone mb-4">{product.title || product.name || slug}</h1>
              {(product as any).artist && (
                <p className="text-muted-foreground mb-6">{(product as any).artist}</p>
              )}
              {(product as any).description && (
                <p className="mb-6 text-muted-foreground leading-relaxed">{(product as any).description}</p>
              )}

              {/* Variant selection and price/availability */}
              <VariantClientBlock
                variants={(product.variants || []) as any}
                initialPrice={Number(initialPrice ?? 0)}
                productMeta={{
                  title: product.title || product.name || slug,
                  artist: (product as any).artist || '',
                  image: (product as any).image || (product as any).image_url || '/placeholder.svg',
                  format: Array.isArray((product as any).format) ? (product as any).format[0] : (product as any).format
                }}
              />
            </div>
          </div>
        </div>
      </main>
    )
  } catch (e) {
    return notFound()
  }
}
