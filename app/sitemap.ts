import { MetadataRoute } from 'next'
import { getSupabaseServerClient } from '@/integrations/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || 'https://obsidianriterecords.com'

  // Only create a Supabase client if env is available in this environment (e.g., Netlify connector)
  const hasSupabaseEnv = Boolean(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  )

  const supabase = hasSupabaseEnv ? getSupabaseServerClient() as any : null

  let products: { slug: string; updated_at: string }[] | null = null
  let articles: { slug: string; updated_at: string }[] | null = null

  if (supabase) {
    try {
      const { data } = await supabase
        .from('products')
        .select('slug, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
      products = data
    } catch {
      products = []
    }
  } else {
    products = []
  }
  
  if (supabase) {
    try {
      const { data } = await supabase
        .from('articles')
        .select('slug, updated_at')
        .eq('published', true)
        .order('updated_at', { ascending: false })
      articles = data
    } catch {
      articles = []
    }
  } else {
    articles = []
  }
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9
    },
    {
      url: `${siteUrl}/articles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5
    },
    {
      url: `${siteUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3
    }
  ]
  
  // Add product pages
  if (products && products.length > 0) {
    const productRoutes = products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: new Date(product.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8
    }))
    routes.push(...productRoutes)
  }
  
  // Add article pages
  if (articles && articles.length > 0) {
    const articleRoutes = articles.map((article) => ({
      url: `${siteUrl}/articles/${article.slug}`,
      lastModified: new Date(article.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6
    }))
    routes.push(...articleRoutes)
  }
  
  return routes
}
