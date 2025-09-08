'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { getSupabaseBrowserClient } from '@/integrations/supabase/browser'
import { getBaseUrl } from '@/lib/runtime'

export default function SiteLoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const nextPath = useMemo(() => {
    const sp = (typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : undefined
    const raw = sp?.get('next') || searchParams?.next || '/'
    return raw?.startsWith('/') ? raw : '/'
  }, [searchParams?.next])

  const onGoogle = async () => {
    const supabase = getSupabaseBrowserClient()
    const origin = getBaseUrl()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  return (
    <main className="container mx-auto max-w-md px-4 py-20">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <div className="space-y-3">
        <Button onClick={onGoogle} className="w-full">Continue with Google</Button>
      </div>
    </main>
  )
}

