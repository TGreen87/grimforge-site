import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
