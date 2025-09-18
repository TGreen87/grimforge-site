// Server component wrapper to allow route segment options

import CampaignHero from '@/components/CampaignHero'
import ProductCatalog from '@/components/ProductCatalog'
import PreOrderSection from '@/components/PreOrderSection'
import GrimoireSection from '@/components/GrimoireSection'
import RecommendationEngine from '@/components/RecommendationEngine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const previewSlug = typeof searchParams?.previewCampaign === 'string' ? searchParams.previewCampaign : null
  return (
    <>
      {/* Feature-flagged hero; falls back to legacy hero when disabled */}
      <CampaignHero previewSlug={previewSlug} />
      <ProductCatalog />
      <div className="container mx-auto px-4 py-16">
        <RecommendationEngine />
      </div>
      <PreOrderSection />
      <GrimoireSection />
    </>
  )
}
