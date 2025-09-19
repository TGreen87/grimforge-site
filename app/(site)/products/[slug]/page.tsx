import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateProductMetadata } from '@/lib/seo/metadata'
import { ProductJsonLd } from '@/components/seo/JsonLd'
import { getProduct } from './metadata'
import VariantClientBlock from './variant-client-block'
import { ProductGallery } from '@/components/ProductGallery'

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
    const primaryImage = (product as any).image || (product as any).image_url || '/placeholder.svg'

    const additionalImages = Array.isArray((product as any)?.gallery_images)
      ? ((product as any).gallery_images as string[])
      : undefined
    const productArtist = (product as any).artist || ''
    const productDescription = (product as any).description

    return (
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* JSON-LD for SEO */}
          <ProductJsonLd
            name={product.title || product.name || slug}
            description={product.description || 'Underground black metal release'}
            image={primaryImage}
            sku={(product as any).sku}
            price={Number(initialPrice ?? 0)}
            availability={((product as any)?.variants?.[0]?.inventory?.available ?? 0) > 0}
            brand={productArtist || 'Obsidian Rite Records'}
          />
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-8">
              <ProductGallery
                title={product.title || product.name || slug}
                artist={productArtist}
                primaryImage={primaryImage}
                additionalImages={additionalImages}
              />

              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-bone">About this release</h2>
                {productDescription ? (
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {productDescription}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Detailed description forthcoming. Reach out via the contact page for pressing details.
                  </p>
                )}
                <div className="grid gap-3 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Format</span>
                    <span>{Array.isArray((product as any).format) ? (product as any).format.join(', ') : (product as any).format || 'Vinyl'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">SKU</span>
                    <span>{(product as any).sku || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Release</span>
                    <span>{(product as any).release_year || new Date().getFullYear()}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Shipping</span>
                    <span>Ships worldwide from Australia. Rates calculated at checkout.</span>
                  </div>
                </div>
              </section>
            </div>

            <aside className="md:sticky md:top-28">
              <div className="rounded-2xl border border-border bg-background/50 p-6 shadow-lg backdrop-blur">
                <div className="mb-6 space-y-2">
                  <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Obsidian Rite Records</span>
                  <h1 className="blackletter text-3xl text-bone sm:text-4xl">{product.title || product.name || slug}</h1>
                  {productArtist ? <p className="text-sm text-muted-foreground">{productArtist}</p> : null}
                </div>

                <VariantClientBlock
                  variants={(product.variants || []) as any}
                  initialPrice={Number(initialPrice ?? 0)}
                  productMeta={{
                    title: product.title || product.name || slug,
                    artist: productArtist,
                    image: primaryImage,
                    format: Array.isArray((product as any).format) ? (product as any).format[0] : (product as any).format
                  }}
                />

                <div className="mt-8 space-y-3 text-xs text-muted-foreground">
                  <p>Orders ship within 2–3 business days. Tracking provided on dispatch.</p>
                  <p>Need help? <a className="underline" href="/legal/contact">Contact the label</a>.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    )
  } catch (e) {
    return notFound()
  }
}
