"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AlertsConfig {
  awaiting_fulfilment_threshold?: number
  low_stock_threshold?: number
  enable_dashboard_alerts?: boolean
}

export default function AlertSummaryBanner({
  awaitingCount,
  lowStockCount,
  thresholds,
}: {
  awaitingCount: number
  lowStockCount: number
  thresholds: AlertsConfig
}) {
  if (thresholds.enable_dashboard_alerts === false) {
    return null
  }

  const fulfilmentThreshold = thresholds.awaiting_fulfilment_threshold ?? 0
  const lowStockThreshold = thresholds.low_stock_threshold ?? 0

  const fulfilmentExceeded = fulfilmentThreshold > 0 && awaitingCount >= fulfilmentThreshold
  const lowStockExceeded = lowStockThreshold > 0 && lowStockCount >= lowStockThreshold

  if (!fulfilmentExceeded && !lowStockExceeded) {
    return null
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="font-semibold text-bone">Attention required</div>
        <div className="text-sm text-muted-foreground">
          {fulfilmentExceeded && (
            <div>Awaiting fulfilment: {awaitingCount} (threshold {fulfilmentThreshold}).</div>
          )}
          {lowStockExceeded && (
            <div>Low stock variants: {lowStockCount} (threshold {lowStockThreshold}).</div>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/orders?filter=paid">Review orders</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/admin/settings">Adjust thresholds</Link>
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            fetch('/api/admin/settings/alerts/test', { method: 'POST' })
              .then(async (res) => {
                if (!res.ok) throw new Error(await res.text())
              })
              .catch(() => null)
          }}
        >
          Send test alert
        </Button>
      </div>
    </div>
  )
}
