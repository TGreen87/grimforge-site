import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ExtensionOverlayDetector from '@/components/ExtensionOverlayDetector'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen">
      <ExtensionOverlayDetector />
      <Navigation />
      <main className="relative">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export const metadata = {
  title: 'Obsidian Rite Records | Independent Black Metal Label and Store',
  description:
    'Independent label and store for underground black metal. Discover artists, releases, and limited runs.',
}

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'
