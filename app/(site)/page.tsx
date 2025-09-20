// Server component wrapper to allow route segment options

import CampaignHero from '@/components/CampaignHero'
import ProductCatalog from '@/components/ProductCatalog'
import PreOrderSection from '@/components/PreOrderSection'
import GrimoireSection, { ArticlePreview } from '@/components/GrimoireSection'
import RecommendationEngine from '@/components/RecommendationEngine'
import { StorySections, NewsletterSection, TimelineEntry, TestimonialEntry, NewsletterContent } from '@/components/StorySections'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage({ searchParams }: { searchParams: Record<string, string | string[]> }) {
  const previewSlug = typeof searchParams?.previewCampaign === 'string' ? searchParams.previewCampaign : null

  const supabase = createServiceClient()

  const [timelineResponse, testimonialResponse, newsletterResponse, articlesResponse] = await Promise.all([
    supabase
      .from('story_timeline')
      .select('year, title, description, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('story_testimonials')
      .select('quote, author, sort_order')
      .order('sort_order', { ascending: true }),
    supabase
      .from('story_newsletter_settings')
      .select('heading, subheading, cta_label')
      .limit(1),
    supabase
      .from('articles')
      .select('id, slug, title, excerpt, image_url, author, published_at, tags')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3),
  ])

  const timeline: TimelineEntry[] = (timelineResponse.data ?? []).map((entry) => ({
    year: entry.year ?? '',
    title: entry.title ?? '',
    description: entry.description ?? '',
  }))

  const testimonials: TestimonialEntry[] = (testimonialResponse.data ?? []).map((entry) => ({
    quote: entry.quote ?? '',
    author: entry.author ?? '',
  }))

  const newsletter: NewsletterContent | null = newsletterResponse.data?.[0]
    ? {
        heading: newsletterResponse.data[0].heading ?? '',
        subheading: newsletterResponse.data[0].subheading ?? '',
        ctaLabel: newsletterResponse.data[0].cta_label ?? 'Subscribe',
      }
    : null

  const articles: ArticlePreview[] = (articlesResponse.data ?? []).map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    imageUrl: article.image_url,
    author: article.author,
    publishedAt: article.published_at,
    tags: Array.isArray(article.tags) ? article.tags : null,
  }))

  return (
    <>
      {/* Feature-flagged hero; falls back to legacy hero when disabled */}
      <CampaignHero previewSlug={previewSlug} />
      <ProductCatalog />
      <div className="container mx-auto px-4 py-16">
        <RecommendationEngine />
      </div>
      <PreOrderSection />
      <StorySections timeline={timeline} testimonials={testimonials} />
      <NewsletterSection content={newsletter} />
      <GrimoireSection articles={articles} />
    </>
  )
}
