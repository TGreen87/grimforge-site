'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, Boxes, PackageCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface Props {
  awaitingFulfillment: number
  lowStockCount: number
  pendingPaymentCount: number
}

export default function NeedsFulfillmentPanel({ awaitingFulfillment, lowStockCount, pendingPaymentCount }: Props) {
  const tasks: Array<{
    label: string
    count: number
    description: string
    href: string
    icon: React.ReactNode
    tone: 'default' | 'warning' | 'danger'
  }> = [
    {
      label: 'Ship paid orders',
      count: awaitingFulfillment,
      description: 'Paid orders waiting for pick & pack',
      href: '/admin/orders?filter=paid',
      icon: <PackageCheck className="h-4 w-4" />,
      tone: 'warning',
    },
    {
      label: 'Re-stock low inventory',
      count: lowStockCount,
      description: 'Variants at or below the safety threshold',
      href: '/admin/inventory?filter=low-stock',
      icon: <Boxes className="h-4 w-4" />,
      tone: 'danger',
    },
    {
      label: 'Follow up pending payments',
      count: pendingPaymentCount,
      description: 'Check on orders stuck before payment',
      href: '/admin/orders?filter=pending-payment',
      icon: <AlertTriangle className="h-4 w-4" />,
      tone: 'warning',
    },
  ]

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.label} className="flex items-start justify-between gap-3 rounded-md border border-border bg-background/40 p-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm font-medium text-bone">
              <span className={task.tone === 'danger' ? 'text-rose-300' : task.tone === 'warning' ? 'text-amber-300' : ''}>{task.icon}</span>
              {task.label}
            </div>
            <p className="text-xs text-muted-foreground">{task.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`text-lg font-semibold ${task.count > 0 ? 'text-rose-200' : 'text-muted-foreground'}`}>{task.count}</div>
            <Button asChild size="sm" variant="secondary" disabled={task.count === 0}>
              <Link href={task.href}>Review</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
