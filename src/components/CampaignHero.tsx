import { notFound } from 'next/navigation'

import { createServiceClient } from '@/lib/supabase/server'
import HeroSection from './HeroSection'
import { CampaignHeroClient, CampaignHeroData } from './CampaignHeroClient'

const FEATURE_FLAG = process.env.NEXT_PUBLIC_FEATURE_HERO_CAMPAIGN === '1'

export default async function CampaignHero() {
  if (!FEATURE_FLAG) {
    return <HeroSection />
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('campaigns')
    .select('title, subtitle, description, hero_image_url, background_video_url, cta_primary_label, cta_primary_href, cta_secondary_label, cta_secondary_href, audio_preview_url')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Failed to load campaign hero', error)
    return <HeroSection />
  }

  const campaign = (data ?? [])[0]

  if (!campaign) {
    return <HeroSection />
  }

  const payload: CampaignHeroData = {
    title: campaign.title,
    subtitle: campaign.subtitle,
    description: campaign.description,
    heroImageUrl: campaign.hero_image_url,
    backgroundVideoUrl: campaign.background_video_url,
    ctaPrimaryLabel: campaign.cta_primary_label,
    ctaPrimaryHref: campaign.cta_primary_href,
    ctaSecondaryLabel: campaign.cta_secondary_label,
    ctaSecondaryHref: campaign.cta_secondary_href,
    audioPreviewUrl: campaign.audio_preview_url,
  }

  return <CampaignHeroClient campaign={payload} />
}
