import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateArticleMetadata } from '@/lib/seo/metadata'
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'
import { getArticle } from './metadata'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  
  if (!article) {
    return {
      title: 'Article Not Found',
      description: 'The article you are looking for could not be found.'
    }
  }
  
  return generateArticleMetadata({
    title: article.title,
    description: article.description || article.excerpt || `Read ${article.title} on Obsidian Rite Records`,
    image: article.image_url,
    slug: slug,
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    author: article.author
  })
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  
  if (!article) {
    notFound()
  }
  
  return (
    <main>
      {/* Breadcrumb JSON-LD */}
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Articles', url: '/articles' },
          { name: article.title }
        ]}
      />
      
      {/* Article JSON-LD */}
      <ArticleJsonLd
        headline={article.title}
        description={article.description || article.excerpt || ''}
        image={article.image_url || '/placeholder.svg'}
        datePublished={article.published_at}
        dateModified={article.updated_at}
        author={article.author}
        url={`${process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING}/articles/${slug}`}
      />
      
      <article className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
          
          <div className="flex items-center gap-4 text-gray-600 mb-4">
            <span>By {article.author}</span>
            <span>•</span>
            <time dateTime={article.published_at}>
              {new Date(article.published_at).toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
          
          {article.description && (
            <p className="text-xl text-gray-700 mb-6">{article.description}</p>
          )}
        </header>
        
        {article.image_url && (
          <img 
            src={article.image_url} 
            alt={article.title}
            className="w-full max-w-4xl mx-auto mb-8 rounded-lg"
          />
        )}
        
        <div className="prose prose-lg max-w-4xl mx-auto">
          {article.content ? (
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          ) : (
            <p>{article.excerpt || 'Article content coming soon...'}</p>
          )}
        </div>
      </article>
    </main>
  )
}