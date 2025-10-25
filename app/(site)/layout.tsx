import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import ExtensionOverlayDetector from '@/components/ExtensionOverlayDetector'
import GrimnessControlPanel from '@/components/grimness/GrimnessControlPanel'
import FogLayer from '@/components/fx/FogLayer'
import GrimnessPageTransition from '@/components/fx/GrimnessPageTransition'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const grimnessEnabled = process.env.NEXT_PUBLIC_GRIMNESS_ENABLED === '1'
  return (
    <div className="min-h-screen">
      <ExtensionOverlayDetector />
      {grimnessEnabled ? <FogLayer /> : null}
      <Navigation />
      <main className="relative">
        {grimnessEnabled ? (
          <GrimnessPageTransition>
            {children}
          </GrimnessPageTransition>
        ) : (
          children
        )}
      </main>
      <Footer />
      {grimnessEnabled ? <GrimnessControlPanel /> : null}
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
