import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { generateSiteMetadata } from '@/lib/seo/metadata'
import { OrganizationJsonLd } from '@/components/seo/JsonLd'
import Providers from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = generateSiteMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <OrganizationJsonLd />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}