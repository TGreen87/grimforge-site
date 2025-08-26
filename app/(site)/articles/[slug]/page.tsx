import { Metadata } from 'next'
import { notFound } from 'next/navigation'
// Temporarily disable complex imports to fix build issues
// import { generateArticleMetadata } from '@/lib/seo/metadata'
// import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
// import { getArticle } from './metadata'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  
  return {
    title: `Article: ${slug}`,
    description: 'Article content from Obsidian Rite Records'
  }
}

// Disable static generation for now to avoid SSR issues
export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  
  return (
    <main>
      <article className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Article: {slug}</h1>
          <p className="text-xl text-gray-700 mb-6">Article content will be available soon.</p>
        </header>
        
        <div className="prose prose-lg max-w-4xl mx-auto">
          <p>This article page is under construction. The full article system will be implemented once the database schema is finalized.</p>
        </div>
      </article>
    </main>
  )
}