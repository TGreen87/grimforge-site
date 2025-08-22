import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateProductMetadata } from '@/lib/seo/metadata'
import { ProductJsonLd, BreadcrumbJsonLd, MusicAlbumJsonLd } from '@/components/seo/JsonLd'

interface ProductPageProps {
  params: { slug: string }
}

async function getProduct(slug: string) {
  const supabase = createClient()
  
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      variants (
        *,
        inventory (*)
      )
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  
  if (error || !product) {
    return null
  }
  
  return product
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug)
  
  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for could not be found.'
    }
  }
  
  // Calculate availability based on inventory
  const totalInventory = product.variants?.reduce((acc: number, variant: any) => {
    return acc + (variant.inventory?.available || 0)
  }, 0) || 0
  
  const availability = totalInventory > 0 ? 'In Stock' : 'Out of Stock'
  
  return generateProductMetadata({
    name: product.name,
    description: product.description || `${product.name} - Available at Obsidian Rite Records`,
    image: product.image_url,
    slug: params.slug,
    price: product.price,
    availability
  })
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug)
  
  if (!product) {
    notFound()
  }
  
  // Calculate availability and price for structured data
  const totalInventory = product.variants?.reduce((acc: number, variant: any) => {
    return acc + (variant.inventory?.available || 0)
  }, 0) || 0
  
  const availability = totalInventory > 0 ? 'InStock' : 'OutOfStock'
  const lowestPrice = product.variants?.reduce((min: number, variant: any) => {
    return variant.price < min ? variant.price : min
  }, product.variants[0]?.price || product.price) || product.price
  
  // Determine if this is a music album
  const isMusicAlbum = product.category === 'music' || 
                       product.category === 'album' || 
                       product.tags?.includes('music') ||
                       product.tags?.includes('album') ||
                       product.format?.includes('vinyl') ||
                       product.format?.includes('cd') ||
                       product.format?.includes('cassette')
  
  return (
    <main>
      {/* Breadcrumb JSON-LD */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Products', url: '/products' },
          { name: product.name }
        ]}
      />
      
      {/* Product or Music Album JSON-LD */}
      {isMusicAlbum ? (
        <MusicAlbumJsonLd
          name={product.name}
          description={product.description || ''}
          image={product.image_url || '/placeholder.svg'}
          artist={product.artist || product.band || 'Various Artists'}
          datePublished={product.release_date || product.created_at}
          genre={product.genre ? [product.genre] : ['Black Metal', 'Metal']}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING}/products/${params.slug}`}
          price={lowestPrice}
          availability={availability}
        />
      ) : (
        <ProductJsonLd
          name={product.name}
          description={product.description || ''}
          image={product.image_url || '/placeholder.svg'}
          sku={product.sku || params.slug}
          price={lowestPrice}
          availability={availability}
          category={product.category || 'Merchandise'}
          url={`${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING}/products/${params.slug}`}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
        
        {product.image_url && (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full max-w-md mb-6"
          />
        )}
        
        <div className="prose max-w-none mb-6">
          <p>{product.description}</p>
        </div>
        
        <div className="mb-6">
          <p className="text-2xl font-bold">${lowestPrice} AUD</p>
          <p className="text-lg">{availability === 'InStock' ? 'In Stock' : 'Out of Stock'}</p>
        </div>
        
        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-3">Available Formats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.variants.map((variant: any) => (
                <div key={variant.id} className="border p-4 rounded">
                  <h3 className="font-semibold">{variant.name}</h3>
                  <p className="text-lg">${variant.price} AUD</p>
                  <p>Available: {variant.inventory?.available || 0}</p>
                  {variant.format && <p>Format: {variant.format}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <button className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800">
            Add to Cart
          </button>
        </div>
      </div>
    </main>
  )
}