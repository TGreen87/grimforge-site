import { describe, it, expect, vi } from 'vitest'
import { generateMetadata, generateSiteMetadata, generateProductMetadata, generateArticleMetadata } from '@/lib/seo/metadata'

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://obsidianriterecords.com')

describe('SEO Metadata Generation', () => {
  describe('generateSiteMetadata', () => {
    it('should generate comprehensive site metadata', () => {
      const metadata = generateSiteMetadata()
      
      expect(metadata.title).toBeDefined()
      expect(metadata.description).toContain('Obsidian Rite Records')
      expect(metadata.keywords).toContain('black metal')
      expect(metadata.openGraph).toBeDefined()
      expect(metadata.twitter).toBeDefined()
      expect(metadata.robots).toBeDefined()
    })
  })
  
  describe('generateProductMetadata', () => {
    it('should generate product-specific metadata', () => {
      const metadata = generateProductMetadata({
        name: 'Test Album',
        description: 'A test album description',
        image: 'https://example.com/album.jpg',
        slug: 'test-album',
        price: 29.99,
        availability: 'In Stock'
      })
      
      expect(metadata.title?.default).toBe('Test Album')
      expect(metadata.description).toContain('A test album description')
      expect(metadata.description).toContain('$29.99 AUD')
      expect(metadata.description).toContain('In Stock')
      expect(metadata.alternates?.canonical).toContain('/products/test-album')
    })
    
    it('should handle missing optional fields', () => {
      const metadata = generateProductMetadata({
        name: 'Test Product',
        description: 'Test description',
        slug: 'test-product'
      })
      
      expect(metadata.title?.default).toBe('Test Product')
      expect(metadata.description).toBe('Test description')
    })
  })
  
  describe('generateArticleMetadata', () => {
    it('should generate article-specific metadata with dates', () => {
      const publishedTime = '2024-01-15T10:00:00Z'
      const modifiedTime = '2024-01-16T15:30:00Z'
      
      const metadata = generateArticleMetadata({
        title: 'Test Article',
        description: 'Article description',
        slug: 'test-article',
        publishedTime,
        modifiedTime,
        author: 'John Doe'
      })
      
      expect(metadata.title?.default).toBe('Test Article')
      expect(metadata.openGraph?.type).toBe('article')
      expect(metadata.alternates?.canonical).toContain('/articles/test-article')
    })
  })
  
  describe('generateMetadata', () => {
    it('should generate metadata with all Open Graph tags', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        image: 'https://example.com/image.jpg',
        url: 'https://example.com/page',
        type: 'website'
      })
      
      expect(metadata.openGraph?.title).toBe('Test Page')
      expect(metadata.openGraph?.description).toBe('Test description')
      const images = metadata.openGraph?.images
      if (Array.isArray(images) && images.length > 0) {
        expect(images[0].url).toBe('https://example.com/image.jpg')
      }
      expect(metadata.openGraph?.url).toBe('https://example.com/page')
    })
    
    it('should generate Twitter Card metadata', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        image: 'https://example.com/image.jpg'
      })
      
      expect(metadata.twitter?.card).toBe('summary_large_image')
      expect(metadata.twitter?.title).toBe('Test Page')
      expect(metadata.twitter?.description).toBe('Test description')
      expect(metadata.twitter?.images).toContain('https://example.com/image.jpg')
    })
    
    it('should handle noindex properly', () => {
      const metadata = generateMetadata({
        title: 'Private Page',
        description: 'This should not be indexed',
        noindex: true
      })
      
      expect(metadata.robots?.index).toBe(false)
      expect(metadata.robots?.follow).toBe(false)
      expect(metadata.robots?.googleBot?.index).toBe(false)
    })
    
    it('should include canonical URL', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        url: 'https://example.com/canonical-page'
      })
      
      expect(metadata.alternates?.canonical).toBe('https://example.com/canonical-page')
    })
    
    it('should include keywords when provided', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        keywords: ['keyword1', 'keyword2', 'keyword3']
      })
      
      expect(metadata.keywords).toBe('keyword1, keyword2, keyword3')
    })
  })
})

describe('SEO Requirements Validation', () => {
  it('should include all required meta tags for SEO', () => {
    const metadata = generateSiteMetadata()
    
    // Essential SEO elements
    expect(metadata.title).toBeDefined()
    expect(metadata.description).toBeDefined()
    expect(metadata.metadataBase).toBeDefined()
    expect(metadata.alternates?.canonical).toBeDefined()
    
    // Open Graph
    expect(metadata.openGraph?.title).toBeDefined()
    expect(metadata.openGraph?.description).toBeDefined()
    expect(metadata.openGraph?.siteName).toBeDefined()
    expect(metadata.openGraph?.locale).toBe('en_AU')
    
    // Twitter Cards
    expect(metadata.twitter?.card).toBeDefined()
    expect(metadata.twitter?.title).toBeDefined()
    expect(metadata.twitter?.description).toBeDefined()
    
    // Robots
    expect(metadata.robots?.googleBot).toBeDefined()
    expect(metadata.robots?.googleBot?.['max-image-preview']).toBe('large')
  })
})