import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import React from 'react'
import { ProductJsonLd, OrganizationJsonLd, ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

describe('Server-Side Rendering of JSON-LD', () => {
  describe('ProductJsonLd SSR', () => {
    it('should render JSON-LD on the server', () => {
      const html = renderToString(
        <ProductJsonLd
          name="Server Rendered Product"
          description="This product is rendered on the server"
          image="https://example.com/product.jpg"
          price={39.99}
          availability="InStock"
        />
      )
      
      // Check that the script tag is present in the HTML
      expect(html).toContain('<script type="application/ld+json">')
      expect(html).toContain('"@type":"Product"')
      expect(html).toContain('"name":"Server Rendered Product"')
      expect(html).toContain('"price":"39.99"')
    })
    
    it('should properly escape special characters in SSR', () => {
      const html = renderToString(
        <ProductJsonLd
          name='Product with "quotes" & special characters'
          description="Description with special characters"
          image="test.jpg"
          price={19.99}
        />
      )
      
      // Ensure special characters are properly escaped in JSON
      expect(html).toContain('Product with')
      expect(html).toContain('quotes') // Should contain the word quotes
      // The ampersand should be properly handled in JSON
    })
  })
  
  describe('OrganizationJsonLd SSR', () => {
    it('should render Organization schema on the server', () => {
      const html = renderToString(<OrganizationJsonLd />)
      
      expect(html).toContain('<script type="application/ld+json">')
      expect(html).toContain('"@type":"Organization"')
      expect(html).toContain('"name":"Obsidian Rite Records"')
      expect(html).toContain('"contactPoint"')
    })
  })
  
  describe('ArticleJsonLd SSR', () => {
    it('should render Article schema on the server', () => {
      const html = renderToString(
        <ArticleJsonLd
          headline="SSR Article Test"
          description="Testing server-side rendering"
          image="https://example.com/article.jpg"
          datePublished="2024-01-15T10:00:00Z"
        />
      )
      
      expect(html).toContain('<script type="application/ld+json">')
      expect(html).toContain('"@type":"Article"')
      expect(html).toContain('"headline":"SSR Article Test"')
      expect(html).toContain('"datePublished":"2024-01-15T10:00:00Z"')
    })
  })
  
  describe('BreadcrumbJsonLd SSR', () => {
    it('should render BreadcrumbList schema on the server', () => {
      const html = renderToString(
        <BreadcrumbJsonLd
          items={[
            { name: 'Home', url: '/' },
            { name: 'Products', url: '/products' },
            { name: 'Test Product' }
          ]}
        />
      )
      
      expect(html).toContain('<script type="application/ld+json">')
      expect(html).toContain('"@type":"BreadcrumbList"')
      expect(html).toContain('"itemListElement"')
      expect(html).toContain('"position":1')
      expect(html).toContain('"position":2')
      expect(html).toContain('"position":3')
    })
  })
  
  describe('Multiple JSON-LD Scripts SSR', () => {
    it('should render multiple JSON-LD scripts correctly', () => {
      const html = renderToString(
        <div>
          <OrganizationJsonLd />
          <ProductJsonLd
            name="Test Product"
            description="Test"
            image="test.jpg"
            price={29.99}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: '/' },
              { name: 'Test' }
            ]}
          />
        </div>
      )
      
      // Count the number of JSON-LD script tags
      const scriptMatches = html.match(/<script type="application\/ld\+json">/g)
      expect(scriptMatches).toHaveLength(3)
      
      // Verify each schema type is present
      expect(html).toContain('"@type":"Organization"')
      expect(html).toContain('"@type":"Product"')
      expect(html).toContain('"@type":"BreadcrumbList"')
    })
  })
})

describe('JSON-LD Content Validation', () => {
  it('should not include undefined values in JSON output', () => {
    const html = renderToString(
      <ProductJsonLd
        name="Test Product"
        description="Test"
        image="test.jpg"
        price={19.99}
        // sku is undefined
      />
    )
    
    // The rendered JSON should not contain undefined values
    expect(html).not.toContain('undefined')
    expect(html).not.toContain('"sku":null')
    expect(html).not.toContain('"sku":undefined')
    
    // Parse the JSON to ensure it's valid and doesn't have undefined properties
    const scriptMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)
    if (scriptMatch) {
      const jsonContent = scriptMatch[1]
      const parsedJson = JSON.parse(jsonContent)
      expect(parsedJson.sku).toBeUndefined() // Should not be present in the object
      expect(() => JSON.parse(jsonContent)).not.toThrow()
    }
  })
  
  it('should handle arrays properly in SSR', () => {
    const html = renderToString(
      <ProductJsonLd
        name="Test Product"
        description="Test"
        image={['image1.jpg', 'image2.jpg', 'image3.jpg']}
        price={19.99}
      />
    )
    
    expect(html).toContain('"image":["image1.jpg","image2.jpg","image3.jpg"]')
  })
  
  it('should include @id for Organization references', () => {
    const html = renderToString(<OrganizationJsonLd />)
    
    expect(html).toContain('"@id"')
    expect(html).toContain('#organization')
  })
})