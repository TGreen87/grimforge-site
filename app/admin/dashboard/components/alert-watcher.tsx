"use client";

import { useEffect } from "react";

export function AlertWatcher({ awaitingFulfilment, lowStock }: { awaitingFulfilment: number; lowStock: number }) {
  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/admin/alerts/ops', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ awaitingCount: awaitingFulfilment, lowStockCount: lowStock }),
      signal: controller.signal,
    }).catch(() => null)

    return () => controller.abort()
  }, [awaitingFulfilment, lowStock])

  return null
}
