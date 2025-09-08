import { Metadata } from 'next'
import { getSupabaseServerClient } from '@/integrations/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin · Validate',
}

function Row({ label, ok, note }: { label: string; ok: boolean; note?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm">
        <span className={ok ? 'text-green-600' : 'text-red-600'}>{ok ? 'OK' : 'Missing'}</span>
        {note ? <span className="ml-2 text-muted-foreground">{note}</span> : null}
      </div>
    </div>
  )
}

export default async function ValidatePage() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY)
  const hasService = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE)

  let dbPing: { ok: boolean; note?: string } = { ok: false }
  if (hasUrl && hasAnon) {
    try {
      const supabase = getSupabaseServerClient() as any
      // lightweight ping: try selecting a single product slug
      const { error } = await supabase.from('products').select('id').limit(1)
      dbPing.ok = !error
      dbPing.note = error ? error.message : 'select ok'
    } catch (e: any) {
      dbPing = { ok: false, note: e?.message || 'failed to initialize client' }
    }
  } else {
    dbPing = { ok: false, note: 'env not present' }
  }

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Environment Validation</h1>
      <div className="rounded-md border border-border/60 p-4">
        <Row label="NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL" ok={hasUrl} />
        <Row label="NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_ANON_KEY" ok={hasAnon} />
        <Row label="SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE" ok={hasService} />
        <Row label="DB ping (products)" ok={dbPing.ok} note={dbPing.note} />
      </div>
      <p className="text-xs text-muted-foreground mt-3">This page is safe: no secrets are rendered.</p>
    </main>
  )
}

