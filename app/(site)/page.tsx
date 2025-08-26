export default function HomePage() {
  return (
    <div className="space-y-12 p-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Obsidian Rite Records</h1>
        <p className="text-xl text-gray-600">Underground Black Metal Label</p>
      </section>
      
      <section className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
        <p>Product catalog will be available once the migration is complete.</p>
      </section>
      
      <section className="text-center">
        <h2 className="text-2xl font-semibold mb-4">Newsletter</h2>
        <p>Stay updated with our latest releases.</p>
      </section>
    </div>
  )
}

export const metadata = {
  title: 'GrimForge - Premium Tabletop Gaming Accessories',
  description: 'Discover premium miniatures, dice, and gaming accessories for your tabletop adventures. Shop our curated collection of high-quality gaming gear.',
  keywords: 'tabletop gaming, miniatures, dice, gaming accessories, RPG, board games'
}

// Disable static generation for now to avoid SSR issues with contexts
export const dynamic = 'force-dynamic'