import { Metadata } from 'next'
import { seoConfig } from '@/lib/seo/config'

export interface GenerateMetadataParams {
  title: string
  description: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  keywords?: string[]
  noindex?: boolean
}

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  keywords,
  noindex = false
}: GenerateMetadataParams): Metadata {
  const hasTwitter = Boolean(seoConfig.social.twitter?.trim())
  const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com'
  const safeMetadataBase = (() => {
    try {
      return new URL(siteUrlEnv)
    } catch {
      return new URL('https://obsidianriterecords.com')
    }
  })()
  const siteName = 'Obsidian Rite Records'
  const defaultImage = `${siteUrlEnv}/og-image.jpg`
  
  const finalUrl = url || siteUrlEnv
  const finalImage = image || defaultImage

  const hasBrandInTitle = title.includes(siteName)

  const metadata: Metadata = {
    title: hasBrandInTitle
      ? title
      : {
          default: title,
          template: `%s | ${siteName}`,
        },
    description,
    ...(keywords && keywords.length > 0
      ? { keywords: keywords.join(', ') }
      : {}),
    authors: author ? [{ name: author }] : [{ name: siteName }],
    metadataBase: safeMetadataBase,
    alternates: {
      canonical: finalUrl
    },
    openGraph: {
      title,
      description,
      url: finalUrl,
      siteName,
      images: [
        {
          url: finalImage,
          width: 1200,
          height: 630,
          alt: title
        }
      ],
      locale: 'en_AU',
      type: type as 'website' | 'article'
    },
    twitter: hasTwitter ? {
      card: 'summary_large_image',
      title,
      description,
      images: [finalImage],
    } : undefined,
    robots: {
      index: !noindex,
      follow: !noindex,
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    verification: {
      ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
        ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
        : {}),
      ...(process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION
        ? { other: { 'facebook-domain-verification': process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION } }
        : {}),
    }
  }

  // Add article-specific metadata
  if (type === 'article' && publishedTime) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime: modifiedTime || publishedTime,
      authors: author ? [author] : [siteName]
    }
  }

  // Add product-specific metadata
  if (type === 'product') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'website' // OpenGraph doesn't have a product type, but we handle this via JSON-LD
    }
  }

  return metadata
}

export function generateSiteMetadata(): Metadata {
  const metadata = generateMetadata({
    title: 'Obsidian Rite Records | Independent Black Metal Label and Store',
    description: 'Independent label and store for underground black metal. Discover artists, releases, and limited runs.',
    keywords: [
      'black metal',
      'underground metal',
      'metal record label',
      'vinyl records',
      'cassette',
      'death metal',
      'doom metal',
      'extreme metal',
      'Australian metal',
      'metal merchandise',
      'limited edition vinyl',
      'independent record label'
    ]
  })
  
  // Add favicon and icon metadata
  return {
    ...metadata,
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
      ],
      apple: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }
      ]
    }
  }
}

export function generateProductMetadata({
  name,
  description,
  image,
  slug,
  price,
  availability
}: {
  name: string
  description: string
  image?: string
  slug: string
  price?: number
  availability?: string
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com'
  const url = `${siteUrl}/products/${slug}`
  
  let enrichedDescription = description
  if (price) {
    enrichedDescription += ` - $${price} AUD`
  }
  if (availability) {
    enrichedDescription += ` - ${availability}`
  }

  return generateMetadata({
    title: name,
    description: enrichedDescription,
    image,
    url,
    type: 'product',
    keywords: [
      name.toLowerCase(),
      'black metal',
      'metal vinyl',
      'metal cassette',
      'metal merchandise',
      'underground metal'
    ]
  })
}

export function generateArticleMetadata({
  title,
  description,
  image,
  slug,
  publishedTime,
  modifiedTime,
  author
}: {
  title: string
  description: string
  image?: string
  slug: string
  publishedTime: string
  modifiedTime?: string
  author?: string
}): Metadata {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com'
  const url = `${siteUrl}/articles/${slug}`

  return generateMetadata({
    title,
    description,
    image,
    url,
    type: 'article',
    publishedTime,
    modifiedTime,
    author,
    keywords: [
      'black metal news',
      'metal articles',
      'underground metal',
      'metal culture',
      'extreme music'
    ]
  })
}
