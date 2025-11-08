#!/usr/bin/env tsx
import 'dotenv/config'

import { createShopifyProduct } from '../lib/shopify/admin-products'
import { assertShopifyAdminConfigured } from '../lib/shopify/env'

async function main() {
  assertShopifyAdminConfigured()

  const productInput = {
    title: 'Obsidian Rite Demo LP',
    handle: 'obsidian-rite-demo-lp',
    descriptionHtml:
      '<p>Demo release to validate the Shopify integration. Replace once real catalog data is ready.</p>',
    status: 'ACTIVE',
    productType: 'Vinyl',
    vendor: 'Obsidian Rite Records',
    tags: ['demo', 'lp', 'shopify'],
    options: ['Format'],
    images: [
      {
        src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80',
      },
    ],
    variants: [
      {
        title: 'Vinyl',
        sku: 'ORR-DEMO-LP',
        price: '32.00',
        requiresShipping: true,
        inventoryPolicy: 'DENY',
        options: ['Vinyl'],
      },
    ],
  }

  const product = await createShopifyProduct(productInput)
  const primaryVariant = product.variants?.edges?.[0]?.node

  console.log('Created Shopify product:')
  console.log(`  Product ID: ${product.id}`)
  console.log(`  Handle: ${product.handle}`)
  console.log(`  Variant ID: ${primaryVariant?.id ?? 'n/a'}`)
}

main().catch((error) => {
  console.error('Shopify seed failed:', error)
  process.exit(1)
})

