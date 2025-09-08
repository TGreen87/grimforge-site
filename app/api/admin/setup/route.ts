import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.SUPABASE_DATABASE_URL
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !service) throw new Error('Supabase env missing')
  return createServerClient(url as any, service as any, {
    cookies: { get() { return undefined }, set() {}, remove() {} },
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  } as any)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('x-setup-token') || ''
    const expected = process.env.ADMIN_SETUP_TOKEN || ''
    if (!expected) {
      return NextResponse.json({ error: 'ADMIN_SETUP_TOKEN not set' }, { status: 503 })
    }
    if (token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, password } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })

    const supabase = getClient()

    // Try to find user
    const { data: users, error: listErr } = await (supabase as any).auth.admin.listUsers({ page: 1, perPage: 200 })
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 })
    let user = users.users.find((u: any) => (u.email || '').toLowerCase() === String(email).toLowerCase())

    if (!user) {
      const { data, error } = await (supabase as any).auth.admin.createUser({ email, password, email_confirm: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      user = data.user
    } else {
      const { error } = await (supabase as any).auth.admin.updateUserById(user.id, { password, email_confirm: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Upsert admin role
    const { error: roleErr } = await (supabase as any)
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id' })
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, user_id: user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'setup failed' }, { status: 500 })
  }
}

