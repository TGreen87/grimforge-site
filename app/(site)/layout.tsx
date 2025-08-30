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
  title: 'Obsidian Rite Records - Dark Music for Dark Souls',
  description: 'Obsidian Rite Records is an independent underground metal record label. Discover exclusive releases, limited edition vinyl, cassettes, and merchandise from the darkest corners of the metal underground.',
}

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'