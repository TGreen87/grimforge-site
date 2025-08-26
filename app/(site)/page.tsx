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

export const metadata = {
  title: 'GrimForge - Premium Tabletop Gaming Accessories',
  description: 'Discover premium miniatures, dice, and gaming accessories for your tabletop adventures. Shop our curated collection of high-quality gaming gear.',
  keywords: 'tabletop gaming, miniatures, dice, gaming accessories, RPG, board games'
}

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'