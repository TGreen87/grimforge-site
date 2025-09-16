import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Create a Supabase client for server-side operations
 * This client automatically handles cookie-based auth
 */
function resolveCookieStore() {
  try {
    return cookies()
  } catch (error) {
    // During build-time or static generation, cookies() can throw. Fall back to a no-op shim.
    return {
      get: () => undefined,
      set: () => undefined,
      delete: () => undefined,
    }
  }
}

export function createClient() {
  const cookieStore = resolveCookieStore() as any

  return createServerClient(
    process.env.SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY_1 || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get?.(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set?.({ name, value, ...options })
          } catch (error) {
            // Suppress cookie side effects for server components / SSG.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            if (cookieStore.delete) {
              cookieStore.delete(name, options)
            } else {
              cookieStore.set?.({ name, value: '', ...options })
            }
          } catch (error) {
            // Ignore failures; we only need best-effort cleanup.
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
  return createServerClient(
    process.env.SUPABASE_URL_STAGING || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_1 || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE!,
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
