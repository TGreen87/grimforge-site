import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateProductMetadata } from '@/lib/seo/metadata'
import { ProductJsonLd } from '@/components/seo/JsonLd'
import { getProduct, type ProductWithVariants, type VariantWithInventory } from './metadata'
import VariantClientBlock from './variant-client-block'
import { ProductGallery } from '@/components/ProductGallery'

interface ProductPageProps { params: Promise<{ slug: string }> }

const PLACEHOLDER_IMAGE = '/placeholder.svg'

function resolveDisplayName(product: ProductWithVariants, slug: string) {
  return product.title || product.name || slug
}

function resolvePrimaryImage(product: ProductWithVariants) {
  if (product.image && product.image.trim().length > 0) return product.image
  if (product.image_url && product.image_url.trim().length > 0) return product.image_url
  const gallery = Array.isArray(product.gallery_images) ? product.gallery_images : null
  if (gallery && gallery.length > 0) return gallery[0]
  return PLACEHOLDER_IMAGE
}

function resolveAdditionalImages(product: ProductWithVariants) {
  const gallery = Array.isArray(product.gallery_images) ? product.gallery_images : null
  if (!gallery) return undefined
  const sanitized = gallery.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  return sanitized.length ? sanitized : undefined
}

function resolveFormats(product: ProductWithVariants) {
  const raw = product.format
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
  }

  if (typeof raw === 'string' && raw.trim().length > 0) {
    return [raw]
  }

  return []
}

function selectPrimaryVariant(product: ProductWithVariants): VariantWithInventory | undefined {
  return product.variants[0]
}

function hasAvailableInventory(variant?: VariantWithInventory | null) {
  return (variant?.inventory?.available ?? 0) > 0
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const product = await getProduct(slug)
    if (!product) return { title: 'Product not found', description: 'Product not found' }
    const displayName = resolveDisplayName(product, slug)
    const price = selectPrimaryVariant(product)?.price ?? product.price
    const availability = hasAvailableInventory(selectPrimaryVariant(product)) ? 'In stock' : 'Out of stock'
    return generateProductMetadata({
      name: displayName,
      description: product.description || 'Product from Obsidian Rite Records',
      image: resolvePrimaryImage(product),
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

    const primaryVariant = selectPrimaryVariant(product)
    const initialPrice = primaryVariant?.price ?? product.price
    const primaryImage = resolvePrimaryImage(product)
    const additionalImages = resolveAdditionalImages(product)
    const productArtist = product.artist ?? ''
    const productDescription = product.description ?? undefined
    const formatValues = resolveFormats(product)
    const displayName = resolveDisplayName(product, slug)

    return (
      <main>
        <div className="container mx-auto px-4 py-8">
          {/* JSON-LD for SEO */}
          <ProductJsonLd
            name={displayName}
            description={product.description || 'Underground black metal release'}
            image={primaryImage}
            sku={product.sku ?? undefined}
            price={Number(initialPrice ?? 0)}
            availability={hasAvailableInventory(primaryVariant)}
            brand={productArtist || 'Obsidian Rite Records'}
          />
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-8">
              <ProductGallery
                title={displayName}
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
                    <span>{formatValues.length ? formatValues.join(', ') : 'Vinyl'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">SKU</span>
                    <span>{product.sku || 'TBD'}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-[0.3em] text-muted-foreground/80">Release</span>
                    <span>{product.release_year || new Date().getFullYear()}</span>
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
                  <h1 className="blackletter text-3xl text-bone sm:text-4xl">{displayName}</h1>
                  {productArtist ? <p className="text-sm text-muted-foreground">{productArtist}</p> : null}
                </div>

                <VariantClientBlock
                  variants={product.variants}
                  initialPrice={Number(initialPrice ?? 0)}
                  productMeta={{
                    title: displayName,
                    artist: productArtist,
                    image: primaryImage,
                    format: formatValues[0] ?? undefined,
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
