import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function getSupabaseServerClient() {
  // Handle build-time scenarios where cookies() might not be available
  let cookieStore: any
  try {
    cookieStore = cookies()
  } catch (error) {
    // During build time, create a mock cookie store
    cookieStore = {
      get: () => undefined,
      set: () => {},
      delete: () => {}
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get?.(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set?.({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set?.({ name, value: '', ...options })
        },
      },
    }
  )
}


