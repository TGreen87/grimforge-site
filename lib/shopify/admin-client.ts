import { assertShopifyAdminConfigured, shopifyAdminEnv } from './env'

export interface ShopifyAdminGraphQLError {
  message: string
  field?: string[] | null
  code?: string
}

export interface ShopifyAdminGraphQLResponse<T> {
  data?: T
  errors?: ShopifyAdminGraphQLError[]
}

export async function shopifyAdminFetch<TResponse, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
): Promise<TResponse> {
  assertShopifyAdminConfigured()

  const { domain, version, token } = shopifyAdminEnv
  const endpoint = `https://${domain}/admin/api/${version}/graphql.json`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Shopify Admin request failed: ${response.status} ${response.statusText}${text ? ` — ${text}` : ''}`)
  }

  const payload = (await response.json()) as ShopifyAdminGraphQLResponse<TResponse>

  if (payload.errors?.length) {
    const firstError = payload.errors[0]
    throw new Error(`Shopify Admin returned an error: ${firstError.message}`)
  }

  if (!payload.data) {
    throw new Error('Shopify Admin response missing data payload.')
  }

  return payload.data
}

