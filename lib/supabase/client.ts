import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/integrations/supabase/types'

/**
 * Create a Supabase client for client-side operations
 * This uses the public anon key which is safe to expose
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}