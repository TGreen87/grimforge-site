const SHOPIFY_API_VERSION_DEFAULT = '2025-07'

const domain = (process.env.SHOPIFY_STORE_DOMAIN || '').trim()
const token = (process.env.SHOPIFY_STOREFRONT_API_TOKEN || '').trim()
const version = (process.env.SHOPIFY_API_VERSION || SHOPIFY_API_VERSION_DEFAULT).trim()

export const shopifyEnv = {
  domain,
  token,
  version,
  isConfigured: Boolean(domain && token),
}

export function assertShopifyConfigured() {
  if (!shopifyEnv.isConfigured) {
    throw new Error('Shopify Storefront API is not configured. Missing SHOPIFY_STORE_DOMAIN and/or SHOPIFY_STOREFRONT_API_TOKEN.')
  }
}

export type ShopifyEnvSnapshot = typeof shopifyEnv

