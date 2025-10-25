import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { STRIPE_CONFIG } from '@/lib/stripe'
import { randomUUID } from 'crypto'

const quantitySchema = z
  .number({
    required_error: 'quantity is required',
    invalid_type_error: 'quantity must be a number',
  })
  .int('quantity must be an integer')
  .min(1, 'quantity must be at least 1')

const checkoutSchema = z
  .object({
    priceId: z
      .string({ invalid_type_error: 'priceId must be a string' })
      .trim()
      .min(1, 'priceId cannot be empty')
      .optional(),
    variant_id: z
      .string({ invalid_type_error: 'variant_id must be a string' })
      .trim()
      .min(1, 'variant_id cannot be empty')
      .optional(),
    quantity: quantitySchema,
  })
  .refine((payload) => Boolean(payload.priceId || payload.variant_id), {
    message: 'Provide either priceId or variant_id',
    path: ['priceId'],
  })
  .passthrough()

type CheckoutPayload = z.infer<typeof checkoutSchema>

const PRICE_ID_CANDIDATES = ['stripe_price_id', 'stripePriceId', 'price_id', 'priceId']

function isStripePriceId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('price_')
}

function normalizeQuantity(value: number) {
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.min(Math.max(Math.trunc(value), 1), 10)
}

function buildOrigin(req: NextRequest) {
  return (
    req.headers.get('origin') ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL_STAGING ??
    'http://localhost:3000'
  )
}

async function fetchPriceIdForVariant(supabase: ReturnType<typeof createServiceClient>, variantId: string) {
  try {
    const { data: mapping, error: mappingError } = await supabase
      .from('variant_prices')
      .select('stripe_price_id, price_id, priceId, stripePriceId, metadata')
      .eq('variant_id', variantId)
      .maybeSingle()

    if (!mappingError && mapping) {
      for (const key of PRICE_ID_CANDIDATES) {
        const candidate = (mapping as Record<string, unknown>)[key]
        if (isStripePriceId(candidate)) {
          return candidate.trim()
        }
      }
      const metadataCandidate =
        typeof mapping.metadata === 'object' && mapping.metadata !== null
          ? (mapping.metadata as Record<string, unknown>).stripe_price_id
          : null
      if (isStripePriceId(metadataCandidate)) {
        return metadataCandidate.trim()
      }
    }

    if (mappingError && mappingError.code !== 'PGRST302' && mappingError.code !== '42P01') {
      throw mappingError
    }
  } catch (error) {
    const err = error as { message?: string }
    console.error('checkout.variant_price_lookup_failed', { variantId, error: err?.message ?? String(error) })
    throw error
  }

  const { data: variant, error: variantError } = await supabase
    .from('variants')
    .select('*')
    .eq('id', variantId)
    .maybeSingle()

  if (variantError) {
    console.error('checkout.variant_lookup_failed', { variantId, error: variantError.message })
    throw variantError
  }

  if (!variant) {
    return null
  }

  for (const key of PRICE_ID_CANDIDATES) {
    const candidate = (variant as Record<string, unknown>)[key]
    if (isStripePriceId(candidate)) {
      return candidate.trim()
    }
  }

  const metadataCandidate =
    typeof (variant as Record<string, unknown>).metadata === 'object' &&
    (variant as Record<string, unknown>).metadata !== null
      ? ((variant as Record<string, unknown>).metadata as Record<string, unknown>).stripe_price_id
      : null

  if (isStripePriceId(metadataCandidate)) {
    return metadataCandidate.trim()
  }

  return null
}

export async function POST(req: NextRequest) {
  let parsed: CheckoutPayload

  try {
    const body = await req.json()
    parsed = checkoutSchema.parse(body)
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.issues[0]?.message ?? 'Invalid request payload' : 'Invalid request payload'
    return NextResponse.json(
      {
        code: 'INVALID_PAYLOAD',
        message,
      },
      { status: 400 },
    )
  }

  const normalizedQuantity = normalizeQuantity(parsed.quantity)
  const variantId = parsed.variant_id?.trim()
  let priceId = parsed.priceId?.trim()

  try {
    if (!priceId && variantId) {
      const supabase = createServiceClient()
      priceId = await fetchPriceIdForVariant(supabase, variantId)
      if (!priceId) {
        return NextResponse.json(
          {
            code: 'MISSING_PRICE',
            message: 'Product variant is not mapped to a Stripe price.',
          },
          { status: 400 },
        )
      }
    }
  } catch (error) {
    return NextResponse.json(
      {
        code: 'MAPPING_ERROR',
        message: 'Unable to resolve Stripe price for requested variant.',
      },
      { status: 500 },
    )
  }

  if (!priceId || !isStripePriceId(priceId)) {
    return NextResponse.json(
      {
        code: 'MISSING_PRICE',
        message: 'Product variant is not mapped to a Stripe price.',
      },
      { status: 400 },
    )
  }

  const normalizedPayload = {
    priceId,
    quantity: normalizedQuantity,
    variant_id: variantId ?? null,
  }

  console.info('checkout.normalized_payload', normalizedPayload)

  const stripe = getStripe()
  const origin = buildOrigin(req)

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: normalizedQuantity,
        },
      ],
      success_url: `${origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart?cancelled=true`,
      automatic_tax: { enabled: true },
      shipping_address_collection: {
        allowed_countries: STRIPE_CONFIG.allowedCountries,
      },
    })

    if (!session.url) {
      return NextResponse.json(
        {
          code: 'STRIPE_ERROR',
          message: 'Checkout failed',
          detail: 'Missing Stripe session URL in response.',
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ url: session.url }, { status: 200 })
  } catch (error) {
    const requestId = randomUUID()
    console.error('checkout.stripe_error', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })

    return NextResponse.json(
      {
        code: 'STRIPE_ERROR',
        message: 'Checkout failed',
        requestId,
      },
      { status: 500 },
    )
  }
}
