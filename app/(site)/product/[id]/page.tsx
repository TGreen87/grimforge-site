import { redirect, notFound } from 'next/navigation'
import { getSupabaseServerClient } from '@/integrations/supabase/server'

interface PageProps { params: Promise<{ id: string }> }

export const dynamic = 'force-dynamic'

export default async function LegacyProductRedirect({ params }: PageProps) {
  const { id } = await params
  const supabase = getSupabaseServerClient()

  // Try to find product by ID and redirect to slug route
  const { data: product, error } = await supabase
    .from('products')
    .select('slug, id, active')
    .eq('id', id)
    .single()

  if (error) {
    // If no record, 404
    notFound()
  }

  if (product?.slug) {
    redirect(`/products/${product.slug}`)
  }

  // If no slug yet, fallback: 404
  notFound()
}

