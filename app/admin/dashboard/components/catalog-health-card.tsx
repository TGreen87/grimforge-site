import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export type CatalogHealthSummary = {
  missingVariants: { id: string; title: string }[]
  zeroStock: { variantId: string; title: string; available: number | null }[]
}

export function CatalogHealthCard({ summary }: { summary: CatalogHealthSummary }) {
  const hasIssues = summary.missingVariants.length > 0 || summary.zeroStock.length > 0

  return (
    <Card className="border-border/80 bg-card/70">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          Catalog health
          {!hasIssues && <Badge variant="secondary">Healthy</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        {summary.missingVariants.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground">
              <Badge variant="destructive">Action</Badge>
              Products without an active variant
            </div>
            <ul className="space-y-1">
              {summary.missingVariants.slice(0, 4).map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/edit/${p.id}`} className="text-foreground hover:underline">
                    {p.title || 'Untitled product'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No products are missing active variants.</p>
        )}

        {summary.zeroStock.length > 0 ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-foreground">
              <Badge variant="outline">Stock</Badge>
              Active variants at zero stock
            </div>
            <ul className="space-y-1">
              {summary.zeroStock.slice(0, 4).map((v) => (
                <li key={v.variantId} className="flex items-center justify-between gap-2">
                  <span className="text-foreground">{v.title || 'Variant'}</span>
                  <span className="text-xs text-muted-foreground">Available: {v.available ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No active variants are at zero stock.</p>
        )}
      </CardContent>
    </Card>
  )
}
