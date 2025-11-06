
'use client'

import React, { ReactNode, Suspense, useEffect } from 'react'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { WishlistProvider } from '@/src/contexts/WishlistContext'
import ClientErrorLogger from '@/src/components/ClientErrorLogger'
import AnalyticsClient from '@/src/components/AnalyticsClient'
import ErrorBoundary from '@/src/components/ErrorBoundary'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister().catch(() => false))))
        .catch(() => {
          // ignore failures — older browsers may not support getRegistrations
        })
    }

    if (window.caches && typeof window.caches.keys === 'function') {
      window.caches.keys()
        .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key).catch(() => false))))
        .catch(() => {
          // ignore failures
        })
    }
  }, [])

  return (
    <AuthProvider>
      <WishlistProvider>
        <ClientErrorLogger />
        <Suspense fallback={null}>
          <AnalyticsClient />
        </Suspense>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </WishlistProvider>
    </AuthProvider>
  )
}
