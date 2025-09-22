import { getSupabaseServerClient } from '@/integrations/supabase/server'
import type { Database } from '@/lib/supabase/types'

type ArticleRow = Database['public']['Tables']['articles']['Row']

export async function getArticle(slug: string): Promise<ArticleRow | null> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()

    if (error) {
      console.warn('Unable to load article metadata', { slug, error: error.message })
      return null
    }

    return (data as ArticleRow | null) ?? null
  } catch (error) {
    console.warn('Supabase not reachable while fetching article metadata', { slug, error })
    return null
  }
}
