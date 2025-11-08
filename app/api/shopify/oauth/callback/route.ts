import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

const SHOPIFY_CLIENT_ID = process.env.SHOPIFY_CLIENT_ID
const SHOPIFY_CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET
const DEFAULT_SHOP = process.env.SHOPIFY_STORE_DOMAIN

function badRequest(message: string, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      ok: false,
      error: message,
      ...(details ? { details } : {}),
    },
    { status: 400 },
  )
}

function verifyHmac(url: URL, clientSecret: string) {
  const entries = Array.from(url.searchParams.entries())
    .filter(([key]) => key !== 'hmac' && key !== 'signature')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  const digest = createHmac('sha256', clientSecret).update(entries).digest('hex')
  const hmacParam = url.searchParams.get('hmac')
  if (!hmacParam) return false

  try {
    const provided = Buffer.from(hmacParam, 'utf8')
    const expected = Buffer.from(digest, 'utf8')
    return provided.length === expected.length && timingSafeEqual(provided, expected)
  } catch {
    return false
  }
}

async function exchangeCode(shop: string, code: string) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: SHOPIFY_CLIENT_ID,
      client_secret: SHOPIFY_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`OAuth token exchange failed (${response.status} ${response.statusText})${text ? ` — ${text}` : ''}`)
  }

  return response.json() as Promise<{ access_token: string; scope: string; expires_in?: number }>
}

export async function GET(request: NextRequest) {
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing Shopify OAuth environment variables.',
      },
      { status: 500 },
    )
  }

  const url = request.nextUrl
  const code = url.searchParams.get('code')
  const shop = url.searchParams.get('shop') || DEFAULT_SHOP

  if (!code || !shop) {
    return badRequest('Missing required query parameters.', { codePresent: Boolean(code), shopPresent: Boolean(shop) })
  }

  if (!verifyHmac(url, SHOPIFY_CLIENT_SECRET)) {
    return badRequest('Invalid HMAC. Request did not originate from Shopify.')
  }

  try {
    const tokenPayload = await exchangeCode(shop, code)

    return NextResponse.json({
      ok: true,
      shop,
      scope: tokenPayload.scope,
      expiresIn: tokenPayload.expires_in ?? 0,
      accessToken: tokenPayload.access_token,
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 502 },
    )
  }
}
