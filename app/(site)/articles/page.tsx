import { getSupabaseServerClient } from '@/integrations/supabase/server'
import Link from 'next/link'

interface ArticleRow {
  id: string
  slug: string
  title: string
  excerpt: string | null
  image_url: string | null
  author: string | null
  published_at: string | null
}

export const dynamic = 'force-dynamic'

export default async function ArticlesIndex() {
  const supabase = getSupabaseServerClient()
  const { data } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })

  const rows = (data || []) as ArticleRow[]

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="blackletter text-4xl md:text-6xl mb-6 text-bone">Articles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rows.map((a) => (
          <Link key={a.id} href={`/articles/${a.slug}`} className="block border border-border rounded bg-card/60 hover:border-accent transition-colors overflow-hidden">
            {a.image_url && <img src={a.image_url} alt={a.title} className="w-full h-48 object-cover rounded-t" />}
            <div className="p-4">
              <h2 className="gothic-heading text-xl text-bone mb-2">{a.title}</h2>
              <p className="text-xs text-muted-foreground mb-1">
                {a.author ? `${a.author} • ` : ''}{a.published_at ? new Date(a.published_at).toLocaleDateString() : ''}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-3">{a.excerpt || ''}</p>
            </div>
          </Link>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">No published articles yet.</p>
        )}
      </div>
    </main>
  )
}
