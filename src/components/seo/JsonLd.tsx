import Script from 'next/script'

export interface ProductJsonLdProps {
  name: string
  description: string
  image?: string
  price?: number
  availability?: boolean
  sku?: string
  brand?: string
}

export function ProductJsonLd({
  name,
  description,
  image,
  price,
  availability,
  sku,
  brand = 'Grimforge Studios',
}: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    sku,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: price ? {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: 'USD',
      availability: availability 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
    } : undefined,
  }

  return (
    <Script
      id={`product-jsonld-${sku}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export interface ArticleJsonLdProps {
  title: string
  description: string
  image?: string
  datePublished?: string
  dateModified?: string
  author?: string
}

export function ArticleJsonLd({
  title,
  description,
  image,
  datePublished,
  dateModified,
  author = 'Grimforge Studios',
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Grimforge Studios',
    },
  }

  return (
    <Script
      id={`article-jsonld-${title}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export interface WebsiteJsonLdProps {
  url: string
  name: string
  description: string
}

export function WebsiteJsonLd({
  url,
  name,
  description,
}: WebsiteJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export interface OrganizationJsonLdProps {
  url: string
  name: string
  description: string
  logo?: string
  sameAs?: string[]
}

export function OrganizationJsonLd({
  url,
  name,
  description,
  logo,
  sameAs = [],
}: OrganizationJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url,
    name,
    description,
    logo,
    sameAs,
  }

  return (
    <Script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}