import { shopifyAdminFetch } from './admin-client'

const PRODUCT_SET_MUTATION = /* GraphQL */ `
  mutation ProductSet($input: ProductSetInput!, $sync: Boolean!) {
    productSet(input: $input, synchronous: $sync) {
      product {
        id
        handle
        status
        title
        variants(first: 25) {
          nodes {
            id
            title
            sku
            price
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

interface ProductSetResponse {
  productSet: {
    product: ShopifyProductNode | null
    userErrors: Array<{
      field?: string[] | null
      message: string
    }>
  }
}

export interface ShopifyProductVariantNode {
  id: string
  title: string
  sku: string | null
  price: string
}

export interface ShopifyProductNode {
  id: string
  handle: string
  title: string
  status: string
  variants: {
    nodes: ShopifyProductVariantNode[]
  }
}

export async function createShopifyProduct(input: Record<string, unknown>) {
  const response = await shopifyAdminFetch<ProductSetResponse>(PRODUCT_SET_MUTATION, {
    input,
    sync: true,
  })
  const { product, userErrors } = response.productSet

  if (userErrors?.length) {
    const first = userErrors[0]
    const location = first.field?.join('.')
    throw new Error(`Shopify productSet failed${location ? ` at ${location}` : ''}: ${first.message}`)
  }

  if (!product) {
    throw new Error('Shopify productSet returned no product payload.')
  }

  return product
}
