import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { shopifyEnv } from '@/lib/shopify/env'
import { shopifyFetch } from '@/lib/shopify/client'
import { CART_CREATE, CART_LINES_ADD } from '@/lib/shopify/queries'

const CART_COOKIE_NAME = 'sfy_cart_id'
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 90 // 90 days
const isProduction = process.env.NODE_ENV === 'production'

interface RequestPayload {
  variantId?: string
  quantity?: number
  buyerCountryCode?: string
}

interface CartCreateResponse {
  cartCreate: {
    cart: {
      id: string
      checkoutUrl: string
      totalQuantity: number
    } | null
    userErrors: Array<{ message: string; field?: string[] | null }>
  }
}

interface CartLinesAddResponse {
  cartLinesAdd: {
    cart: {
      id: string
      checkoutUrl: string
      totalQuantity: number
    } | null
    userErrors: Array<{ message: string; field?: string[] | null }>
  }
}

function normalizeCountryCode(code?: string) {
  if (!code) return undefined
  const trimmed = code.trim()
  if (trimmed.length !== 2) return undefined
  return trimmed.toUpperCase()
}

function invalidRequest(message: string, correlationId: string) {
  return NextResponse.json(
    {
      code: 'BAD_REQUEST',
      message,
      correlationId,
    },
    { status: 400 },
  )
}

function userErrorResponse(message: string, correlationId: string) {
  return NextResponse.json(
    {
      code: 'SHOPIFY_USER_ERROR',
      message,
      correlationId,
    },
    { status: 400 },
  )
}

function notConfigured(correlationId: string) {
  return NextResponse.json(
    {
      code: 'SHOPIFY_NOT_CONFIGURED',
      message: 'Shopify Storefront API environment variables are missing.',
      correlationId,
    },
    { status: 503 },
  )
}

export async function POST(request: NextRequest) {
  const correlationId = randomUUID()

  if (!shopifyEnv.isConfigured) {
    return notConfigured(correlationId)
  }

  let payload: RequestPayload
  try {
    payload = await request.json()
  } catch {
    return invalidRequest('Invalid JSON payload.', correlationId)
  }

  const variantId = typeof payload.variantId === 'string' ? payload.variantId.trim() : ''
  if (!variantId) {
    return invalidRequest('variantId is required.', correlationId)
  }

  const quantityRaw = payload.quantity ?? 1
  const quantity = Number.isInteger(quantityRaw) && quantityRaw > 0 ? quantityRaw : NaN
  if (!Number.isInteger(quantity)) {
    return invalidRequest('quantity must be a positive integer.', correlationId)
  }

  const buyerCountryCode = normalizeCountryCode(payload.buyerCountryCode)
  const existingCartId = request.cookies.get(CART_COOKIE_NAME)?.value ?? ''

  try {
    if (!existingCartId) {
      const response = await shopifyFetch<CartCreateResponse>(CART_CREATE, {
        input: {
          lines: [
            {
              quantity,
              merchandiseId: variantId,
            },
          ],
          ...(buyerCountryCode
            ? {
                buyerIdentity: {
                  countryCode: buyerCountryCode,
                },
              }
            : {}),
        },
      })

      const { cart, userErrors } = response.cartCreate
      if (userErrors.length) {
        return userErrorResponse(userErrors[0]?.message ?? 'Unknown Shopify error.', correlationId)
      }

      if (!cart) {
        throw new Error('Shopify cartCreate returned no cart.')
      }

      const nextResponse = NextResponse.json({
        cartId: cart.id,
        checkoutUrl: cart.checkoutUrl,
        totalQuantity: cart.totalQuantity,
        correlationId,
      })
      nextResponse.cookies.set({
        name: CART_COOKIE_NAME,
        value: cart.id,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: CART_COOKIE_MAX_AGE,
        secure: isProduction,
      })
      return nextResponse
    }

    const response = await shopifyFetch<CartLinesAddResponse>(CART_LINES_ADD, {
      cartId: existingCartId,
      lines: [
        {
          quantity,
          merchandiseId: variantId,
        },
      ],
    })

    const { cart, userErrors } = response.cartLinesAdd
    if (userErrors.length) {
      return userErrorResponse(userErrors[0]?.message ?? 'Unknown Shopify error.', correlationId)
    }

    if (!cart) {
      throw new Error('Shopify cartLinesAdd returned no cart.')
    }

    const nextResponse = NextResponse.json({
      cartId: cart.id,
      checkoutUrl: cart.checkoutUrl,
      totalQuantity: cart.totalQuantity,
      correlationId,
    })
    nextResponse.cookies.set({
      name: CART_COOKIE_NAME,
      value: cart.id,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: CART_COOKIE_MAX_AGE,
      secure: isProduction,
    })
    return nextResponse
  } catch (error) {
    console.error('Shopify cart mutation failed', { error, correlationId })
    return NextResponse.json(
      {
        code: 'SHOPIFY_REQUEST_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
        correlationId,
      },
      { status: 502 },
    )
  }
}
