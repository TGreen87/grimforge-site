import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { TablesInsert } from '@/integrations/supabase/types'
import { assistantActionTypes } from '@/lib/assistant/actions'
import { writeAuditLog } from '@/lib/audit-logger'

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

const actionPayloadSchema = z.object({
  type: actionTypeEnum,
  parameters: z.record(z.any()).default({}),
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

async function assertAdmin(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (role?.role?.toLowerCase?.() === 'admin') {
    return { ok: true as const, userId: user.id }
  }

  return { ok: false as const, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = actionPayloadSchema.parse(body)

    const admin = await assertAdmin(request)
    if (!admin.ok) {
      return admin.error
    }

    switch (parsed.type) {
      case 'create_product_draft': {
        const payload = createProductDraftSchema.parse(parsed.parameters)
        const result = await handleCreateProductDraft(payload, admin.userId)
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      case 'receive_stock': {
        const payload = receiveStockSchema.parse(parsed.parameters)
        const result = await handleReceiveStock(payload, admin.userId)
        if ('notFound' in result) {
          return NextResponse.json({ error: 'Variant not found' }, { status: 404 })
        }
        return NextResponse.json({ ok: true, message: result.message, result })
      }
      default:
        return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Assistant action failed', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
