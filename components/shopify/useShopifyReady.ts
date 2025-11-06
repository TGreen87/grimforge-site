'use client'

import { useEffect, useState } from 'react'
import { shopifyEnv } from '@/lib/shopify/env'

declare global {
  interface Window {
    __SHOPIFY_ENABLED__?: boolean
  }
}

export function useShopifyReady(): boolean {
  const [ready, setReady] = useState<boolean>(shopifyEnv.isConfigured)

  useEffect(() => {
    if (shopifyEnv.isConfigured) return
    if (typeof window !== 'undefined' && window.__SHOPIFY_ENABLED__) {
      setReady(true)
    }
  }, [])

  return ready
}

