/**
 * Central SEO configuration for the entire site
 */

export const seoConfig = {
  // Site Information
  siteName: 'Obsidian Rite Records',
  siteDescription: 'Obsidian Rite Records is an independent underground black metal record label. Discover exclusive releases, limited edition vinyl, cassettes, and merchandise from the darkest corners of the metal underground.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com',
  
  // Organization Details
  organization: {
    name: 'Obsidian Rite Records',
    email: 'arg@obsidianriterecords.com',
    logo: '/logo.png',
    foundingDate: '2020-01-01',
    founders: ['Obsidian Rite Records'],
    address: {
      addressCountry: 'AU',
      addressLocality: 'Australia'
    }
  },
  
  // Social Media
  social: {
    instagram: 'https://www.instagram.com/obsidianriterecords/',
    facebook: '',
    twitter: '',
    youtube: '',
    bandcamp: ''
  },
  
  // Default Images
  defaultImages: {
    og: '/og-image.jpg',
    twitter: '/twitter-image.jpg',
    logo: '/logo.png',
    favicon: '/favicon.ico'
  },
  
  // Language and Locale
  locale: {
    default: 'en_AU',
    supported: ['en_AU', 'en_US', 'en_GB']
  },
  
  // Currency
  currency: {
    code: 'AUD',
    symbol: '$',
    locale: 'en-AU'
  },
  
  // Product Categories
  productCategories: [
    'Vinyl Records',
    'Cassette',
    'CDs',
    'Merchandise',
    'Accessories'
  ],
  
  // Music Genres
  musicGenres: [
    'Black Metal',
    'Death Metal',
    'Doom Metal',
    'Atmospheric Black Metal',
    'Raw Black Metal',
    'Melodic Black Metal',
    'Blackened Death Metal',
    'Funeral Doom',
    'Sludge Metal',
    'Post-Black Metal'
  ],
  
  // SEO Keywords
  defaultKeywords: [
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
    'independent record label',
    'underground music',
    'heavy metal',
    'metal band merch'
  ],
  
  // Rich Results Configuration
  richResults: {
    enableProduct: true,
    enableArticle: true,
    enableOrganization: true,
    enableBreadcrumbs: true,
    enableMusicAlbum: true,
    enableEvent: false,
    enableFAQ: false,
    enableHowTo: false
  },
  
  // Crawling and Indexing
  crawling: {
    allowedUserAgents: ['*'],
    disallowedPaths: [
      '/admin',
      '/api',
      '/checkout',
      '/cart',
      '/*.json$',
      '/*.pdf$'
    ],
    crawlDelay: {
      default: 0,
      bingbot: 1,
      yandex: 2
    }
  },
  
  // Analytics and Verification
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    bing: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || '',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION || ''
  },
  
  // Schema.org Type Mappings
  schemaTypes: {
    product: {
      vinyl: 'Product',
      cassette: 'Product',
      cd: 'Product',
      merchandise: 'Product',
      apparel: 'Product',
      musicAlbum: 'MusicAlbum'
    },
    content: {
      article: 'Article',
      news: 'NewsArticle',
      blog: 'BlogPosting',
      review: 'Review'
    }
  },
  
  // Structured Data Defaults
  structuredDataDefaults: {
    priceValidDays: 365,
    returnDays: 30,
    shippingDays: {
      min: 3,
      max: 10
    },
    availability: {
      inStock: 'https://schema.org/InStock',
      outOfStock: 'https://schema.org/OutOfStock',
      preOrder: 'https://schema.org/PreOrder',
      discontinued: 'https://schema.org/Discontinued'
    }
  },
  
  // Meta Tag Limits
  metaLimits: {
    title: 60,
    description: 160,
    ogTitle: 60,
    ogDescription: 200,
    twitterTitle: 70,
    twitterDescription: 200
  },
  
  // Performance
  performance: {
    enablePreconnect: true,
    preconnectDomains: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://shbalyvvquvtvnkrsxtx.supabase.co'
    ],
    enablePrefetch: true,
    prefetchPriority: {
      high: ['/products', '/'],
      medium: ['/articles', '/about'],
      low: ['/privacy-policy', '/terms-of-service']
    }
  }
}

export type SeoConfig = typeof seoConfig
