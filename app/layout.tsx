import type { Metadata } from 'next'
import { Inter, Marcellus } from 'next/font/google'
import { generateSiteMetadata } from '@/lib/seo/metadata'
import { OrganizationJsonLd } from '@/components/seo/JsonLd'
import Providers from './providers'
import { GrimnessProvider } from '@/components/grimness/GrimnessContext'
import VoidToggle from '@/components/fx/VoidToggle'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const marcellus = Marcellus({ weight: '400', subsets: ['latin'], variable: '--font-heading' })

export const metadata: Metadata = generateSiteMetadata()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon-48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icon-512.png" sizes="512x512" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B0F14" />
        <OrganizationJsonLd
          url={(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com')}
          name="Obsidian Rite Records"
          description="Independent underground metal label. Limited vinyl, cassettes, and merchandise from the darkest corners of the metal underground."
        />
      </head>
      <body className={`${inter.variable} ${marcellus.variable} font-sans overflow-x-hidden`}>
        <GrimnessProvider>
          <VoidToggle />
          <Providers>
            {children}
          </Providers>
        </GrimnessProvider>
      </body>
    </html>
  )
}
