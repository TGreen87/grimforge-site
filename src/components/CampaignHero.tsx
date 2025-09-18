import { createServiceClient } from '@/lib/supabase/server'
import HeroSection from './HeroSection'
import { CampaignHeroClient, CampaignHeroData } from './CampaignHeroClient'

const FEATURE_FLAG = process.env.NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN === '1'

function campaignIsActive(campaign: any): boolean {
  if (!campaign.active) return false
  const now = Date.now()
  if (campaign.starts_at && now < Date.parse(campaign.starts_at)) return false
  if (campaign.ends_at && now > Date.parse(campaign.ends_at)) return false
  return true
}

export default async function CampaignHero({ previewSlug }: { previewSlug?: string | null }) {
  if (!FEATURE_FLAG) {
    return <HeroSection />
  }

  const supabase = createServiceClient()
  let featuredCampaign: any = null

  if (previewSlug) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('title, subtitle, description, hero_image_url, background_video_url, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, audio_preview_url, active, starts_at, ends_at')
      .eq('slug', previewSlug)
      .maybeSingle()

    if (!error && data) {
      featuredCampaign = data
    }
  }

  if (!featuredCampaign) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('title, subtitle, description, hero_image_url, background_video_url, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, audio_preview_url, active, starts_at, ends_at')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Failed to load campaign hero', error)
      return <HeroSection />
    }

    featuredCampaign = (data ?? []).find(campaignIsActive)
  }

  if (!featuredCampaign) {
    return <HeroSection />
  }

  const payload: CampaignHeroData = {
    title: featuredCampaign.title,
    subtitle: featuredCampaign.subtitle,
    description: featuredCampaign.description,
    heroImageUrl: featuredCampaign.hero_image_url,
    backgroundVideoUrl: featuredCampaign.background_video_url,
    ctaPrimaryLabel: featuredCampaign.cta_primary_label,
    ctaPrimaryHref: featuredCampaign.cta_primary_href,
    ctaSecondaryLabel: featuredCampaign.cta_secondary_label,
    ctaSecondaryHref: featuredCampaign.cta_secondary_href,
    audioPreviewUrl: featuredCampaign.audio_preview_url,
  }

  return <CampaignHeroClient campaign={payload} />
}
