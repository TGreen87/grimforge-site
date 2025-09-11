import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { generateArticleMetadata } from '@/lib/seo/metadata'
import { ArticleJsonLd } from '@/components/seo/JsonLd'
import { getArticle } from './metadata'

interface ArticlePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)
  return generateArticleMetadata({
    title: article.title,
    description: article.excerpt || article.description,
    image: article.image_url,
    slug: article.slug,
    publishedTime: article.published_at,
    modifiedTime: article.updated_at,
    author: article.author,
  })
}

// Disable static generation for now to avoid SSR issues
export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getArticle(slug)
  if (!article) notFound()

  // Basic markdown-like paragraphs; can upgrade with MDX later
  const body = (article.content || article.excerpt || '').split(/\n{2,}/)

  return (
    <main>
      <article className="container mx-auto px-4 py-8">
        <ArticleJsonLd
          headline={article.title}
          description={article.excerpt || article.description || ''}
          image={article.image_url}
          datePublished={article.published_at}
          dateModified={article.updated_at}
          author={article.author}
          url={(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || '') + `/articles/${article.slug}`}
        />
        <header className="mb-8">
          <h1 className="blackletter text-4xl md:text-6xl mb-2 text-bone">{article.title}</h1>
          {article.excerpt && <p className="text-lg text-muted-foreground max-w-3xl">{article.excerpt}</p>}
        </header>
        <div className="prose prose-invert max-w-3xl">
          {body.length > 0 ? body.map((p: string, i: number) => (
            <p key={i}>{p}</p>
          )) : (
            <p>{article.description || ''}</p>
          )}
        </div>
      </article>
    </main>
  )
}
