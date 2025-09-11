export default function CatalogSkeleton() {
  const items = Array.from({ length: 8 })
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {items.map((_, i) => (
        <div key={i} className="animate-pulse bg-card/50 border border-border rounded p-3 md:p-4">
          <div className="aspect-square mb-3 md:mb-4 bg-secondary/40 rounded" />
          <div className="h-4 bg-secondary/40 rounded w-3/4 mb-2" />
          <div className="h-3 bg-secondary/30 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}

