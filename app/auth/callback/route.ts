import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/integrations/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

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
        // Attempt to upsert a customer profile for this user using service role
        try {
          const { data: userData } = await supabase.auth.getUser()
          const user = userData?.user
          const email: string | null = (user?.email as string) || null
          const fullName: string | null = (user?.user_metadata?.full_name as string) || null
          if (email) {
            const svc = createServiceClient() as any
            // Upsert by email so we don't duplicate across multiple sign-ins
            await svc
              .from('customers')
              .upsert({ email, name: fullName || email }, { onConflict: 'email' })
          }
        } catch (e) {
          // Non-fatal: customer provisioning should not block auth
          console.warn('Customer upsert skipped:', (e as Error)?.message)
        }
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
