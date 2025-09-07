import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'nimport { createServerClient } from '@supabase/ssr'

// Minimal server-side gate for admin routes using Supabase SSR cookie.
// Supabase cookie format: sb-<projectRef>-auth-token
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0]
const SUPABASE_COOKIE = projectRef ? `sb-${projectRef}-auth-token` : undefined

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip non-admin paths and the admin login page
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // Allow Netlify previews and branch deploys to bypass server-side cookie gate
  if (process.env.NETLIFY === 'true' && (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy')) {
    return NextResponse.next()
  }

  // If we can’t determine the cookie name, fall back to client-side guards
  if (!SUPABASE_COOKIE) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(SUPABASE_COOKIE)?.value
  if (!cookie) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Cookie exists; allow request
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Supabase cookie name helper
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0]
const SUPABASE_COOKIE = projectRef ? `sb-${projectRef}-auth-token` : undefined

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

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
  const isPreview = process.env.NETLIFY === 'true' && (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy')
  const isAdminPath = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')

  if (isAdminPath) {
    if (isPreview) return response
    if (!SUPABASE_COOKIE) return response

    const cookie = request.cookies.get(SUPABASE_COOKIE)?.value
    if (!cookie) {
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
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Resolve Supabase auth cookie name from project ref
const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0]
const SUPABASE_COOKIE = projectRef ? `sb-${projectRef}-auth-token` : undefined

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
  const isPreview = process.env.NETLIFY === 'true' && (process.env.CONTEXT === 'deploy-preview' || process.env.CONTEXT === 'branch-deploy')
  const isAdminPath = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')

  if (isAdminPath) {
    if (isPreview) return response
    if (!SUPABASE_COOKIE) return response

    const cookie = request.cookies.get(SUPABASE_COOKIE)?.value
    if (!cookie) {
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
