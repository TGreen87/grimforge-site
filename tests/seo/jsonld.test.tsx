import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { ProductJsonLd, OrganizationJsonLd, ArticleJsonLd, MusicAlbumJsonLd } from '@/components/seo/JsonLd'

describe('JSON-LD Structured Data', () => {
  describe('ProductJsonLd', () => {
    it('should render valid Product schema', () => {
      const { container } = render(
        <ProductJsonLd
          name="Test Album - Limited Edition Vinyl"
          description="A limited edition vinyl release of the Test Album"
          image="https://example.com/album.jpg"
          sku="TEST-001"
          price={29.99}
          priceCurrency="AUD"
          availability="InStock"
          category="Music"
        />
      )
      
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeTruthy()
      
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      // Validate required fields
      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('Product')
      expect(jsonLd.name).toBe('Test Album - Limited Edition Vinyl')
      expect(jsonLd.description).toBe('A limited edition vinyl release of the Test Album')
      expect(jsonLd.image).toEqual(['https://example.com/album.jpg'])
      expect(jsonLd.sku).toBe('TEST-001')
      
      // Validate offers
      expect(jsonLd.offers).toBeDefined()
      expect(jsonLd.offers['@type']).toBe('Offer')
      expect(jsonLd.offers.price).toBe('29.99')
      expect(jsonLd.offers.priceCurrency).toBe('AUD')
      expect(jsonLd.offers.availability).toBe('https://schema.org/InStock')
      
      // Validate brand
      expect(jsonLd.brand).toBeDefined()
      expect(jsonLd.brand['@type']).toBe('Brand')
      expect(jsonLd.brand.name).toBe('Obsidian Rite Records')
    })
    
    it('should handle multiple images', () => {
      const { container } = render(
        <ProductJsonLd
          name="Test Product"
          description="Test description"
          image={['image1.jpg', 'image2.jpg', 'image3.jpg']}
          price={19.99}
        />
      )
      
      const script = container.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      expect(jsonLd.image).toEqual(['image1.jpg', 'image2.jpg', 'image3.jpg'])
    })
    
    it('should include aggregate rating when provided', () => {
      const { container } = render(
        <ProductJsonLd
          name="Test Product"
          description="Test description"
          image="test.jpg"
          price={19.99}
          aggregateRating={{
            ratingValue: 4.5,
            reviewCount: 23
          }}
        />
      )
      
      const script = container.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      expect(jsonLd.aggregateRating).toBeDefined()
      expect(jsonLd.aggregateRating['@type']).toBe('AggregateRating')
      expect(jsonLd.aggregateRating.ratingValue).toBe(4.5)
      expect(jsonLd.aggregateRating.reviewCount).toBe(23)
    })
  })
  
  describe('OrganizationJsonLd', () => {
    it('should render valid Organization schema', () => {
      const { container } = render(<OrganizationJsonLd />)
      
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeTruthy()
      
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      expect(jsonLd['@context']).toBe('https://schema.org')
      expect(jsonLd['@type']).toBe('Organization')
      expect(jsonLd.name).toBe('Obsidian Rite Records')
      expect(jsonLd.contactPoint).toBeDefined()
      expect(jsonLd.contactPoint['@type']).toBe('ContactPoint')
      expect(jsonLd.contactPoint.email).toBe('obsidianriterecords@gmail.com')
    })
  })
  
  describe('MusicAlbumJsonLd', () => {
    it('should render valid MusicAlbum schema', () => {
      const { container } = render(
        <MusicAlbumJsonLd
          name="Eternal Darkness"
          description="A journey through the darkest realms"
          image="https://example.com/album.jpg"
          artist="Dark Legion"
          datePublished="2024-01-01"
          genre={['Black Metal', 'Doom Metal']}
          price={35.00}
          tracks={[
            { name: 'Intro', duration: 'PT2M30S' },
            { name: 'The Void', duration: 'PT5M45S' },
            { name: 'Eternal Night', duration: 'PT7M20S' }
          ]}
        />
      )
      
      const script = container.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      expect(jsonLd['@type']).toBe('MusicAlbum')
      expect(jsonLd.name).toBe('Eternal Darkness')
      expect(jsonLd.byArtist).toBeDefined()
      expect(jsonLd.byArtist['@type']).toBe('MusicGroup')
      expect(jsonLd.byArtist.name).toBe('Dark Legion')
      expect(jsonLd.genre).toEqual(['Black Metal', 'Doom Metal'])
      
      // Check tracks
      expect(jsonLd.track).toHaveLength(3)
      expect(jsonLd.track[0]['@type']).toBe('MusicRecording')
      expect(jsonLd.track[0].name).toBe('Intro')
      expect(jsonLd.track[0].position).toBe(1)
      
      // Check offers
      expect(jsonLd.offers).toBeDefined()
      expect(jsonLd.offers.price).toBe('35')
    })
  })
  
  describe('ArticleJsonLd', () => {
    it('should render valid Article schema', () => {
      const { container } = render(
        <ArticleJsonLd
          headline="The Rise of Underground Black Metal"
          description="An exploration of the underground black metal scene"
          image="https://example.com/article.jpg"
          datePublished="2024-01-15T10:00:00Z"
          dateModified="2024-01-16T15:30:00Z"
          author="John Doe"
        />
      )
      
      const script = container.querySelector('script[type="application/ld+json"]')
      const jsonLd = JSON.parse(script?.innerHTML || '{}')
      
      expect(jsonLd['@type']).toBe('Article')
      expect(jsonLd.headline).toBe('The Rise of Underground Black Metal')
      expect(jsonLd.author).toBeDefined()
      expect(jsonLd.author['@type']).toBe('Person')
      expect(jsonLd.author.name).toBe('John Doe')
      expect(jsonLd.publisher).toBeDefined()
      expect(jsonLd.publisher['@type']).toBe('Organization')
      expect(jsonLd.datePublished).toBe('2024-01-15T10:00:00Z')
      expect(jsonLd.dateModified).toBe('2024-01-16T15:30:00Z')
    })
  })
})

describe('Schema.org Validation', () => {
  it('Product JSON-LD should have all required Schema.org properties', () => {
    const { container } = render(
      <ProductJsonLd
        name="Test Product"
        description="Test description"
        image="test.jpg"
        price={19.99}
      />
    )
    
    const script = container.querySelector('script[type="application/ld+json"]')
    const jsonLd = JSON.parse(script?.innerHTML || '{}')
    
    // Required properties for Product
    expect(jsonLd).toHaveProperty('@context')
    expect(jsonLd).toHaveProperty('@type')
    expect(jsonLd).toHaveProperty('name')
    expect(jsonLd).toHaveProperty('image')
    
    // Required properties for Offer
    expect(jsonLd.offers).toHaveProperty('@type')
    expect(jsonLd.offers).toHaveProperty('price')
    expect(jsonLd.offers).toHaveProperty('priceCurrency')
  })
  
  it('Organization JSON-LD should have all required Schema.org properties', () => {
    const { container } = render(<OrganizationJsonLd />)
    
    const script = container.querySelector('script[type="application/ld+json"]')
    const jsonLd = JSON.parse(script?.innerHTML || '{}')
    
    // Required properties for Organization
    expect(jsonLd).toHaveProperty('@context')
    expect(jsonLd).toHaveProperty('@type')
    expect(jsonLd).toHaveProperty('name')
    expect(jsonLd).toHaveProperty('url')
  })
})