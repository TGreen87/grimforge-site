'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, Boxes, Download, PackageCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  awaitingFulfillment: number
  lowStockCount: number
  pendingPaymentCount: number
  fulfilmentThreshold?: number
  lowStockThreshold?: number
  alertsEnabled?: boolean
}

export default function NeedsFulfillmentPanel({
  awaitingFulfillment,
  lowStockCount,
  pendingPaymentCount,
  fulfilmentThreshold = 0,
  lowStockThreshold = 0,
  alertsEnabled = true,
}: Props) {
  const fulfilmentAlert = alertsEnabled && fulfilmentThreshold > 0 && awaitingFulfillment >= fulfilmentThreshold
  const lowStockAlert = alertsEnabled && lowStockThreshold > 0 && lowStockCount >= lowStockThreshold
  const safeLowStockThreshold = lowStockThreshold && lowStockThreshold > 0 ? lowStockThreshold : 5

  const tasks: Array<{
    label: string
    count: number
    description: string
    href: string
    exportHref?: string
    icon: React.ReactNode
    tone: 'default' | 'warning' | 'danger'
  }> = [
    {
      label: 'Ship paid orders',
      count: awaitingFulfillment,
      description: fulfilmentAlert ? `Above threshold (${fulfilmentThreshold}). Prioritise pack & ship.` : 'Paid orders waiting for pick & pack',
      href: '/admin/orders?filter=paid',
      exportHref: '/api/admin/export/orders?scope=awaiting-fulfilment',
      icon: <PackageCheck className="h-4 w-4" />,
      tone: fulfilmentAlert ? 'danger' : awaitingFulfillment > 0 ? 'warning' : 'default',
    },
    {
      label: 'Re-stock low inventory',
      count: lowStockCount,
      description: lowStockAlert ? `Low stock exceeds threshold (${lowStockThreshold}). Reorder soon.` : 'Variants at or below the safety threshold',
      href: '/admin/inventory?filter=low-stock',
      exportHref: `/api/admin/export/inventory?scope=low-stock&threshold=${safeLowStockThreshold}`,
      icon: <Boxes className="h-4 w-4" />,
      tone: lowStockAlert ? 'danger' : lowStockCount > 0 ? 'warning' : 'default',
    },
    {
      label: 'Follow up pending payments',
      count: pendingPaymentCount,
      description: 'Check on orders stuck before payment',
      href: '/admin/orders?filter=pending-payment',
      exportHref: '/api/admin/export/orders?scope=pending-payment',
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: pendingPaymentCount > 0 ? 'warning' : 'default',
    },
  ]

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => {
        const toneClass = cn({
          'text-rose-200': task.tone === 'danger',
          'text-amber-200': task.tone === 'warning',
          'text-muted-foreground': task.tone === 'default',
        })

        return (
          <motion.div
            key={task.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 p-3"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm font-medium text-bone">
                <span className={cn(task.tone === 'danger' ? 'text-rose-300' : task.tone === 'warning' ? 'text-amber-300' : 'text-muted-foreground')}>{task.icon}</span>
                {task.label}
              </div>
              <p className="text-xs text-muted-foreground">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-semibold tabular-nums', toneClass)}>{task.count}</span>
              <div className="flex items-center gap-1">
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  disabled={task.count === 0}
                >
                  <Link href={task.href} aria-label={`Review ${task.label.toLowerCase()}`}>
                    Review
                  </Link>
                </Button>
                {task.exportHref && (
                  task.count > 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      asChild
                    >
                      <a href={task.exportHref} download aria-label={`Export ${task.label} CSV`}>
                        <span className="sr-only">Export {task.label} CSV</span>
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled
                      className="text-muted-foreground/60"
                      aria-label={`Export ${task.label} CSV (disabled)`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
