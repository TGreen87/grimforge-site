import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Status',
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-mono">{value ?? '—'}</div>
    </div>
  )
}

export default async function StatusPage() {
  const env = process.env
  const node = process.version
  const context = env.CONTEXT || null
  const branch = env.BRANCH || null
  const commit = env.COMMIT_REF || null
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || env.URL || null
  const supaUrlPresent = Boolean(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL)
  const supaAnonPresent = Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY)
  const supaServicePresent = Boolean(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE)
  const shopifyDomain = env.SHOPIFY_STORE_DOMAIN || null
  const shopifyStorefrontToken = Boolean(env.SHOPIFY_STOREFRONT_API_TOKEN)
  const shopifyAdminToken = Boolean(env.SHOPIFY_ADMIN_API_TOKEN)

  return (
    <main className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Runtime Status</h1>
      <div className="rounded-md border border-border/60 p-4">
        <Item label="Node" value={node} />
        <Item label="Netlify CONTEXT" value={context} />
        <Item label="BRANCH" value={branch} />
        <Item label="COMMIT_REF" value={commit} />
        <Item label="NEXT_PUBLIC_SITE_URL" value={siteUrl} />
        <Item label="Supabase URL present" value={supaUrlPresent ? 'yes' : 'no'} />
        <Item label="Supabase ANON present" value={supaAnonPresent ? 'yes' : 'no'} />
        <Item label="Supabase SERVICE_ROLE present" value={supaServicePresent ? 'yes' : 'no'} />
        <Item label="Shopify domain" value={shopifyDomain} />
        <Item label="Shopify Storefront token" value={shopifyStorefrontToken ? 'yes' : 'no'} />
        <Item label="Shopify Admin token" value={shopifyAdminToken ? 'yes' : 'no'} />
      </div>
      <p className="text-xs text-muted-foreground mt-3">This page is safe: no secret values are printed, only presence.</p>
    </main>
  )
}
