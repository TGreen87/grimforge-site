import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamic imports for better performance
const HeroSection = dynamic(() => import('@/components/hero-section'), {
  loading: () => <div className="h-96 bg-gray-100 animate-pulse" />
})

const FeaturedProducts = dynamic(() => import('@/src/components/FeaturedProducts'), {
  loading: () => <div className="h-64 bg-gray-100 animate-pulse" />
})

const NewsletterSignup = dynamic(() => import('@/src/components/NewsletterSignup'), {
  loading: () => <div className="h-32 bg-gray-100 animate-pulse" />
})

export default function HomePage() {
  return (
    <div className="space-y-12">
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
        <HeroSection />
      </Suspense>
      
      <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse" />}>
        <FeaturedProducts />
      </Suspense>
      
      <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse" />}>
        <NewsletterSignup />
      </Suspense>
    </div>
  )
}

export const metadata = {
  title: 'GrimForge - Premium Tabletop Gaming Accessories',
  description: 'Discover premium miniatures, dice, and gaming accessories for your tabletop adventures. Shop our curated collection of high-quality gaming gear.',
  keywords: 'tabletop gaming, miniatures, dice, gaming accessories, RPG, board games'
}