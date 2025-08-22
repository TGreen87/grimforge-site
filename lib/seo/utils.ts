/**
 * SEO utility functions for URL generation and validation
 */

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 
         process.env.SITE_URL_STAGING || 
         'https://obsidianriterecords.com'
}

export function getCanonicalUrl(path: string = ''): string {
  const siteUrl = getSiteUrl()
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  // Remove trailing slash except for root
  const finalPath = cleanPath === '/' ? '' : cleanPath.replace(/\/$/, '')
  return `${siteUrl}${finalPath}`
}

export function generateProductUrl(slug: string): string {
  return getCanonicalUrl(`/products/${slug}`)
}

export function generateArticleUrl(slug: string): string {
  return getCanonicalUrl(`/articles/${slug}`)
}

export function generateImageUrl(imagePath: string): string {
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  // If it's a Supabase storage URL
  if (imagePath.includes('supabase')) {
    return imagePath
  }
  
  // Otherwise, prepend site URL
  const siteUrl = getSiteUrl()
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
  return `${siteUrl}${cleanPath}`
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

export function truncateDescription(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) {
    return text
  }
  
  // Truncate at last complete word
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...'
  }
  
  return truncated + '...'
}

export function generateKeywords(
  baseKeywords: string[] = [],
  additionalKeywords: string[] = []
): string[] {
  const defaultKeywords = [
    'black metal',
    'underground metal',
    'metal records',
    'vinyl',
    'cassette',
    'Australian metal',
    'Obsidian Rite Records'
  ]
  
  // Combine and deduplicate keywords
  const allKeywords = [...new Set([...baseKeywords, ...additionalKeywords, ...defaultKeywords])]
  
  // Limit to 10 most relevant keywords
  return allKeywords.slice(0, 10)
}

export function formatDateForSchema(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString()
}

export function validateJsonLd(schema: any): boolean {
  // Basic validation for required JSON-LD properties
  if (!schema['@context']) {
    console.error('JSON-LD missing @context')
    return false
  }
  
  if (!schema['@type']) {
    console.error('JSON-LD missing @type')
    return false
  }
  
  // Type-specific validation
  switch (schema['@type']) {
    case 'Product':
      if (!schema.name || !schema.image) {
        console.error('Product JSON-LD missing required fields')
        return false
      }
      if (schema.offers && (!schema.offers.price || !schema.offers.priceCurrency)) {
        console.error('Product offers missing required fields')
        return false
      }
      break
      
    case 'Organization':
      if (!schema.name) {
        console.error('Organization JSON-LD missing name')
        return false
      }
      break
      
    case 'Article':
      if (!schema.headline || !schema.datePublished) {
        console.error('Article JSON-LD missing required fields')
        return false
      }
      break
      
    case 'BreadcrumbList':
      if (!schema.itemListElement || !Array.isArray(schema.itemListElement)) {
        console.error('BreadcrumbList JSON-LD missing itemListElement')
        return false
      }
      break
  }
  
  return true
}

export function generateBreadcrumbs(path: string): Array<{ name: string; url?: string }> {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs: Array<{ name: string; url?: string }> = [
    { name: 'Home', url: '/' }
  ]
  
  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === segments.length - 1
    
    // Capitalize segment name
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    breadcrumbs.push({
      name,
      url: isLast ? undefined : currentPath
    })
  })
  
  return breadcrumbs
}