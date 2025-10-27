import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

import { getStripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase/server"
import { writeAuditLog, createPaymentAuditLog } from "@/lib/audit-logger"

const candidateKeys = [
  "stripe_price_id",
  "price_id",
  "priceId",
  "stripePriceId",
] as const

const RequestSchema = z
  .object({
    priceId: z.string().trim().min(1).optional(),
    variant_id: z.string().trim().min(1).optional(),
    quantity: z.number().int().min(1).optional(),
    items: z
      .array(
        z.object({
          variant_id: z.string().trim().min(1),
          quantity: z.number().int().min(1),
        })
      )
      .optional(),
  })
  .passthrough()

type ParsedRequest = z.infer<typeof RequestSchema>

type SupabaseClient = ReturnType<typeof createServiceClient>

type RecordLike = Record<string, unknown>

const clampQuantity = (value: number | undefined): number => {
  const normalized = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : 1
  return Math.min(10, Math.max(1, normalized))
}

const pickPriceId = (record?: RecordLike | null): string | undefined => {
  if (!record || typeof record !== "object") return undefined
  for (const key of candidateKeys) {
    const raw = record[key]
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw.trim()
    }
  }
  return undefined
}

const pickPriceFromMetadata = (metadata: unknown): string | undefined => {
  if (!metadata) return undefined
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata)
      return pickPriceId(parsed as RecordLike)
    } catch {
      return undefined
    }
  }
  if (typeof metadata === "object") {
    return pickPriceId(metadata as RecordLike)
  }
  return undefined
}

const resolvePriceId = async (
  supabase: SupabaseClient,
  variantId: string
): Promise<string | undefined> => {
  const { data: variantPrice, error: variantPriceError } = await supabase
    .from("variant_prices")
    .select("*")
    .eq("variant_id", variantId)
    .maybeSingle()

  if (variantPriceError) {
    console.warn("Failed to load variant_prices", variantPriceError)
  }

  const fromVariantPrice = pickPriceId(variantPrice as RecordLike | null)
  if (fromVariantPrice) {
    return fromVariantPrice
  }

  const { data: variant, error: variantError } = await supabase
    .from("variants")
    .select("*")
    .eq("id", variantId)
    .maybeSingle()

  if (variantError) {
    console.warn("Failed to load variant", variantError)
  }

  const fromVariant = pickPriceId(variant as RecordLike | null)
  if (fromVariant) {
    return fromVariant
  }

  const fromMetadata = pickPriceFromMetadata((variant as RecordLike | null)?.metadata)
  if (fromMetadata) {
    return fromMetadata
  }

  return undefined
}

const buildUrl = (origin: string, path: string): string => {
  try {
    return new URL(path, origin).toString()
  } catch {
    return `${origin.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`
  }
}

const invalidPayloadResponse = () =>
  NextResponse.json(
    {
      code: "INVALID_PAYLOAD",
      message: "Provide either priceId or variant_id with a quantity of at least 1.",
    },
    { status: 400 }
  )

export async function POST(req: NextRequest) {
  let requestBody: ParsedRequest | undefined

  try {
    const json = await req.json()
    const parsed = RequestSchema.safeParse(json)
    if (!parsed.success) {
      return invalidPayloadResponse()
    }
    requestBody = parsed.data
  } catch (error) {
    console.error("Failed to parse checkout payload", error)
    return NextResponse.json(
      { code: "INVALID_JSON", message: "Malformed JSON body." },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const primaryItem = Array.isArray(requestBody.items) && requestBody.items.length > 0 ? requestBody.items[0] : undefined
  let variantId = requestBody.variant_id ?? primaryItem?.variant_id
  variantId = typeof variantId === "string" && variantId.trim().length > 0 ? variantId.trim() : undefined
  let quantityCandidate = requestBody.quantity ?? primaryItem?.quantity

  if (!requestBody.priceId && !variantId) {
    return invalidPayloadResponse()
  }

  if (quantityCandidate === undefined) {
    return NextResponse.json(
      { code: "INVALID_QUANTITY", message: "Quantity is required." },
      { status: 400 }
    )
  }

  const quantity = clampQuantity(quantityCandidate)
  let priceId = requestBody.priceId?.trim()

  if (!priceId && variantId) {
    priceId = await resolvePriceId(supabase, variantId)
  }

  if (!priceId) {
    return NextResponse.json(
      {
        code: "MISSING_PRICE",
        message: "Product variant is not mapped to a Stripe price.",
      },
      { status: 400 }
    )
  }

  const normalizedLog = {
    priceId,
    variantId: variantId ?? null,
    quantity,
  }

  await writeAuditLog(
    createPaymentAuditLog({
      eventType: "checkout.normalized_payload",
      metadata: normalizedLog,
    })
  )

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    "https://obsidianriterecords.com"

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: priceId,
          quantity,
        },
      ],
      success_url: buildUrl(origin, "/order/success?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: buildUrl(origin, "/cart?cancelled=true"),
    })

    await writeAuditLog(
      createPaymentAuditLog({
        eventType: "checkout.session_created",
        metadata: {
          ...normalizedLog,
          sessionId: session.id,
        },
      })
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const requestId = uuidv4()
    console.error("Stripe checkout error", requestId, error)

    await writeAuditLog(
      createPaymentAuditLog({
        eventType: "checkout.error",
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          requestId,
          ...normalizedLog,
        },
      })
    )

    return NextResponse.json(
      {
        code: "STRIPE_ERROR",
        message: "Checkout failed",
        requestId,
      },
      { status: 500 }
    )
  }
}
