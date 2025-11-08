import { assertShopifyConfigured, shopifyEnv } from './env'

interface ShopifyFetchOptions {
  buyerIp?: string
}

export interface ShopifyGraphQLError {
  message: string
  extensions?: Record<string, unknown>
}

export interface ShopifyGraphQLResponse<T> {
  data?: T
  errors?: ShopifyGraphQLError[]
}

export async function shopifyFetch<TResponse, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  options: ShopifyFetchOptions = {},
): Promise<TResponse> {
  assertShopifyConfigured()

  const { domain, version, token } = shopifyEnv
  const endpoint = `https://${domain}/api/${version}/graphql.json`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Shopify-Storefront-Private-Token': token,
  }

  if (options.buyerIp) {
    headers['Shopify-Storefront-Buyer-IP'] = options.buyerIp
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Shopify Storefront request failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`)
  }

  const payload = (await response.json()) as ShopifyGraphQLResponse<TResponse>

  if (payload.errors?.length) {
    const firstError = payload.errors[0]
    const extra = firstError.extensions ? ` (${JSON.stringify(firstError.extensions)})` : ''
    throw new Error(`Shopify Storefront returned an error: ${firstError.message}${extra}`)
  }

  if (!payload.data) {
    throw new Error('Shopify Storefront response missing data payload.')
  }

  return payload.data
}
