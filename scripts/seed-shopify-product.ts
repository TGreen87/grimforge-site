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
    productOptions: [
      {
        name: 'Format',
        values: [{ name: 'Vinyl' }],
      },
    ],
    variants: [
      {
        sku: 'ORR-DEMO-LP',
        price: '32.00',
        optionValues: [
          {
            optionName: 'Format',
            name: 'Vinyl',
          },
        ],
      },
    ],
  }

  const product = await createShopifyProduct(productInput)
  const primaryVariant = product.variants?.nodes?.[0]

  console.log('Created Shopify product:')
  console.log(`  Product ID: ${product.id}`)
  console.log(`  Handle: ${product.handle}`)
  console.log(`  Variant ID: ${primaryVariant?.id ?? 'n/a'}`)
}

main().catch((error) => {
  console.error('Shopify seed failed:', error)
  process.exit(1)
})
