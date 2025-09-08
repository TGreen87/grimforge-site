import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Resolve Supabase auth cookie prefix from project ref
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0]
const COOKIE_PREFIX = projectRef ? `sb-${projectRef}-auth-token` : undefined

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // 1) Refresh session if present (per Supabase SSR guidance)
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (key) => request.cookies.get(key)?.value,
          set: (key, value, options) => {
            response.cookies.set({ name: key, value, ...options })
          },
          remove: (key, options) => {
            response.cookies.set({ name: key, value: '', ...options, maxAge: 0 })
          },
        },
      }
    )
    await supabase.auth.getUser()
  } catch {}

  // 2) Admin gate (production only). Always allow previews/branch deploys.
  // Prefer hostname check for Netlify branch/preview (env vars may be missing at runtime)
  const host = request.nextUrl.hostname
  const isPreview = host.endsWith('.netlify.app')
  const isAdminPath = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')

  if (isAdminPath) {
    if (isPreview) return response
    if (!COOKIE_PREFIX) return response

    // Supabase may chunk the cookie (e.g., sb-<ref>-auth-token.0 / .1) — treat any match as presence
    const hasSbCookie = request.cookies.getAll().some(c => c.name === COOKIE_PREFIX || c.name.startsWith(`${COOKIE_PREFIX}.`))
    if (!hasSbCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    // Refresh tokens broadly; gate /admin inside the handler.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
