import { getSupabaseServerClient } from '@/integrations/supabase/server'

export async function getArticle(slug: string) {
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
    if (data) return data as any
  } catch {}
  return null
}
