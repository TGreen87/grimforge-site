import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { AddToCartButton } from '@/components/shopify/AddToCartButton'
import { shopifyEnv } from '@/lib/shopify/env'
import { shopifyFetch } from '@/lib/shopify/client'
import { PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify/queries'

interface ProductByHandleResponse {
  product: {
    id: string
    handle: string
    title: string
    description: string | null
    featuredImage: {
      url: string
      altText: string | null
    } | null
    images: {
      edges: Array<{
        node: {
          id: string
          url: string
          altText: string | null
        }
      }>
    }
    variants: {
      edges: Array<{
        node: {
          id: string
          title: string
          price: {
            amount: string
            currencyCode: string
          }
          availableForSale: boolean
        }
      }>
    }
  } | null
}

interface PageProps {
  params: { handle: string }
}

function formatPrice(amount?: string, currencyCode?: string) {
  if (!amount || !currencyCode) return '—'
  const parsed = Number(amount)
  if (!Number.isFinite(parsed)) return `${amount} ${currencyCode}`
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: currencyCode }).format(parsed)
}

async function getProduct(handle: string): Promise<ProductByHandleResponse['product'] | null> {
  if (!shopifyEnv.isConfigured) return null
  try {
    const response = await shopifyFetch<ProductByHandleResponse>(PRODUCT_BY_HANDLE_QUERY, { handle })
    return response.product
  } catch (error) {
    console.error('Failed to fetch Shopify product by handle', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = params
  if (!shopifyEnv.isConfigured) {
    return {
      title: 'Product',
      description: 'Shopify is not configured.',
    }
  }

  const product = await getProduct(handle)
  if (!product) {
    return {
      title: 'Product not found',
      description: 'This product is not available.',
    }
  }

  return {
    title: product.title,
    description: product.description ?? undefined,
    openGraph: {
      title: product.title,
      description: product.description ?? undefined,
      images: product.images.edges.map(({ node }) => ({
        url: node.url,
        alt: node.altText ?? product.title,
      })),
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: PageProps) {
  const { handle } = params

  if (!shopifyEnv.isConfigured) {
    return (
      <main className="container mx-auto px-4 py-16">
        <h1 className="blackletter text-4xl text-bone">Products</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Shopify is not configured yet. Add `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_API_TOKEN` to enable live product pages.
        </p>
      </main>
    )
  }

  const product = await getProduct(handle)
  if (!product) {
    return notFound()
  }

  const images = product.images.edges.length
    ? product.images.edges
    : product.featuredImage
      ? [{ node: { id: product.id, url: product.featuredImage.url, altText: product.featuredImage.altText } }]
      : []

  const variants = product.variants.edges.map(({ node }) => node)
  const variantList = variants.length === 1 ? [variants[0]] : variants

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {images.length === 0 ? (
              <div className="flex aspect-square items-center justify-center rounded-lg border border-border text-sm text-muted-foreground">
                No images available
              </div>
            ) : (
              images.map(({ node }) => (
                <div key={node.id} className="relative aspect-square overflow-hidden rounded-lg border border-border">
                  <Image
                    src={node.url}
                    alt={node.altText ?? product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              ))
            )}
          </div>

          {product.description ? (
            <article className="space-y-4 rounded-xl border border-border bg-background/40 p-6 text-sm text-muted-foreground">
              <h2 className="text-lg font-semibold text-bone">Description</h2>
              <p className="whitespace-pre-line leading-relaxed">{product.description}</p>
            </article>
          ) : null}
        </section>

        <aside className="space-y-6 rounded-2xl border border-border bg-background/60 p-6 shadow-lg backdrop-blur">
          <header className="space-y-2">
            <span className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Obsidian Rite Records</span>
            <h1 className="blackletter text-3xl text-bone sm:text-4xl">{product.title}</h1>
          </header>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Variants</h2>
            <ul className="space-y-3">
              {variantList.map((variant) => (
                <li
                  key={variant.id}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-bone">{variant.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {variant.availableForSale ? 'In stock' : 'Currently unavailable'}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className="text-base font-semibold text-accent">
                      {formatPrice(variant.price.amount, variant.price.currencyCode)}
                    </span>
                    <AddToCartButton
                      variantId={variant.id}
                      disabled={!variant.availableForSale}
                      className="w-full sm:w-auto"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
