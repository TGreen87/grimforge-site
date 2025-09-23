import { TablesInsert } from '@/integrations/supabase/types'
import { createServiceClient } from '@/lib/supabase/server'
import { writeAuditLog } from '@/lib/audit-logger'

export interface UpdateCampaignInput {
  slug: string
  title: string
  subtitle?: string
  description?: string
  layout?: string
  badgeText?: string
  highlightBullets?: string
  ctaPrimaryLabel?: string
  ctaPrimaryHref?: string
  ctaSecondaryLabel?: string
  ctaSecondaryHref?: string
  activate?: boolean
  imageUrl?: string
  backgroundVideoUrl?: string
}

export interface UpdateCampaignResult {
  message: string
  campaignId: string
  slug: string
  undo: {
    action: 'restore_campaign'
    campaignId: string
    slug: string
    previous: {
      title: string
      subtitle: string | null
      description: string | null
      layout: string
      badge_text: string | null
      highlight_items: string[] | null
      hero_image_url: string | null
      background_video_url: string | null
      cta_primary_label: string | null
      cta_primary_href: string | null
      cta_secondary_label: string | null
      cta_secondary_href: string | null
      active: boolean
    } | null
    wasNew: boolean
  }
}

export async function updateCampaignPipeline(options: {
  input: UpdateCampaignInput
  userId?: string | null
}): Promise<UpdateCampaignResult> {
  const supabase = createServiceClient()
  const layout = normaliseLayout(options.input.layout)
  const highlights = normaliseHighlights(options.input.highlightBullets)

  const { data: previous, error: previousError } = await supabase
    .from('campaigns')
    .select(
      'id, title, subtitle, description, layout, badge_text, highlight_items, hero_image_url, background_video_url, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, active'
    )
    .eq('slug', options.input.slug)
    .maybeSingle()

  if (previousError) {
    throw new Error(`Failed to load existing campaign: ${previousError.message}`)
  }

  const campaign: TablesInsert<'campaigns'> = {
    slug: options.input.slug,
    title: options.input.title,
    subtitle: options.input.subtitle ?? null,
    description: options.input.description ?? null,
    badge_text: options.input.badgeText ?? null,
    highlight_items: highlights,
    layout,
    hero_image_url: options.input.imageUrl ?? null,
    background_video_url: options.input.backgroundVideoUrl ?? null,
    cta_primary_label: options.input.ctaPrimaryLabel ?? 'Explore release',
    cta_primary_href: options.input.ctaPrimaryHref ?? '#vinyl',
    cta_secondary_label: options.input.ctaSecondaryLabel ?? null,
    cta_secondary_href: options.input.ctaSecondaryHref ?? null,
    active: Boolean(options.input.activate),
    sort_order: 0,
  }

  const { data, error } = await supabase
    .from('campaigns')
    .upsert(campaign, { onConflict: 'slug' })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`)
  }

  await writeAuditLog({
    event_type: 'assistant.campaign.update',
    resource_type: 'campaign',
    resource_id: data.id as string,
    user_id: options.userId ?? undefined,
    metadata: {
      slug: options.input.slug,
      active: Boolean(options.input.activate),
    },
  })

  return {
    message: `Updated campaign “${options.input.title}”.`,
    campaignId: data.id as string,
    slug: options.input.slug,
    undo: {
      action: 'restore_campaign',
      campaignId: data.id as string,
      slug: options.input.slug,
      previous: previous
        ? {
            title: previous.title,
            subtitle: previous.subtitle,
            description: previous.description,
            layout: previous.layout,
            badge_text: previous.badge_text,
            highlight_items: previous.highlight_items,
            hero_image_url: previous.hero_image_url,
            background_video_url: previous.background_video_url,
            cta_primary_label: previous.cta_primary_label,
            cta_primary_href: previous.cta_primary_href,
            cta_secondary_label: previous.cta_secondary_label,
            cta_secondary_href: previous.cta_secondary_href,
            active: previous.active,
          }
        : null,
      wasNew: !previous,
    },
  }
}

function normaliseLayout(layout?: string) {
  const allowed = ['classic', 'split', 'minimal']
  if (!layout) return 'classic'
  const lower = layout.toLowerCase()
  return allowed.includes(lower) ? lower : 'classic'
}

function normaliseHighlights(input?: string) {
  if (!input) return []
  return input
    .split(/[,\n]/)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 5)
}
