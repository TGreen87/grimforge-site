# SEO Implementation Documentation

## Overview
Comprehensive SEO implementation with JSON-LD structured data for the Grimforge/Obsidian Rite Records Next.js application.

## Implemented Features

### 1. JSON-LD Structured Data Components
**Location:** `/components/seo/JsonLd.tsx`

- **OrganizationJsonLd**: Organization schema for brand identity
- **ProductJsonLd**: Product schema for merchandise and records
- **MusicAlbumJsonLd**: Specialized schema for music albums with track listings
- **ArticleJsonLd**: Article schema for blog/news content
- **BreadcrumbJsonLd**: Breadcrumb navigation schema

All components:
- Support server-side rendering
- Follow Schema.org specifications
- Include proper @context and @type
- Handle optional fields gracefully

### 2. Metadata Generation System
**Location:** `/lib/seo/metadata.ts`

Functions:
- `generateSiteMetadata()`: Site-wide default metadata
- `generateProductMetadata()`: Product-specific metadata with pricing
- `generateArticleMetadata()`: Article metadata with publish dates
- `generateMetadata()`: Base function for custom metadata

Features:
- Open Graph tags for social sharing
- Twitter Card tags
- Canonical URLs
- Robot directives
- Google site verification support

### 3. Dynamic Sitemap Generation
**Location:** `/app/sitemap.ts`

- Automatically generates XML sitemap
- Pulls products and articles from Supabase
- Includes change frequencies and priorities
- Updates lastModified dates from database

### 4. Robots.txt Configuration
**Location:** `/app/robots.ts`

- Configures crawl rules for search engines
- Blocks admin and API routes
- Different rules for Googlebot and Bingbot
- Links to sitemap.xml

### 5. SEO Utilities
**Location:** `/lib/seo/utils.ts`

Helper functions:
- `getSiteUrl()`: Get site URL from environment
- `getCanonicalUrl()`: Generate canonical URLs
- `slugify()`: Convert text to URL-friendly slugs
- `truncateDescription()`: Truncate meta descriptions
- `validateJsonLd()`: Validate JSON-LD structure
- `generateBreadcrumbs()`: Auto-generate breadcrumb data

### 6. SEO Configuration
**Location:** `/lib/seo/config.ts`

Central configuration for:
- Site information
- Social media links
- Default keywords
- Schema.org type mappings
- Meta tag character limits
- Performance optimizations

## Page Implementations

### Product Pages
**Location:** `/app/(site)/products/[slug]/page.tsx`

- Dynamic metadata generation from product data
- Product or MusicAlbum JSON-LD based on product type
- Breadcrumb navigation
- Inventory-based availability status
- Multiple product images support

### Article Pages
**Location:** `/app/(site)/articles/[slug]/page.tsx`

- Article-specific metadata
- Article JSON-LD with author and dates
- Breadcrumb navigation
- Fallback for when articles table doesn't exist

### Root Layout
**Location:** `/app/layout.tsx`

- Site-wide metadata defaults
- Organization JSON-LD on all pages
- Proper HTML lang attribute

## Testing

### Test Files
- `/tests/seo/jsonld.test.tsx`: JSON-LD component tests
- `/tests/seo/metadata.test.ts`: Metadata generation tests
- `/tests/seo/ssr.test.tsx`: Server-side rendering tests
- `/tests/seo/sample-validation.test.ts`: Sample schema validation

### Test Coverage
- ✅ All required Schema.org properties
- ✅ Server-side rendering of JSON-LD
- ✅ Metadata generation functions
- ✅ Special character escaping
- ✅ Multiple images handling
- ✅ Aggregate ratings
- ✅ Music album tracks

## Environment Variables

Required for SEO:
```
NEXT_PUBLIC_SITE_URL=https://obsidianriterecords.com
SITE_URL_STAGING=https://staging.obsidianriterecords.com
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
NEXT_PUBLIC_FACEBOOK_DOMAIN_VERIFICATION=your-verification-code
```

## Schema.org Compliance

All structured data follows Schema.org specifications:
- Product: Includes name, description, image, offers, brand
- MusicAlbum: Includes artist, tracks, genre, release date
- Organization: Includes name, URL, logo, contact point
- Article: Includes headline, author, publisher, dates
- BreadcrumbList: Includes item list with positions

## SEO Best Practices Implemented

1. **Server-Side Rendering**: All JSON-LD is rendered server-side
2. **Canonical URLs**: Prevents duplicate content issues
3. **Meta Descriptions**: Dynamic generation with character limits
4. **Open Graph**: Full social media sharing support
5. **Twitter Cards**: Large image cards for better engagement
6. **Robots Control**: Granular control over crawling
7. **Sitemap**: Auto-generated with priorities
8. **Structured Data**: Rich snippets for search results

## Validation Tools

Validate implementation with:
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Twitter Card Validator: https://cards-dev.twitter.com/validator
- Google PageSpeed Insights: https://pagespeed.web.dev/

## Usage Examples

### Adding JSON-LD to a Page
```tsx
import { ProductJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

export default function ProductPage() {
  return (
    <>
      <ProductJsonLd
        name="Album Name"
        description="Album description"
        image="/album-cover.jpg"
        price={29.99}
        availability="InStock"
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          { name: 'Album Name' }
        ]}
      />
      {/* Page content */}
    </>
  )
}
```

### Generating Page Metadata
```tsx
import { generateProductMetadata } from '@/lib/seo/metadata'

export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug)
  
  return generateProductMetadata({
    name: product.name,
    description: product.description,
    image: product.image_url,
    slug: params.slug,
    price: product.price
  })
}
```

## Performance Considerations

- JSON-LD is inlined in HTML (no external requests)
- Metadata is generated at build time for static pages
- Dynamic pages generate metadata on-demand
- Sitemap is cached and regenerated periodically
- All images use absolute URLs for better sharing

## Future Enhancements

Consider adding:
- FAQ schema for common questions
- Event schema for releases/concerts
- Review/Rating system with AggregateRating
- Local Business schema if physical location exists
- Video schema for music videos
- Search Action schema for site search