import Link from 'next/link'
import Image from 'next/image'
import { shopifyEnv } from '@/lib/shopify/env'
import { shopifyFetch } from '@/lib/shopify/client'
import { PRODUCTS_QUERY } from '@/lib/shopify/queries'
import { CheckoutButton } from '@/components/shopify/CheckoutButton'

interface ProductsResponse {
  products: {
    edges: Array<{
      node: {
        id: string
        handle: string
        title: string
        featuredImage: {
          url: string
          altText: string | null
        } | null
        variants: {
          edges: Array<{
            node: {
              id: string
              title: string
              price: {
                amount: string
                currencyCode: string
              }
            }
          }>
        }
      }
    }>
  }
}

function formatPrice(amount?: string, currencyCode?: string) {
  if (!amount || !currencyCode) return '—'
  const parsed = Number(amount)
  if (!Number.isFinite(parsed)) return `${amount} ${currencyCode}`
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: currencyCode }).format(parsed)
}

export const dynamic = 'force-dynamic'

async function getProducts(): Promise<ProductsResponse | null> {
  if (!shopifyEnv.isConfigured) return null
  try {
    return await shopifyFetch<ProductsResponse>(PRODUCTS_QUERY, { first: 12 })
  } catch (error) {
    console.error('Failed to fetch Shopify products', error)
    return null
  }
}

export default async function ProductsPage() {
  const data = await getProducts()

  if (!shopifyEnv.isConfigured) {
    return (
      <main className="container mx-auto px-4 py-16">
        <h1 className="blackletter text-4xl text-bone">Products</h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Shopify is not configured yet. Add `SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_API_TOKEN` to enable live products.
        </p>
        <div className="mt-6 max-w-xs">
          <CheckoutButton data-testid="checkout-button" className="w-full" />
        </div>
      </main>
    )
  }

  const products = data?.products.edges ?? []

  return (
    <main className="container mx-auto px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="blackletter text-4xl text-bone">Catalogue</h1>
        <p className="mt-3 text-muted-foreground">Freshly pulled from the Shopify headless Storefront.</p>
        <div className="mt-6 flex justify-center">
          <CheckoutButton data-testid="checkout-button" className="w-full max-w-xs" />
        </div>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">No products available yet. Check back soon.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map(({ node }) => {
            const featured = node.featuredImage
            const variant = node.variants.edges[0]?.node
            const price = formatPrice(variant?.price.amount, variant?.price.currencyCode)

            return (
              <Link
                key={node.id}
                href={`/products/${node.handle}`}
                className="group block overflow-hidden rounded-xl border border-border bg-background/50 shadow transition hover:border-accent"
              >
                <div className="relative aspect-square overflow-hidden bg-muted/20">
                  {featured?.url ? (
                    <Image
                      src={featured.url}
                      alt={featured.altText ?? node.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-2 px-4 py-5">
                  <h2 className="text-lg font-semibold text-bone line-clamp-2">{node.title}</h2>
                  {variant?.title ? (
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{variant.title}</p>
                  ) : null}
                  <p className="text-sm text-accent">{price}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
