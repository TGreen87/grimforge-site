import { Metadata } from 'next'
import { notFound } from 'next/navigation'
// Temporarily disable complex imports to fix build issues
// import { generateProductMetadata } from '@/lib/seo/metadata'
// import { ProductJsonLd, BreadcrumbJsonLd, MusicAlbumJsonLd } from '@/components/seo/JsonLd'
// import { getProduct } from './metadata'

interface Inventory {
  available?: number
}

interface Variant {
  id: string
  name: string
  price: number
  inventory?: Inventory
  format?: string
  product_id?: string
}

interface Product {
  id: string
  name?: string
  title: string
  description?: string
  image_url?: string
  image?: string
  price: number
  sku?: string
  category?: string
  tags?: string[]
  format?: string[]
  artist?: string
  created_at?: string
  active: boolean
  slug?: string
  variants?: Variant[]
}

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `Product: ${slug}`,
    description: 'Product from Obsidian Rite Records'
  }
}

// Disable static generation for now to avoid SSR issues
export const dynamic = 'force-dynamic'

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  
  return (
    <main>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">Product: {slug}</h1>
        
        <div className="prose max-w-none mb-6">
          <p>Product details will be available once the database integration is complete.</p>
        </div>
        
        <div className="mb-6">
          <p className="text-2xl font-bold">$29.99 AUD</p>
          <p className="text-lg">Coming Soon</p>
        </div>
        
        <div className="mt-8">
          <button className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800">
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  )
}