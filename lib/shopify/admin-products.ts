import { shopifyAdminFetch } from './admin-client'

const PRODUCT_CREATE_MUTATION = /* GraphQL */ `
  mutation ProductCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        handle
        status
        title
        variants(first: 25) {
          edges {
            node {
              id
              title
              sku
              price
            }
          }
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`

interface ProductCreateResponse {
  productCreate: {
    product: ShopifyProductNode | null
    userErrors: Array<{
      field?: string[] | null
      message: string
      code?: string | null
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
    edges: Array<{
      node: ShopifyProductVariantNode
    }>
  }
}

export async function createShopifyProduct(input: Record<string, unknown>) {
  const response = await shopifyAdminFetch<ProductCreateResponse>(PRODUCT_CREATE_MUTATION, { input })
  const { product, userErrors } = response.productCreate

  if (userErrors?.length) {
    const first = userErrors[0]
    const location = first.field?.join('.')
    const code = first.code ? ` (${first.code})` : ''
    throw new Error(`Shopify productCreate failed${location ? ` at ${location}` : ''}: ${first.message}${code}`)
  }

  if (!product) {
    throw new Error('Shopify productCreate returned no product payload.')
  }

  return product
}

