
'use client'

import React, { ReactNode } from 'react'
import { AuthProvider } from '@/src/contexts/AuthContext'
import { CartProvider } from '@/src/contexts/CartContext'
import { WishlistProvider } from '@/src/contexts/WishlistContext'
import ClientErrorLogger from '@/src/components/ClientErrorLogger'

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <ClientErrorLogger />
          {children}
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}
