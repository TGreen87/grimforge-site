import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { TablesInsert } from '@/integrations/supabase/types'
import { assistantActionTypes } from '@/lib/assistant/actions'
import { writeAuditLog } from '@/lib/audit-logger'
import { formatAnalyticsSummary, getAnalyticsSummary } from '@/lib/analytics/overview'
import { ensureAssistantSession, logAssistantEvent } from '@/lib/assistant/sessions'
import { createProductFullPipeline } from '@/lib/assistant/pipelines/products'
import { draftArticlePipeline, publishArticlePipeline } from '@/lib/assistant/pipelines/articles'
import { updateCampaignPipeline } from '@/lib/assistant/pipelines/campaigns'
import { AssistantAttachment } from '@/lib/assistant/types'
import { createUndoToken } from '@/lib/assistant/undo'
import { assertAdmin } from '@/lib/assistant/auth'

const actionTypeEnum = z.enum(assistantActionTypes)

const createProductDraftSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  price: z.coerce.number().positive(),
  format: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().url().optional(),
  stock: z.coerce.number().int().min(0).optional(),
})

const receiveStockSchema = z.object({
  variant_id: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  notes: z.string().max(500).optional(),
})

const summarizeAnalyticsSchema = z.object({
  range: z.enum(['24h', '7d', '30d']).optional(),
  pathname: z.string().min(1).optional(),
})

const lookupOrderSchema = z
  .object({
    order_number: z.string().min(3).optional(),
    email: z.string().email().optional(),
  })
  .refine((value) => Boolean(value.order_number?.trim() || value.email?.trim()), {
    message: 'Provide an order number or customer email',
    path: ['order_number'],
  })

const actionPayloadSchema = z.object({
  type: actionTypeEnum,
  parameters: z.record(z.any()).default({}),
  sessionId: z.string().uuid().optional(),
})

const createProductFullSchema = z.object({
  brief: z.string().optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  format: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).optional(),
  publish: z.boolean().optional(),
  featureOnHero: z.boolean().optional(),
  heroLayout: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroBadge: z.string().optional(),
  heroHighlights: z.string().optional(),
  tags: z.string().optional(),
})

const draftArticleSchema = z.object({
  brief: z.string().min(8),
  title: z.string().optional(),
  wordCount: z.coerce.number().optional(),
  publish: z.boolean().optional(),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  productSlug: z.string().optional(),
})

const publishArticleSchema = z.object({
  articleId: z.string().uuid().optional(),
  slug: z.string().optional(),
  featured: z.boolean().optional(),
})

const updateCampaignSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(3),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  layout: z.string().optional(),
  badgeText: z.string().optional(),
  highlightBullets: z.string().optional(),
  ctaPrimaryLabel: z.string().optional(),
  ctaPrimaryHref: z.string().optional(),
  ctaSecondaryLabel: z.string().optional(),
  ctaSecondaryHref: z.string().optional(),
  activate: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  backgroundVideoUrl: z.string().url().optional(),
})

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'product'
  )
}

async function handleCreateProductDraft(payload: z.infer<typeof createProductDraftSchema>, userId: string | null) {
  const adminClient = createServiceClient()

  const slug = payload.slug?.trim() || slugify(payload.title)
  const price = Number(payload.price)
  const stock = typeof payload.stock === 'number' && payload.stock > 0 ? payload.stock : 0

  const productInsert: TablesInsert<'products'> = {
    slug,
    title: payload.title,
    artist: payload.artist,
    description: payload.description ?? null,
    price,
    format: payload.format,
    image: payload.image ?? null,
    active: false,
    featured: false,
    limited: false,
    pre_order: false,
    stock,
    tags: payload.tags ?? [],
  }

  const { data: product, error: productError } = await adminClient
    .from('products')
    .insert(productInsert)
    .select('*')
    .single()

  if (productError) {
    throw new Error(productError.message)
  }

  const sku = `${slug.replace(/-/g, '').toUpperCase().slice(0, 10)}-STD`

  const { data: variant, error: variantError } = await adminClient
    .from('variants')
    .insert({
      product_id: product.id,
      name: 'Standard Edition',
      sku,
      price,
      active: false,
    })
    .select('*')
    .single()

  if (variantError) {
    await adminClient.from('products').delete().eq('id', product.id)
    throw new Error(variantError.message)
  }

  const { error: inventoryError } = await adminClient
    .from('inventory')
    .insert({
      variant_id: variant.id,
      on_hand: stock,
      allocated: 0,
      reorder_point: null,
      reorder_quantity: null,
    })

  if (inventoryError) {
    await adminClient.from('variants').delete().eq('id', variant.id)
    await adminClient.from('products').delete().eq('id', product.id)
    throw new Error(inventoryError.message)
  }

  await adminClient.from('audit_logs').insert({
    event_type: 'assistant.product_draft.create',
    resource_type: 'product',
    resource_id: product.id,
    user_id: userId,
    metadata: {
      title: payload.title,
      sku,
      assistant: true,
    },
  })

  return {
    message: `Draft product “${payload.title}” created and left inactive for review.`,
    productId: product.id,
    variantId: variant.id,
  }
}

async function handleReceiveStock(
  payload: z.infer<typeof receiveStockSchema>,
  userId: string | null
): Promise<{ message: string; variantId: string } | { notFound: true; variantId: string; message: null }> {
  const supabase = createServiceClient()

  type VariantRecord = {
    id: string
    name: string
    product: { title: string | null } | null
  }

  const { data: variant, error: variantError } = await supabase
    .from('variants')
    .select('id, name, product:products(title)')
    .eq('id', payload.variant_id)
    .maybeSingle<VariantRecord>()

  if (variantError) {
    throw new Error(variantError.message)
  }

  if (!variant) {
    return { message: null, variantId: payload.variant_id, notFound: true as const }
  }

  const { error: rpcError } = await supabase.rpc('receive_stock', {
    p_variant_id: payload.variant_id,
    p_quantity: payload.quantity,
    p_notes: payload.notes ?? null,
    p_user_id: userId,
  })

  if (rpcError) {
    throw new Error(rpcError.message)
  }

  await writeAuditLog({
    event_type: 'assistant.inventory.receive',
    user_id: userId ?? undefined,
    resource_type: 'variant',
    resource_id: payload.variant_id,
    metadata: {
      quantity: payload.quantity,
      notes: payload.notes ?? null,
      assistant: true,
    },
  })

  return {
    message: `Received ${payload.quantity} units for ${variant.product?.title ?? 'product'} — ${variant.name}.`,
    variantId: payload.variant_id,
  }
}

async function handleSummarizeAnalytics(payload: z.infer<typeof summarizeAnalyticsSchema>, userId: string | null) {
  const summary = await getAnalyticsSummary({
    range: payload.range,
    pathname: payload.pathname,
  })

  await writeAuditLog({
    event_type: 'assistant.analytics.summarize',
    user_id: userId ?? undefined,
    metadata: {
      range: summary.range,
      pathname: payload.pathname ?? null,
      assistant: true,
    },
  })

  const message = formatAnalyticsSummary(summary)

  return {
    message,
    summary,
  }
}

async function handleLookupOrderStatus(payload: z.infer<typeof lookupOrderSchema>, userId: string | null) {
  const supabase = createServiceClient()
  const trimmedOrder = payload.order_number?.trim()
  const trimmedEmail = payload.email?.trim().toLowerCase()

  let query = supabase
    .from('orders')
    .select(
      `id, order_number, email, status, payment_status, subtotal, shipping, total, currency, created_at, metadata,
       customer:customers(first_name, last_name),
       order_items:order_items(quantity, price, total, product_name, variant_name)
      `
    )

  if (trimmedOrder) {
    query = query.eq('order_number', trimmedOrder).limit(1)
  } else if (trimmedEmail) {
    query = query.eq('email', trimmedEmail).order('created_at', { ascending: false }).limit(1)
  }

  const { data: order, error } = await query.maybeSingle<{
    id: string
    order_number: string | null
    email: string
    status: string
    payment_status: string | null
    subtotal: number | null
    shipping: number | null
    total: number
    currency: string | null
    created_at: string
    metadata: Record<string, unknown> | null
    customer: { first_name: string | null; last_name: string | null } | null
    order_items: Array<{ quantity: number; price: number; total: number; product_name: string | null; variant_name: string | null }>
  }>()

  if (error) {
    throw new Error(error.message)
  }

  if (!order) {
    return { message: null, notFound: true as const }
  }

  const orderNumber = order.order_number ?? order.id
  const currency = (order.currency || 'AUD').toUpperCase()
  const createdAt = new Date(order.created_at).toLocaleString()
  const items = Array.isArray(order.order_items) ? order.order_items.slice(0, 3) : []
  const itemSummary = items
    .map((item) => `${item.quantity} × ${item.product_name ?? 'Item'}${item.variant_name ? ` (${item.variant_name})` : ''}`)
    .join('; ')
  const customerName = order.customer
    ? [order.customer.first_name, order.customer.last_name].filter(Boolean).join(' ') || null
    : null

  const messageParts: string[] = []
  messageParts.push(`Order ${orderNumber} is ${order.status.toLowerCase()} with payment status ${order.payment_status ?? 'unknown'}.`)
  messageParts.push(`Total: ${currency} ${order.total.toFixed(2)} (placed ${createdAt}).`)
  if (customerName) {
    messageParts.push(`Customer: ${customerName} <${order.email}>.`)
  } else {
    messageParts.push(`Customer email: ${order.email}.`)
  }
  if (itemSummary) {
    messageParts.push(`Key items: ${itemSummary}.`)
    if (order.order_items.length > items.length) {
      messageParts.push(`+${order.order_items.length - items.length} more items.`)
    }
  }

  await writeAuditLog({
    event_type: 'assistant.order.lookup',
    user_id: userId ?? undefined,
    resource_type: 'order',
    resource_id: order.id,
    metadata: {
      order_number: orderNumber,
      email: order.email,
      assistant: true,
      looked_up_via: trimmedOrder ? 'order_number' : 'email',
    },
  })

  return {
    message: messageParts.join(' '),
    order,
  }
}

export async function POST(request: NextRequest) {
  let sessionId: string | null = null
  let adminUserId: string | null = null
  let parsed: z.infer<typeof actionPayloadSchema> | null = null
  let rawBody: unknown
  try {
    rawBody = await request.json()
    parsed = actionPayloadSchema.parse(rawBody)

    const admin = await assertAdmin(request)
    if (!admin.ok) {
      return admin.error
    }
    adminUserId = admin.userId

    sessionId = parsed.sessionId ?? null
    if (sessionId) {
      await ensureAssistantSession({ sessionId, userId: adminUserId })
    }

    switch (parsed.type) {
      case 'create_product_draft': {
        const payload = createProductDraftSchema.parse(parsed.parameters)
        const result = await handleCreateProductDraft(payload, admin.userId)
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: {
              type: parsed.type,
              result,
            },
          })
        }
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      case 'receive_stock': {
        const payload = receiveStockSchema.parse(parsed.parameters)
        const result = await handleReceiveStock(payload, admin.userId)
        if ('notFound' in result) {
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.failed',
              payload: { type: parsed.type, error: 'Variant not found', parameters: payload },
            })
          }
          return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: {
              type: parsed.type,
              result,
            },
          })
        }
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      case 'summarize_analytics': {
        const payload = summarizeAnalyticsSchema.parse(parsed.parameters)
        const result = await handleSummarizeAnalytics(payload, admin.userId)
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: {
              type: parsed.type,
              result,
            },
          })
        }
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      case 'lookup_order_status': {
        const payload = lookupOrderSchema.parse(parsed.parameters)
        const result = await handleLookupOrderStatus(payload, admin.userId)
        if ('notFound' in result) {
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.failed',
              payload: { type: parsed.type, error: 'Order not found', parameters: payload },
            })
          }
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: {
              type: parsed.type,
              result,
            },
          })
        }
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      case 'create_product_full': {
        const { attachments, cleaned } = extractAttachments(parsed.parameters)
        const payload = createProductFullSchema.parse(cleaned)
        const result = await createProductFullPipeline({
          input: payload,
          attachments,
          userId: adminUserId,
        })
        const { undo: undoPayload, ...resultWithoutUndo } = result
        let undoToken: { token: string; expiresAt: string } | null = null
        if (undoPayload) {
          undoToken = await createUndoToken({
            actionType: parsed.type,
            payload: undoPayload,
            sessionId,
            userId: adminUserId,
          })
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.undo_available',
              payload: { type: parsed.type, token: undoToken.token, expiresAt: undoToken.expiresAt },
            })
          }
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: { type: parsed.type, result: resultWithoutUndo },
          })
        }
        return NextResponse.json({
          ok: true,
          message: result.message,
          result: resultWithoutUndo,
          sessionId,
          undo: undoToken,
        })
      }
      case 'draft_article': {
        const { attachments, cleaned } = extractAttachments(parsed.parameters)
        const payload = draftArticleSchema.parse(cleaned)
        const result = await draftArticlePipeline({
          input: payload,
          attachments,
          userId: adminUserId,
        })
        const { undo: undoPayload, ...resultWithoutUndo } = result
        let undoToken: { token: string; expiresAt: string } | null = null
        if (undoPayload) {
          undoToken = await createUndoToken({
            actionType: parsed.type,
            payload: undoPayload,
            sessionId,
            userId: adminUserId,
          })
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.undo_available',
              payload: { type: parsed.type, token: undoToken.token, expiresAt: undoToken.expiresAt },
            })
          }
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: { type: parsed.type, result: resultWithoutUndo },
          })
        }
        return NextResponse.json({
          ok: true,
          message: result.message,
          result: resultWithoutUndo,
          sessionId,
          undo: undoToken,
        })
      }
      case 'publish_article': {
        const payload = publishArticleSchema.parse(parsed.parameters)
        const result = await publishArticlePipeline({
          articleId: payload.articleId,
          slug: payload.slug,
          featured: payload.featured,
          userId: adminUserId,
        })
        const { undo: undoPayload, ...resultWithoutUndo } = result
        let undoToken: { token: string; expiresAt: string } | null = null
        if (undoPayload) {
          undoToken = await createUndoToken({
            actionType: parsed.type,
            payload: undoPayload,
            sessionId,
            userId: adminUserId,
          })
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.undo_available',
              payload: { type: parsed.type, token: undoToken.token, expiresAt: undoToken.expiresAt },
            })
          }
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: { type: parsed.type, result: resultWithoutUndo },
          })
        }
        return NextResponse.json({
          ok: true,
          message: result.message,
          result: resultWithoutUndo,
          sessionId,
          undo: undoToken,
        })
      }
      case 'update_campaign': {
        const payload = updateCampaignSchema.parse(parsed.parameters)
        const result = await updateCampaignPipeline({ input: payload, userId: adminUserId })
        const { undo: undoPayload, ...resultWithoutUndo } = result
        let undoToken: { token: string; expiresAt: string } | null = null
        if (undoPayload) {
          undoToken = await createUndoToken({
            actionType: parsed.type,
            payload: undoPayload,
            sessionId,
            userId: adminUserId,
          })
          if (sessionId) {
            await logAssistantEvent({
              sessionId,
              userId: adminUserId,
              eventType: 'action.undo_available',
              payload: { type: parsed.type, token: undoToken.token, expiresAt: undoToken.expiresAt },
            })
          }
        }
        if (sessionId) {
          await logAssistantEvent({
            sessionId,
            userId: adminUserId,
            eventType: 'action.completed',
            payload: { type: parsed.type, result: resultWithoutUndo },
          })
        }
        return NextResponse.json({
          ok: true,
          message: result.message,
          result: resultWithoutUndo,
          sessionId,
          undo: undoToken,
        })
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Assistant action failed', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    if (sessionId) {
      try {
        await logAssistantEvent({
          sessionId,
          userId: adminUserId ?? null,
          eventType: 'action.failed',
          payload: { type: parsed?.type ?? (typeof rawBody === 'object' && rawBody ? (rawBody as any).type : undefined), error: message },
        })
      } catch (logError) {
        console.error('Failed to log assistant action error', logError)
      }
    }
    return NextResponse.json({ error: message, sessionId: sessionId ?? undefined }, { status: 500 })
  }
}

function extractAttachments(parameters: Record<string, unknown>): { attachments: AssistantAttachment[]; cleaned: Record<string, unknown> } {
  const { __attachments, ...rest } = parameters as Record<string, unknown> & { __attachments?: unknown }
  const attachments: AssistantAttachment[] = []

  if (Array.isArray(__attachments)) {
    for (const raw of __attachments) {
      const normalised = normaliseAttachment(raw)
      if (normalised) {
        attachments.push(normalised)
      }
    }
  }

  return { attachments, cleaned: rest }
}

function normaliseAttachment(raw: unknown): AssistantAttachment | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Record<string, unknown>
  if (typeof candidate.url !== 'string') return null
  return {
    name: typeof candidate.name === 'string' ? candidate.name : 'attachment',
    url: candidate.url,
    type: typeof candidate.type === 'string' ? candidate.type : null,
    storagePath: typeof candidate.storagePath === 'string' ? candidate.storagePath : null,
    size: typeof candidate.size === 'number' ? candidate.size : null,
  }
}
