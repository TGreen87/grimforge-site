import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { TablesInsert } from '@/integrations/supabase/types'
import { assistantActionTypes } from '@/lib/assistant/actions'
import { writeAuditLog } from '@/lib/audit-logger'
import { formatAnalyticsSummary, getAnalyticsSummary } from '@/lib/analytics/overview'
import { logAssistantEvent } from '@/lib/assistant/sessions'
import { createProductFullPipeline } from '@/lib/assistant/pipelines/products'
import { draftArticlePipeline, publishArticlePipeline } from '@/lib/assistant/pipelines/articles'
import { updateCampaignPipeline } from '@/lib/assistant/pipelines/campaigns'
import { AssistantAttachment } from '@/lib/assistant/types'
import { assertAdmin } from '@/lib/assistant/auth'

// =============================================================================
// Function Execution Endpoint
// =============================================================================
// This endpoint executes function tools called by the streaming API.
// The frontend receives function_call events, then POSTs here to execute them.
// Results should be sent back to the model in the next turn.
// =============================================================================

const functionNameEnum = z.enum(assistantActionTypes)

const requestSchema = z.object({
  name: functionNameEnum,
  arguments: z.record(z.any()),
  sessionId: z.string().uuid().optional(),
  callId: z.string().optional(), // For tracking
})

// Helper for nullable optional values (OpenAI sends null for optional fields)
const nullStr = z.string().nullable().optional().transform(v => v ?? undefined)
const nullNum = z.number().nullable().optional().transform(v => v ?? undefined)
const nullBool = z.boolean().nullable().optional().transform(v => v ?? undefined)

// Individual parameter schemas
const createProductDraftSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  price: z.coerce.number().positive(),
  format: z.string().min(1),
  slug: nullStr,
  description: nullStr,
  tags: nullStr, // Comma-separated string from model
  image: nullStr,
  stock: z.coerce.number().int().min(0).nullable().optional(),
})

const receiveStockSchema = z.object({
  variant_id: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  notes: nullStr,
})

const summarizeAnalyticsSchema = z.object({
  range: z.enum(['24h', '7d', '30d']).nullable().optional(),
  pathname: nullStr,
})

const lookupOrderSchema = z.object({
  order_number: nullStr,
  email: nullStr,
})

const createProductFullSchema = z.object({
  brief: nullStr,
  title: nullStr,
  artist: nullStr,
  format: nullStr,
  price: z.coerce.number().positive().nullable().optional(),
  stock: z.coerce.number().int().min(0).nullable().optional(),
  publish: nullBool,
  featureOnHero: nullBool,
  heroLayout: nullStr,
  heroSubtitle: nullStr,
  heroBadge: nullStr,
  heroHighlights: nullStr,
  tags: nullStr,
})

const draftArticleSchema = z.object({
  brief: z.string().min(1),
  title: nullStr,
  wordCount: z.coerce.number().nullable().optional(),
  publish: nullBool,
  featured: nullBool,
  tags: nullStr,
  productSlug: nullStr,
})

const publishArticleSchema = z.object({
  articleId: nullStr,
  slug: nullStr,
  featured: nullBool,
})

const updateCampaignSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: nullStr,
  description: nullStr,
  layout: nullStr,
  badgeText: nullStr,
  highlightBullets: nullStr,
  ctaPrimaryLabel: nullStr,
  ctaPrimaryHref: nullStr,
  ctaSecondaryLabel: nullStr,
  ctaSecondaryHref: nullStr,
  activate: nullBool,
})

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'product'
}

// Function implementations
async function executeCreateProductDraft(args: z.infer<typeof createProductDraftSchema>, userId: string | null) {
  const supabase = createServiceClient()
  const slug = args.slug?.trim() || slugify(args.title)
  const price = Number(args.price)
  const stock = args.stock ?? 0
  const tags = args.tags?.split(',').map(t => t.trim()).filter(Boolean) ?? []

  const productInsert: TablesInsert<'products'> = {
    slug,
    title: args.title,
    artist: args.artist,
    description: args.description ?? null,
    price,
    format: args.format,
    image: args.image ?? null,
    active: false,
    featured: false,
    limited: false,
    pre_order: false,
    stock,
    tags,
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productInsert)
    .select('*')
    .single()

  if (productError) throw new Error(productError.message)

  const sku = `${slug.replace(/-/g, '').toUpperCase().slice(0, 10)}-STD`

  const { data: variant, error: variantError } = await supabase
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
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(variantError.message)
  }

  await supabase.from('inventory').insert({
    variant_id: variant.id,
    on_hand: stock,
    allocated: 0,
  })

  await writeAuditLog({
    event_type: 'assistant.product_draft.create',
    resource_type: 'product',
    resource_id: product.id,
    user_id: userId ?? undefined,
    metadata: { title: args.title, sku, assistant: true },
  })

  return {
    success: true,
    message: `Draft product "${args.title}" created. It's inactive and ready for review at /admin/products/${product.id}`,
    productId: product.id,
    variantId: variant.id,
    slug,
  }
}

async function executeReceiveStock(args: z.infer<typeof receiveStockSchema>, userId: string | null) {
  const supabase = createServiceClient()

  const { data: variant, error: variantError } = await supabase
    .from('variants')
    .select('id, name, product:products(title)')
    .eq('id', args.variant_id)
    .maybeSingle()

  if (variantError) throw new Error(variantError.message)
  if (!variant) return { success: false, error: 'Variant not found' }

  const { error: rpcError } = await supabase.rpc('receive_stock', {
    p_variant_id: args.variant_id,
    p_quantity: args.quantity,
    p_notes: args.notes ?? null,
    p_user_id: userId,
  })

  if (rpcError) throw new Error(rpcError.message)

  await writeAuditLog({
    event_type: 'assistant.inventory.receive',
    user_id: userId ?? undefined,
    resource_type: 'variant',
    resource_id: args.variant_id,
    metadata: { quantity: args.quantity, notes: args.notes, assistant: true },
  })

  const productTitle = (variant.product as any)?.title ?? 'product'
  return {
    success: true,
    message: `Received ${args.quantity} units for ${productTitle} — ${variant.name}.`,
    variantId: args.variant_id,
  }
}

async function executeSummarizeAnalytics(args: z.infer<typeof summarizeAnalyticsSchema>, userId: string | null) {
  const summary = await getAnalyticsSummary({
    range: args.range,
    pathname: args.pathname,
  })

  await writeAuditLog({
    event_type: 'assistant.analytics.summarize',
    user_id: userId ?? undefined,
    metadata: { range: summary.range, pathname: args.pathname, assistant: true },
  })

  return {
    success: true,
    message: formatAnalyticsSummary(summary),
    summary,
  }
}

async function executeLookupOrder(args: z.infer<typeof lookupOrderSchema>, userId: string | null) {
  const supabase = createServiceClient()

  let query = supabase
    .from('orders')
    .select(`
      id, order_number, email, status, payment_status, subtotal, shipping, total, currency, created_at,
      customer:customers(first_name, last_name),
      order_items:order_items(quantity, price, total, product_name, variant_name)
    `)

  if (args.order_number?.trim()) {
    query = query.eq('order_number', args.order_number.trim()).limit(1)
  } else if (args.email?.trim()) {
    query = query.eq('email', args.email.trim().toLowerCase()).order('created_at', { ascending: false }).limit(1)
  } else {
    return { success: false, error: 'Provide an order number or customer email' }
  }

  const { data: order, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  if (!order) return { success: false, error: 'Order not found' }

  const orderNumber = order.order_number ?? order.id
  const currency = (order.currency || 'AUD').toUpperCase()
  const createdAt = new Date(order.created_at).toLocaleString()
  const items = Array.isArray(order.order_items) ? order.order_items.slice(0, 3) : []
  const itemSummary = items
    .map((item: any) => `${item.quantity}x ${item.product_name ?? 'Item'}`)
    .join(', ')

  await writeAuditLog({
    event_type: 'assistant.order.lookup',
    user_id: userId ?? undefined,
    resource_type: 'order',
    resource_id: order.id,
    metadata: { order_number: orderNumber, assistant: true },
  })

  return {
    success: true,
    message: `Order ${orderNumber}: ${order.status} (payment: ${order.payment_status ?? 'unknown'}). Total: ${currency} ${order.total.toFixed(2)}. Items: ${itemSummary || 'none shown'}.`,
    order: {
      id: order.id,
      orderNumber,
      status: order.status,
      paymentStatus: order.payment_status,
      total: order.total,
      currency,
      createdAt,
    },
  }
}

async function executeCreateProductFull(args: z.infer<typeof createProductFullSchema>, userId: string | null) {
  const result = await createProductFullPipeline({
    input: args,
    attachments: [],
    userId,
  })

  return {
    success: true,
    message: result.message,
    productId: result.productId,
    variantId: result.variantId,
    slug: result.slug,
    published: result.published,
    heroUpdated: result.heroUpdated,
  }
}

async function executeDraftArticle(args: z.infer<typeof draftArticleSchema>, userId: string | null) {
  const result = await draftArticlePipeline({
    input: args,
    attachments: [],
    userId,
  })

  return {
    success: true,
    message: result.message,
    articleId: result.articleId,
    slug: result.slug,
  }
}

async function executePublishArticle(args: z.infer<typeof publishArticleSchema>, userId: string | null) {
  const result = await publishArticlePipeline({
    articleId: args.articleId,
    slug: args.slug,
    featured: args.featured,
    userId,
  })

  return {
    success: true,
    message: result.message,
    articleId: result.articleId,
    slug: result.slug,
  }
}

async function executeUpdateCampaign(args: z.infer<typeof updateCampaignSchema>, userId: string | null) {
  const result = await updateCampaignPipeline({
    input: args,
    userId,
  })

  return {
    success: true,
    message: result.message,
    campaignId: result.campaignId,
    slug: result.slug,
  }
}

export async function POST(request: NextRequest) {
  let sessionId: string | null = null
  let adminUserId: string | null = null

  try {
    const admin = await assertAdmin(request)
    if (!admin.ok) return admin.error
    adminUserId = admin.userId

    const json = await request.json()
    const parsed = requestSchema.safeParse(json)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    sessionId = parsed.data.sessionId ?? null
    const { name, arguments: args } = parsed.data

    let result: any

    switch (name) {
      case 'create_product_draft': {
        const payload = createProductDraftSchema.parse(args)
        result = await executeCreateProductDraft(payload, adminUserId)
        break
      }
      case 'receive_stock': {
        const payload = receiveStockSchema.parse(args)
        result = await executeReceiveStock(payload, adminUserId)
        break
      }
      case 'summarize_analytics': {
        const payload = summarizeAnalyticsSchema.parse(args)
        result = await executeSummarizeAnalytics(payload, adminUserId)
        break
      }
      case 'lookup_order_status': {
        const payload = lookupOrderSchema.parse(args)
        result = await executeLookupOrder(payload, adminUserId)
        break
      }
      case 'create_product_full': {
        const payload = createProductFullSchema.parse(args)
        result = await executeCreateProductFull(payload, adminUserId)
        break
      }
      case 'draft_article': {
        const payload = draftArticleSchema.parse(args)
        result = await executeDraftArticle(payload, adminUserId)
        break
      }
      case 'publish_article': {
        const payload = publishArticleSchema.parse(args)
        result = await executePublishArticle(payload, adminUserId)
        break
      }
      case 'update_campaign': {
        const payload = updateCampaignSchema.parse(args)
        result = await executeUpdateCampaign(payload, adminUserId)
        break
      }
      default:
        return NextResponse.json({ success: false, error: 'Unknown function' }, { status: 400 })
    }

    // Log the function execution
    if (sessionId) {
      await logAssistantEvent({
        sessionId,
        userId: adminUserId,
        eventType: 'function.executed',
        payload: { name, result },
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Function execution failed'
    console.error('Function execution error:', message)

    if (sessionId) {
      try {
        await logAssistantEvent({
          sessionId,
          userId: adminUserId,
          eventType: 'function.failed',
          payload: { error: message },
        })
      } catch {}
    }

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
