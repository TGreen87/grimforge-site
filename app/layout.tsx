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
        <OrganizationJsonLd
          url={(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com')}
          name="Obsidian Rite Records"
          description="Independent underground metal label. Limited vinyl, cassettes, and merchandise from the darkest corners of the metal underground."
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
