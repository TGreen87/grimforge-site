
'use client'

import React, { ReactNode, Suspense } from 'react'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { CartProvider } from '@/src/contexts/CartContext'
import { WishlistProvider } from '@/src/contexts/WishlistContext'
import ClientErrorLogger from '@/src/components/ClientErrorLogger'
import AnalyticsClient from '@/src/components/AnalyticsClient'
import ErrorBoundary from '@/src/components/ErrorBoundary'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ClientErrorLogger />
          <Suspense fallback={null}>
            <AnalyticsClient />
          </Suspense>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
