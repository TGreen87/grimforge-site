// Temporarily disable all dynamic imports to isolate build issues
// import dynamic from 'next/dynamic'

// const Navigation = dynamic(() => import('@/src/components/Navigation'), {
//   loading: () => <div>Loading navigation...</div>
// })

// const Footer = dynamic(() => import('@/src/components/Footer'), {
//   loading: () => <div>Loading footer...</div>
// })

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="p-4 bg-gray-100">
          <h1>Obsidian Rite Records</h1>
        </nav>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <footer className="p-4 bg-gray-100">
        <p>&copy; 2024 Obsidian Rite Records</p>
      </footer>
    </div>
  )
}

export const metadata = {
  title: 'GrimForge - Premium Tabletop Gaming Accessories',
  description: 'Discover premium miniatures, dice, and gaming accessories for your tabletop adventures.',
}

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'