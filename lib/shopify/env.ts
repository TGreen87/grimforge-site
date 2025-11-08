const SHOPIFY_API_VERSION_DEFAULT = '2025-07'

const domain = (process.env.SHOPIFY_STORE_DOMAIN || '').trim()
const storefrontToken = (process.env.SHOPIFY_STOREFRONT_API_TOKEN || '').trim()
const version = (process.env.SHOPIFY_API_VERSION || SHOPIFY_API_VERSION_DEFAULT).trim()
const adminToken = (process.env.SHOPIFY_ADMIN_API_TOKEN || '').trim()
const adminVersion = (process.env.SHOPIFY_ADMIN_API_VERSION || version || SHOPIFY_API_VERSION_DEFAULT).trim()

export const shopifyEnv = {
  domain,
  token: storefrontToken,
  version,
  isConfigured: Boolean(domain && storefrontToken),
}

export const shopifyAdminEnv = {
  domain,
  token: adminToken,
  version: adminVersion,
  isConfigured: Boolean(domain && adminToken),
}

export function assertShopifyConfigured() {
  if (!shopifyEnv.isConfigured) {
    throw new Error('Shopify Storefront API is not configured. Missing SHOPIFY_STORE_DOMAIN and/or SHOPIFY_STOREFRONT_API_TOKEN.')
  }
}

export function assertShopifyAdminConfigured() {
  if (!shopifyAdminEnv.isConfigured) {
    throw new Error('Shopify Admin API is not configured. Missing SHOPIFY_STORE_DOMAIN and/or SHOPIFY_ADMIN_API_TOKEN.')
  }
}

export type ShopifyEnvSnapshot = typeof shopifyEnv
