import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const revalidate = 0

export async function GET() {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('stripe_events')
      .select('id, type, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      // Handle table missing (migration not yet applied) gracefully
      if ((error as any)?.code === '42P01') {
        return NextResponse.json({ events: [], warning: 'missing_table' })
      }
      throw error
    }

    return NextResponse.json({ events: data ?? [] })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load webhook events'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
