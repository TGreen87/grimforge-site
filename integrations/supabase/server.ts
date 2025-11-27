import { createClient } from '@/lib/supabase/server'

export async function getSupabaseServerClient() {
  return await createClient()
}
