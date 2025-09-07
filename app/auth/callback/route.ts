import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/integrations/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/'
  if (!next.startsWith('/')) next = '/'

  if (code) {
    try {
      const supabase = getSupabaseServerClient() as any
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        const forwardedHost = (request.headers.get('x-forwarded-host') || '').replace(/\s+/g, '')
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.redirect(`${origin}${next}`)
        }
        if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${next}`)
        }
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (e) {
      // fall through to error redirect
    }
  }
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

