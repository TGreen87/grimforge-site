'use client'

import Link from 'next/link'
import { Callout } from '@/components/ui/callout'
import { Badge } from '@/components/ui/badge'

export function BentoHealth(props: {
  webhookStatus?: 'ok' | 'warn' | 'missing'
  missingOptions?: number
  zeroStock?: number
}) {
  const tiles = [
    {
      title: 'Webhooks',
      status: props.webhookStatus ?? 'missing',
      body:
        props.webhookStatus === 'ok'
          ? 'Latest Stripe webhooks succeeded.'
          : props.webhookStatus === 'warn'
          ? 'Recent webhook errors. Check the log.'
          : 'Webhook log not created yet. Run a checkout to populate.',
      href: '/admin/webhooks',
    },
    {
      title: 'Purchase options needed',
      count: props.missingOptions || 0,
      body:
        props.missingOptions && props.missingOptions > 0
          ? 'Open products and add an option with price + stock.'
          : 'All products have purchase options.',
      href: '/admin/products',
    },
    {
      title: 'Out of stock (active)',
      count: props.zeroStock || 0,
      body:
        props.zeroStock && props.zeroStock > 0
          ? 'Receive stock or set items inactive to hide from store.'
          : 'No active items are out of stock.',
      href: '/admin/inventory',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tiles.map((tile) => (
        <Link key={tile.title} href={tile.href} className="group">
          <div className="rounded-xl border border-border/60 bg-card/70 p-4 shadow-sm transition duration-150 group-hover:border-accent/80 group-hover:shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-foreground">{tile.title}</div>
              {'status' in tile && typeof tile.status === 'string' ? (
                <Badge variant={tile.status === 'ok' ? 'secondary' : tile.status === 'warn' ? 'destructive' : 'outline'}>
                  {tile.status === 'ok' ? 'OK' : tile.status === 'warn' ? 'Needs attention' : 'Setup'}
                </Badge>
              ) : null}
              {'count' in tile && tile.count !== undefined ? (
                <Badge variant={tile.count > 0 ? 'destructive' : 'secondary'}>{tile.count}</Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{tile.body}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
