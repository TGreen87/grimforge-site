'use client'

import HeroSection from '@/src/components/HeroSection'
import ProductCatalog from '@/src/components/ProductCatalog'
import PreOrderSection from '@/src/components/PreOrderSection'
import GrimoireSection from '@/src/components/GrimoireSection'
import RecommendationEngine from '@/src/components/RecommendationEngine'

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

