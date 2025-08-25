import { Metadata } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://obsidianriterecords.com'

export function generateProductMetadata({
  name,
  title,
  description,
  image,
  slug,
  price,
  availability,
}: {
  name?: string
  title?: string
  description: string
  image?: string
  slug?: string
  price?: number
  availability?: string
}): Metadata {
  const productTitle = name || title || 'Product'
  const productDescription = price ? 
    `${description} - $${price.toFixed(2)} AUD${availability ? ` - ${availability}` : ''}` : 
    description

  return {
    title: {
      default: productTitle,
      template: `%s | Obsidian Rite Records`
    },
    description: productDescription,
    alternates: slug ? {
      canonical: `${siteUrl}/products/${slug}`
    } : undefined,
    openGraph: {
      title: productTitle,
      description: productDescription,
      type: 'website',
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: productTitle,
      description: productDescription,
      images: image ? [image] : [],
    },
  }
}

export function generateArticleMetadata({
  title,
  description,
  image,
  slug,
  author,
  publishedTime,
  modifiedTime,
}: {
  title: string
  description: string
  image?: string
  slug?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
}): Metadata {
  return {
    title: {
      default: title,
      template: `%s | Obsidian Rite Records`
    },
    description,
    alternates: slug ? {
      canonical: `${siteUrl}/articles/${slug}`
    } : undefined,
    openGraph: {
      title,
      description,
      type: 'article',
      images: image ? [{ url: image }] : [],
      article: {
        authors: author ? [author] : [],
        publishedTime,
        modifiedTime,
      },
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export function generateSiteMetadata(): Metadata {
  return {
    title: {
      default: 'Obsidian Rite Records',
      template: '%s | Obsidian Rite Records',
    },
    description: 'Obsidian Rite Records - Australian Black Metal Label specializing in extreme music and dark art',
    keywords: ['black metal', 'death metal', 'extreme metal', 'vinyl records', 'cassettes', 'merchandise', 'australian metal', 'obsidian rite'],
    authors: [{ name: 'Obsidian Rite Records' }],
    creator: 'Obsidian Rite Records',
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: 'website',
      locale: 'en_AU',
      url: '/',
      title: 'Obsidian Rite Records',
      description: 'Australian Black Metal Label specializing in extreme music and dark art',
      siteName: 'Obsidian Rite Records',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Obsidian Rite Records',
      description: 'Australian Black Metal Label specializing in extreme music and dark art',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export function generateMetadata({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
}: {
  title: string
  description: string
  image?: string
  url?: string
  type?: string
  noindex?: boolean
}): Metadata {
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title,
      description,
      type: type as "website" | "article",
      url,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
    robots: noindex ? {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    } : undefined,
  }
}

export const defaultMetadata: Metadata = {
  title: {
    default: 'Grimforge Studios',
    template: '%s | Grimforge Studios',
  },
  description: 'Official merchandise and music from Grimforge Studios',
  keywords: ['metal', 'merchandise', 'music', 'band merch', 'grimforge'],
  authors: [{ name: 'Grimforge Studios' }],
  creator: 'Grimforge Studios',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://grimforge.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Grimforge Studios',
    description: 'Official merchandise and music from Grimforge Studios',
    siteName: 'Grimforge Studios',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grimforge Studios',
    description: 'Official merchandise and music from Grimforge Studios',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}