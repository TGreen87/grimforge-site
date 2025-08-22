import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase/types'

/**
 * Create a Supabase client for server-side operations
 * This client automatically handles cookie-based auth
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY_1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors in Server Components
          }
        },
      },
    }
  )
}

/**
 * Create a Supabase service role client for admin operations
 * NEVER expose this to the client or use in client components
 * This bypasses RLS policies - use with extreme caution
 */
export function createServiceClient() {
  return createServerClient<Database>(
    process.env.SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_1 || process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get() { return null },
        set() { },
        remove() { },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    }
  )
}