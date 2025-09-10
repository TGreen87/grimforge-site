'use client'

import HeroSection from '@/components/HeroSection'
import ProductCatalog from '@/components/ProductCatalog'
import PreOrderSection from '@/components/PreOrderSection'
import GrimoireSection from '@/components/GrimoireSection'
import RecommendationEngine from '@/components/RecommendationEngine'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProductCatalog />
      <div className="container mx-auto px-4 py-16">
        <RecommendationEngine />
      </div>
      <PreOrderSection />
      <GrimoireSection />
    </>
  )
}
