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

  // Minimal markdown rendering: supports headings (#), lists (-), code blocks (```), and paragraphs.
  const raw = (article.content || article.excerpt || '').trim()
  const lines: string[] = raw.split(/\n/)
  const blocks: Array<{ type: string; content: string[] }> = []
  let inCode = false
  lines.forEach((ln: string) => {
    if (ln.trim().startsWith('```')) {
      inCode = !inCode
      if (inCode) blocks.push({ type: 'code', content: [] })
      return
    }
    if (inCode) {
      blocks[blocks.length - 1].content.push(ln)
      return
    }
    if (/^\s*#/.test(ln)) {
      blocks.push({ type: 'heading', content: [ln.replace(/^\s*#+\s*/, '')] })
    } else if (/^\s*-\s+/.test(ln)) {
      const last = blocks[blocks.length - 1]
      if (!last || last.type !== 'list') blocks.push({ type: 'list', content: [] })
      blocks[blocks.length - 1].content.push(ln.replace(/^\s*-\s+/, ''))
    } else if (ln.trim() === '') {
      blocks.push({ type: 'br', content: [] })
    } else {
      const last = blocks[blocks.length - 1]
      if (!last || last.type !== 'p') blocks.push({ type: 'p', content: [] })
      blocks[blocks.length - 1].content.push(ln)
    }
  })

  return (
    <main>
      <article className="container mx-auto px-4 py-8">
        <ArticleJsonLd
          title={article.title}
          description={article.excerpt || article.description || ''}
          image={article.image_url}
          datePublished={article.published_at}
          dateModified={article.updated_at}
          author={article.author}
        />
        <header className="mb-6">
          <h1 className="blackletter text-4xl md:text-6xl mb-2 text-bone break-words">{article.title}</h1>
          <p className="text-sm text-muted-foreground">
            {article.author ? `${article.author} • ` : ''}{article.published_at ? new Date(article.published_at).toLocaleDateString() : ''}
          </p>
          {article.excerpt && <p className="text-base md:text-lg text-muted-foreground max-w-3xl mt-2">{article.excerpt}</p>}
        </header>
        {article.image_url && (
          <div className="mb-6">
            <img src={article.image_url} alt={article.title} className="w-full max-w-3xl rounded border border-border" />
          </div>
        )}
        <div className="prose prose-invert max-w-3xl">
          {blocks.length > 0 ? (
            blocks.map((b, i) => {
              if (b.type === 'heading') return <h2 key={i}>{b.content.join(' ')}</h2>
              if (b.type === 'list') return (
                <ul key={i}>
                  {b.content.map((li, j) => <li key={j}>{li}</li>)}
                </ul>
              )
              if (b.type === 'code') return <pre key={i}><code>{b.content.join('\n')}</code></pre>
              if (b.type === 'p') return <p key={i}>{b.content.join(' ')}</p>
              return <br key={i} />
            })
          ) : (
            <p>{article.description || ''}</p>
          )}
        </div>
      </article>
    </main>
  )
}
