import React from 'react'
import type { Product, Article, WithContext, Organization, BreadcrumbList, MusicAlbum } from 'schema-dts'

// Using schema-dts MusicAlbum type with proper typing

interface OrganizationJsonLdProps {
  name?: string
  url?: string
  logo?: string
  sameAs?: string[]
}

export function OrganizationJsonLd({
  name = 'Obsidian Rite Records',
  url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING,
  logo = `${url}/logo.png`,
  sameAs = [
    'https://www.instagram.com/obsidianriterecords/',
    'https://www.facebook.com/scruffylikestoast'
  ]
}: OrganizationJsonLdProps = {}) {
  const schema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${url}#organization`,
    name,
    url: url!,
    logo,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'obsidianriterecords@gmail.com',
      availableLanguage: ['English']
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ProductJsonLdProps {
  name: string
  description: string
  image: string | string[]
  sku?: string
  price: number
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
  brand?: string
  category?: string
  url?: string
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
}

export function ProductJsonLd({
  name,
  description,
  image,
  sku,
  price,
  priceCurrency = 'AUD',
  availability = 'InStock',
  brand = 'Obsidian Rite Records',
  category = 'Music',
  url,
  aggregateRating
}: ProductJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING
  
  const schema: WithContext<Product> & { aggregateRating?: unknown } = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    sku,
    brand: {
      '@type': 'Brand',
      name: brand
    },
    category,
    url: url || (sku ? `${siteUrl}/products/${sku}` : undefined),
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'Obsidian Rite Records'
      },
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
    }
  }

  if (aggregateRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: aggregateRating.ratingValue,
      reviewCount: aggregateRating.reviewCount
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface ArticleJsonLdProps {
  headline: string
  description: string
  image: string | string[]
  datePublished: string
  dateModified?: string
  author?: string
  publisher?: string
  url?: string
}

export function ArticleJsonLd({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author = 'Obsidian Rite Records',
  publisher = 'Obsidian Rite Records',
  url
}: ArticleJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING
  
  const schema: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    image: Array.isArray(image) ? image : [image],
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteUrl}#organization`,
      name: publisher,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url || siteUrl
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbJsonLdProps {
  items: Array<{
    name: string
    url?: string
  }>
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING
  
  const schema: WithContext<BreadcrumbList> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url || (index === items.length - 1 ? undefined : `${siteUrl}${item.url}`)
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface MusicAlbumJsonLdProps {
  name: string
  description: string
  image: string | string[]
  artist: string
  datePublished: string
  genre?: string[]
  url?: string
  tracks?: Array<{
    name: string
    duration?: string
  }>
  price?: number
  priceCurrency?: string
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder'
}

export function MusicAlbumJsonLd({
  name,
  description,
  image,
  artist,
  datePublished,
  genre = ['Black Metal', 'Metal'],
  url,
  tracks,
  price,
  priceCurrency = 'AUD',
  availability = 'InStock'
}: MusicAlbumJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING
  
  const schema: WithContext<MusicAlbum> = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    byArtist: {
      '@type': 'MusicGroup',
      name: artist
    },
    datePublished,
    genre,
    url: url || siteUrl
  }

  if (tracks && tracks.length > 0) {
    schema.track = tracks.map((track, index) => ({
      '@type': 'MusicRecording',
      name: track.name,
      position: index + 1,
      duration: track.duration
    }))
  }

  if (price) {
    schema.offers = {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      seller: {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: 'Obsidian Rite Records'
      }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
