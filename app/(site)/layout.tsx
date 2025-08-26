import Navigation from '@/src/components/Navigation'
import Footer from '@/src/components/Footer'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="relative">
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

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'