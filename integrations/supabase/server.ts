import { createClient } from '@/lib/supabase/server'

export function getSupabaseServerClient() {
  return createClient()
}
