import dynamic from 'next/dynamic'

// Dynamic imports to prevent SSR issues
const Navigation = dynamic(() => import('@/src/components/Navigation'), {
  loading: () => <div>Loading navigation...</div>
})

const Footer = dynamic(() => import('@/src/components/Footer'), {
  loading: () => <div>Loading footer...</div>
})

const SEOHead = dynamic(() => import('@/src/components/SEOHead'), {
  loading: () => null
})

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead />
      <Navigation />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export const metadata = {
  title: 'GrimForge - Premium Tabletop Gaming Accessories',
  description: 'Discover premium miniatures, dice, and gaming accessories for your tabletop adventures.',
}