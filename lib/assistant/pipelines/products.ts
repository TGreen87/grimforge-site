import { z } from 'zod'
import { TablesInsert } from '@/integrations/supabase/types'
import { createServiceClient } from '@/lib/supabase/server'
import { callOpenAIJson } from '@/lib/assistant/openai'
import { AssistantAttachment } from '@/lib/assistant/types'
import { writeAuditLog } from '@/lib/audit-logger'

const PRODUCT_ENRICHMENT_SCHEMA = z.object({
  title: z.string(),
  artist: z.string(),
  description: z.string(),
  seoBlurb: z.string(),
  tags: z.array(z.string()).default([]),
  marketingHighlights: z.array(z.string()).default([]),
  variantName: z.string().default('Standard Edition'),
  skuSuffix: z.string().default('STD'),
  heroSubtitle: z.string().optional().nullable(),
  heroDescription: z.string().optional().nullable(),
})

const PRODUCT_SCHEMA_DESCRIPTION = `{
  "title": string,
  "artist": string,
  "description": string,
  "seoBlurb": string,
  "tags": string array (max 8 entries),
  "marketingHighlights": string array (max 5 entries),
  "variantName": string,
  "skuSuffix": string (3-6 uppercase letters),
  "heroSubtitle": string or null,
  "heroDescription": string or null
}`

export interface CreateProductFullInput {
  brief?: string
  title?: string
  artist?: string
  format?: string
  price?: number
  stock?: number
  publish?: boolean
  featureOnHero?: boolean
  heroLayout?: string
  heroSubtitle?: string
  heroBadge?: string
  heroHighlights?: string
  tags?: string
}

const PRODUCT_SYSTEM_PROMPT =
  process.env.ASSISTANT_PRODUCT_SYSTEM_PROMPT ||
  [
    'You are the release copywriter for Obsidian Rite Records. Craft short, vivid product descriptions that welcome both devoted fans and curious newcomers.',
    'Use rich sensory language, highlight pressing details, and avoid overused metal clichés.',
    'Base every fact on the brief or attachments—if a detail is missing, say so instead of inventing it.',
    'Close with a gentle nudge that invites listeners to experience the release.'
  ].join(' ')

export interface CreateProductFullResult {
  message: string
  productId: string
  variantId: string
  campaignId?: string
  slug: string
  published: boolean
  heroUpdated: boolean
  undo: {
    action: 'delete_product'
    productId: string
    variantId: string
    campaignId?: string | null
  }
}

export async function createProductFullPipeline(options: {
  input: CreateProductFullInput
  attachments: AssistantAttachment[]
  userId?: string | null
}) : Promise<CreateProductFullResult> {
  const { input, attachments } = options
  const supabase = createServiceClient()

  if (input.price === undefined || Number.isNaN(Number(input.price))) {
    throw new Error('Price is required to create a full product release')
  }

  const resolvedFormat = input.format?.toLowerCase() || 'vinyl'
  const tagList = normaliseTagList(input.tags)
  const attachmentContext = attachments.map((item) => `${item.name} (${item.type || 'file'})`).join(', ')

  const needsEnrichment = !input.title || !input.artist || tagList.length === 0 || !input.brief

  let enrichment: z.infer<typeof PRODUCT_ENRICHMENT_SCHEMA> | null = null
  if (needsEnrichment) {
    const userPrompt = [
      `Brief: ${input.brief ?? 'n/a'}`,
      `Provided title: ${input.title ?? 'n/a'}`,
      `Provided artist: ${input.artist ?? 'n/a'}`,
      `Format: ${resolvedFormat}`,
      `Price: AUD ${Number(input.price).toFixed(2)}`,
      `Initial stock: ${input.stock ?? 0}`,
      attachmentContext ? `Attachments: ${attachmentContext}` : null,
      'Tone: atmospheric black metal, ritualistic, ominous.',
    ]
      .filter(Boolean)
      .join('\n')

    enrichment = await callOpenAIJson({
      systemPrompt: PRODUCT_SYSTEM_PROMPT,
      userPrompt,
      schema: PRODUCT_ENRICHMENT_SCHEMA,
      schemaDescription: PRODUCT_SCHEMA_DESCRIPTION,
      temperature: 0.4,
    })
  }

  const title = (input.title ?? enrichment?.title ?? '').trim()
  const artist = (input.artist ?? enrichment?.artist ?? '').trim()
  if (!title || !artist) {
    throw new Error('Assistant could not determine title and artist from the brief. Provide these explicitly and retry.')
  }

  const description = (enrichment?.description ?? input.brief ?? '').trim()
  if (!description) {
    throw new Error('Assistant requires either a brief or description to populate product copy.')
  }

  const mergedTags = Array.from(new Set([...tagList, ...(enrichment?.tags ?? [])])).slice(0, 10)
  const marketingHighlights = extractHighlights(input.heroHighlights, enrichment?.marketingHighlights)

  const baseSlug = slugify(title)
  const slug = await ensureUniqueProductSlug(supabase, baseSlug)

  const imageUrl = attachments.find((file) => file.type?.startsWith('image/'))?.url ?? attachments[0]?.url ?? null
  const publish = Boolean(input.publish)

  const productInsert: TablesInsert<'products'> = {
    slug,
    title,
    artist,
    format: resolvedFormat,
    price: Number(input.price),
    description,
    image: imageUrl,
    tags: mergedTags,
    active: publish,
    featured: Boolean(input.featureOnHero),
    limited: false,
    pre_order: false,
    stock: input.stock ?? 0,
  }

  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productInsert)
    .select('*')
    .single()

  if (productError) {
    throw new Error(`Failed to create product: ${productError.message}`)
  }

  const skuBase = slug.replace(/-/g, '').toUpperCase()
  const skuSuffix = (enrichment?.skuSuffix ?? 'STD').replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'STD'
  const sku = `${skuBase}-${skuSuffix}`

  const variantInsert: TablesInsert<'variants'> = {
    product_id: product.id,
    name: enrichment?.variantName ?? 'Standard Edition',
    sku,
    price: Number(input.price),
    active: publish,
  }

  const { data: variant, error: variantError } = await supabase
    .from('variants')
    .insert(variantInsert)
    .select('*')
    .single()

  if (variantError) {
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(`Failed to create variant: ${variantError.message}`)
  }

  const { error: inventoryError } = await supabase
    .from('inventory')
    .insert({
      variant_id: variant.id,
      on_hand: input.stock ?? 0,
      allocated: 0,
      reorder_point: null,
      reorder_quantity: null,
    })

  if (inventoryError) {
    await supabase.from('variants').delete().eq('id', variant.id)
    await supabase.from('products').delete().eq('id', product.id)
    throw new Error(`Failed to create inventory record: ${inventoryError.message}`)
  }

  let campaignId: string | undefined
  let heroUpdated = false
  if (input.featureOnHero) {
    const campaignResult = await upsertCampaign({
      supabase,
      slug,
      title,
      subtitle: input.heroSubtitle ?? enrichment?.heroSubtitle ?? artist,
      description: enrichment?.heroDescription ?? description,
      imageUrl,
      layout: input.heroLayout,
      badgeText: input.heroBadge,
      highlights: marketingHighlights,
      ctaHref: `/products/${slug}`,
      activate: publish,
    })
    campaignId = campaignResult.campaignId
    heroUpdated = campaignResult.updated
  }

  await writeAuditLog({
    event_type: 'assistant.product.full_create',
    resource_type: 'product',
    resource_id: product.id,
    user_id: options.userId ?? undefined,
    metadata: {
      slug,
      price: Number(input.price),
      publish,
      heroUpdated,
    },
  })

  const messageParts = [`${publish ? 'Published' : 'Created draft for'} ${title} by ${artist}.`]
  if (heroUpdated) {
    messageParts.push('Updated the storefront hero with the new release.')
  }

  return {
    message: messageParts.join(' '),
    productId: product.id,
    variantId: variant.id,
    campaignId,
    slug,
    published: publish,
    heroUpdated,
    undo: {
      action: 'delete_product',
      productId: product.id,
      variantId: variant.id,
      campaignId: campaignId ?? null,
    },
  }
}

function normaliseTagList(tags?: string) {
  if (!tags) return []
  return tags
    .split(/[,\n]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.toLowerCase())
    .slice(0, 10)
}

function extractHighlights(highlights?: string, fallback?: string[]) {
  if (highlights) {
    return highlights
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5)
  }
  return (fallback ?? []).slice(0, 5)
}

function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'release'
  )
}

async function ensureUniqueProductSlug(supabase: ReturnType<typeof createServiceClient>, baseSlug: string) {
  let candidate = baseSlug
  let attempt = 1
  while (attempt <= 5) {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to verify product slug uniqueness: ${error.message}`)
    }
    if (!data) {
      return candidate
    }
    attempt += 1
    candidate = `${baseSlug}-${attempt}`
  }
  throw new Error('Unable to generate a unique product slug after multiple attempts')
}

async function upsertCampaign(options: {
  supabase: ReturnType<typeof createServiceClient>
  slug: string
  title: string
  subtitle?: string | null
  description?: string | null
  imageUrl?: string | null
  layout?: string | null
  badgeText?: string | null
  highlights: string[]
  ctaHref: string
  activate: boolean
}) {
  const supabase = options.supabase
  const layout = ['classic', 'split', 'minimal'].includes((options.layout ?? '').toLowerCase())
    ? options.layout!.toLowerCase()
    : 'classic'

  const campaignInsert: TablesInsert<'campaigns'> = {
    slug: options.slug,
    title: options.title,
    subtitle: options.subtitle ?? null,
    description: options.description ?? null,
    hero_image_url: options.imageUrl ?? null,
    badge_text: options.badgeText ?? null,
    highlight_items: options.highlights,
    cta_primary_label: 'Listen & Buy',
    cta_primary_href: options.ctaHref,
    layout,
    active: options.activate,
    sort_order: 0,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .upsert(campaignInsert, { onConflict: 'slug' })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to update campaign hero: ${error.message}`)
  }

  return { campaignId: data.id as string, updated: true }
}
