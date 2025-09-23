import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { assertAdmin } from '@/lib/assistant/auth'
import { loadUndoToken, markUndoCompleted } from '@/lib/assistant/undo'
import { logAssistantEvent } from '@/lib/assistant/sessions'

const requestSchema = z.object({
  token: z.string().uuid(),
})

export async function POST(request: NextRequest) {
  const admin = await assertAdmin(request)
  if (!admin.ok) {
    return admin.error
  }
  const adminUserId = admin.userId

  let body: unknown
  let parsed: z.infer<typeof requestSchema>
  try {
    body = await request.json()
    parsed = requestSchema.parse(body)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const undoEntry = await loadUndoToken(parsed.token)

  if (!undoEntry) {
    return NextResponse.json({ error: 'Undo token not found' }, { status: 404 })
  }

  if (undoEntry.undone_at) {
    return NextResponse.json({ error: 'Undo token already used' }, { status: 410 })
  }

  if (new Date(undoEntry.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'Undo token expired' }, { status: 410 })
  }

  const payload = (undoEntry.payload ?? {}) as Record<string, unknown>
  const supabase = createServiceClient()

  try {
    switch (undoEntry.action_type) {
      case 'create_product_full': {
        const productId = typeof payload.productId === 'string' ? payload.productId : null
        const variantId = typeof payload.variantId === 'string' ? payload.variantId : null
        const campaignId = typeof payload.campaignId === 'string' ? payload.campaignId : null
        if (!productId || !variantId) {
          throw new Error('Undo payload missing product references')
        }

        const { data: orderUsage, error: orderError } = await supabase
          .from('order_items')
          .select('id')
          .eq('variant_id', variantId)
          .limit(1)
          .maybeSingle()

        if (orderError) {
          throw new Error(orderError.message)
        }
        if (orderUsage) {
          return NextResponse.json({ error: 'Cannot undo: orders already reference this variant.' }, { status: 409 })
        }

        const { error: deleteProductError } = await supabase.from('products').delete().eq('id', productId)
        if (deleteProductError) {
          throw new Error(deleteProductError.message)
        }

        if (campaignId) {
          const { error: deleteCampaignError } = await supabase.from('campaigns').delete().eq('id', campaignId)
          if (deleteCampaignError) {
            throw new Error(deleteCampaignError.message)
          }
        }
        break
      }
      case 'draft_article': {
        const articleId = typeof payload.articleId === 'string' ? payload.articleId : null
        if (!articleId) {
          throw new Error('Undo payload missing article reference')
        }
        const { error: deleteArticleError } = await supabase.from('articles').delete().eq('id', articleId)
        if (deleteArticleError) {
          throw new Error(deleteArticleError.message)
        }
        break
      }
      case 'publish_article': {
        const articleId = typeof payload.articleId === 'string' ? payload.articleId : null
        const previousPublished = typeof payload.previousPublished === 'boolean' ? payload.previousPublished : false
        const previousPublishedAt =
          typeof payload.previousPublishedAt === 'string' || payload.previousPublishedAt === null
            ? (payload.previousPublishedAt as string | null)
            : null
        if (!articleId) {
          throw new Error('Undo payload missing article reference')
        }
        const { error: updateError } = await supabase
          .from('articles')
          .update({ published: previousPublished, published_at: previousPublishedAt })
          .eq('id', articleId)
        if (updateError) {
          throw new Error(updateError.message)
        }
        break
      }
      case 'update_campaign': {
        const campaignId = typeof payload.campaignId === 'string' ? payload.campaignId : null
        const wasNew = Boolean(payload.wasNew)
        const slug = typeof payload.slug === 'string' ? payload.slug : null
        const previous = (payload.previous as Record<string, unknown> | null) ?? null
        if (!campaignId || !slug) {
          throw new Error('Undo payload missing campaign reference')
        }
        if (wasNew) {
          const { error: deleteError } = await supabase.from('campaigns').delete().eq('id', campaignId)
          if (deleteError) {
            throw new Error(deleteError.message)
          }
        } else if (previous) {
          const updatePayload = {
            title: typeof previous.title === 'string' ? previous.title : undefined,
            subtitle:
              typeof previous.subtitle === 'string' || previous.subtitle === null
                ? (previous.subtitle as string | null)
                : null,
            description:
              typeof previous.description === 'string' || previous.description === null
                ? (previous.description as string | null)
                : null,
            layout: typeof previous.layout === 'string' ? previous.layout : undefined,
            badge_text:
              typeof previous.badge_text === 'string' || previous.badge_text === null
                ? (previous.badge_text as string | null)
                : null,
            highlight_items: Array.isArray(previous.highlight_items)
              ? (previous.highlight_items as string[])
              : null,
            hero_image_url:
              typeof previous.hero_image_url === 'string' || previous.hero_image_url === null
                ? (previous.hero_image_url as string | null)
                : null,
            background_video_url:
              typeof previous.background_video_url === 'string' || previous.background_video_url === null
                ? (previous.background_video_url as string | null)
                : null,
            cta_primary_label:
              typeof previous.cta_primary_label === 'string' || previous.cta_primary_label === null
                ? (previous.cta_primary_label as string | null)
                : null,
            cta_primary_href:
              typeof previous.cta_primary_href === 'string' || previous.cta_primary_href === null
                ? (previous.cta_primary_href as string | null)
                : null,
            cta_secondary_label:
              typeof previous.cta_secondary_label === 'string' || previous.cta_secondary_label === null
                ? (previous.cta_secondary_label as string | null)
                : null,
            cta_secondary_href:
              typeof previous.cta_secondary_href === 'string' || previous.cta_secondary_href === null
                ? (previous.cta_secondary_href as string | null)
                : null,
            active: typeof previous.active === 'boolean' ? previous.active : false,
          }
          const { error: updateCampaignError } = await supabase
            .from('campaigns')
            .update(updatePayload)
            .eq('id', campaignId)
          if (updateCampaignError) {
            throw new Error(updateCampaignError.message)
          }
        } else {
          throw new Error('Undo payload missing previous campaign state')
        }
        break
      }
      default:
        return NextResponse.json({ error: 'Undo not supported for this action' }, { status: 400 })
    }

    await markUndoCompleted(parsed.token)

    if (undoEntry.session_id) {
      await logAssistantEvent({
        sessionId: undoEntry.session_id,
        userId: adminUserId,
        eventType: 'action.undo_completed',
        payload: {
          token: parsed.token,
          actionType: undoEntry.action_type,
        },
      })
    }

    return NextResponse.json({ ok: true, message: 'Undo completed.' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Undo failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
