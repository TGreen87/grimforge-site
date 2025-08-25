import { describe, it, expect } from 'vitest'
import { validateJsonLd } from '@/lib/seo/utils'

describe('Sample Product JSON-LD Validation', () => {
  const sampleProductJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Eternal Darkness - Limited Edition Vinyl',
    description: 'Limited edition 180g black vinyl pressing of the acclaimed black metal album "Eternal Darkness". Features gatefold artwork and includes digital download code.',
    image: [
      'https://obsidianriterecords.com/images/eternal-darkness-front.jpg',
      'https://obsidianriterecords.com/images/eternal-darkness-back.jpg',
      'https://obsidianriterecords.com/images/eternal-darkness-gatefold.jpg'
    ],
    sku: 'ORR-VINYL-001',
    brand: {
      '@type': 'Brand',
      name: 'Obsidian Rite Records'
    },
    category: 'Music',
    url: 'https://obsidianriterecords.com/products/eternal-darkness-vinyl',
    offers: {
      '@type': 'Offer',
      price: '35.00',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        '@id': 'https://obsidianriterecords.com#organization',
        name: 'Obsidian Rite Records'
      },
      priceValidUntil: '2025-12-31',
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '10.00',
          currency: 'AUD'
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'AU'
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 2,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 3,
            maxValue: 10,
            unitCode: 'DAY'
          }
        }
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '27',
      bestRating: '5',
      worstRating: '1'
    }
  }
  
  const sampleMusicAlbumJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: 'Eternal Darkness',
    description: 'The third full-length album from black metal masters Dark Legion',
    image: 'https://obsidianriterecords.com/images/eternal-darkness-cover.jpg',
    byArtist: {
      '@type': 'MusicGroup',
      name: 'Dark Legion',
      genre: ['Black Metal', 'Atmospheric Black Metal']
    },
    datePublished: '2024-03-15',
    genre: ['Black Metal', 'Atmospheric Black Metal', 'Melodic Black Metal'],
    url: 'https://obsidianriterecords.com/products/eternal-darkness-vinyl',
    track: [
      {
        '@type': 'MusicRecording',
        name: 'Invocation of Shadows',
        position: 1,
        duration: 'PT2M45S'
      },
      {
        '@type': 'MusicRecording',
        name: 'Through the Eternal Night',
        position: 2,
        duration: 'PT6M32S'
      },
      {
        '@type': 'MusicRecording',
        name: 'Crimson Moon Rising',
        position: 3,
        duration: 'PT5M18S'
      },
      {
        '@type': 'MusicRecording',
        name: 'Beneath the Frozen Throne',
        position: 4,
        duration: 'PT7M45S'
      },
      {
        '@type': 'MusicRecording',
        name: 'Winds of Desolation',
        position: 5,
        duration: 'PT4M56S'
      },
      {
        '@type': 'MusicRecording',
        name: 'The Final Darkness',
        position: 6,
        duration: 'PT9M12S'
      }
    ],
    offers: {
      '@type': 'Offer',
      price: '35.00',
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        '@id': 'https://obsidianriterecords.com#organization',
        name: 'Obsidian Rite Records'
      }
    },
    recordLabel: {
      '@type': 'Organization',
      name: 'Obsidian Rite Records'
    },
    albumProductionType: 'https://schema.org/StudioAlbum',
    albumReleaseType: 'https://schema.org/AlbumRelease'
  }
  
  it('should validate the sample Product JSON-LD structure', () => {
    const isValid = validateJsonLd(sampleProductJsonLd)
    expect(isValid).toBe(true)
  })
  
  it('should have all required Product fields', () => {
    expect(sampleProductJsonLd['@context']).toBe('https://schema.org')
    expect(sampleProductJsonLd['@type']).toBe('Product')
    expect(sampleProductJsonLd.name).toBeDefined()
    expect(sampleProductJsonLd.description).toBeDefined()
    expect(sampleProductJsonLd.image).toBeDefined()
    expect(Array.isArray(sampleProductJsonLd.image)).toBe(true)
  })
  
  it('should have valid Offer structure', () => {
    const offer = sampleProductJsonLd.offers
    expect(offer['@type']).toBe('Offer')
    expect(offer.price).toBeDefined()
    expect(offer.priceCurrency).toBe('AUD')
    expect(offer.availability).toContain('schema.org')
    expect(offer.seller).toBeDefined()
    expect(offer.seller['@type']).toBe('Organization')
  })
  
  it('should have valid shipping details', () => {
    const shipping = sampleProductJsonLd.offers.shippingDetails
    expect(shipping).toBeDefined()
    expect(shipping['@type']).toBe('OfferShippingDetails')
    expect(shipping.shippingRate.value).toBe('10.00')
    expect(shipping.shippingRate.currency).toBe('AUD')
    expect(shipping.deliveryTime).toBeDefined()
  })
  
  it('should have valid aggregate rating', () => {
    const rating = sampleProductJsonLd.aggregateRating
    expect(rating).toBeDefined()
    expect(rating['@type']).toBe('AggregateRating')
    expect(parseFloat(rating.ratingValue)).toBeGreaterThan(0)
    expect(parseFloat(rating.ratingValue)).toBeLessThanOrEqual(5)
    expect(parseInt(rating.reviewCount)).toBeGreaterThan(0)
  })
  
  it('should validate the sample MusicAlbum JSON-LD structure', () => {
    const isValid = validateJsonLd(sampleMusicAlbumJsonLd)
    expect(isValid).toBe(true)
  })
  
  it('should have all required MusicAlbum fields', () => {
    expect(sampleMusicAlbumJsonLd['@context']).toBe('https://schema.org')
    expect(sampleMusicAlbumJsonLd['@type']).toBe('MusicAlbum')
    expect(sampleMusicAlbumJsonLd.name).toBeDefined()
    expect(sampleMusicAlbumJsonLd.byArtist).toBeDefined()
    expect(sampleMusicAlbumJsonLd.byArtist['@type']).toBe('MusicGroup')
  })
  
  it('should have valid track listing', () => {
    const tracks = sampleMusicAlbumJsonLd.track
    expect(Array.isArray(tracks)).toBe(true)
    expect(tracks.length).toBe(6)
    
    tracks.forEach((track, index) => {
      expect(track['@type']).toBe('MusicRecording')
      expect(track.name).toBeDefined()
      expect(track.position).toBe(index + 1)
      expect(track.duration).toMatch(/^PT\d+M\d+S$/) // ISO 8601 duration format
    })
  })
  
  it('should comply with Google Rich Results requirements', () => {
    // Test Product requirements
    expect(sampleProductJsonLd.name).toBeTruthy()
    expect(sampleProductJsonLd.image).toBeTruthy()
    expect(sampleProductJsonLd.offers).toBeTruthy()
    expect(sampleProductJsonLd.offers.price).toBeTruthy()
    expect(sampleProductJsonLd.offers.priceCurrency).toBeTruthy()
    
    // Test that price is a valid number string
    expect(parseFloat(sampleProductJsonLd.offers.price)).toBeGreaterThan(0)
    
    // Test that availability uses Schema.org URL
    expect(sampleProductJsonLd.offers.availability).toMatch(/^https:\/\/schema\.org\//)
    
    // Test MusicAlbum requirements
    expect(sampleMusicAlbumJsonLd.name).toBeTruthy()
    expect(sampleMusicAlbumJsonLd.byArtist).toBeTruthy()
    expect(sampleMusicAlbumJsonLd.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  
  it('should have proper organization references', () => {
    // Check that organization references use @id
    expect(sampleProductJsonLd.offers.seller['@id']).toBe('https://obsidianriterecords.com#organization')
    expect(sampleMusicAlbumJsonLd.offers.seller['@id']).toBe('https://obsidianriterecords.com#organization')
  })
})

describe('JSON-LD Error Cases', () => {
  it('should fail validation for missing @context', () => {
    const invalidSchema = {
      '@type': 'Product',
      name: 'Test Product'
    }
    expect(validateJsonLd(invalidSchema)).toBe(false)
  })
  
  it('should fail validation for missing @type', () => {
    const invalidSchema = {
      '@context': 'https://schema.org',
      name: 'Test Product'
    }
    expect(validateJsonLd(invalidSchema)).toBe(false)
  })
  
  it('should fail validation for Product without name', () => {
    const invalidSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      image: 'test.jpg'
    }
    expect(validateJsonLd(invalidSchema)).toBe(false)
  })
  
  it('should fail validation for Offer without price', () => {
    const invalidSchema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Test',
      image: 'test.jpg',
      offers: {
        '@type': 'Offer',
        priceCurrency: 'AUD'
      }
    }
    expect(validateJsonLd(invalidSchema)).toBe(false)
  })
})