import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// GET: list current roles with emails (admin-only)
export async function GET() {
  try {
    const svc = createServiceClient() as any
    const { data: roles, error: rolesError } = await svc
      .from('user_roles')
      .select('user_id, role')

    if (rolesError) return NextResponse.json({ error: rolesError.message }, { status: 500 })

    const ids = Array.from(new Set((roles || []).map((r: any) => r.user_id).filter(Boolean)))
    let emailsById: Record<string, string> = {}
    if (ids.length) {
      const { data: users, error: usersError } = await svc
        .from('auth.users' as any)
        .select('id, email')
        .in('id', ids)
      if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 })
      emailsById = (users || []).reduce((acc: Record<string, string>, u: any) => {
        if (u?.id) acc[u.id] = u.email
        return acc
      }, {})
    }

    const result = (roles || []).map((r: any) => ({ user_id: r.user_id, email: emailsById[r.user_id] || '', role: r.role }))
    return NextResponse.json({ data: result })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// POST: grant admin role to a user by email
export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string, role?: string }
    const email = (body.email || '').trim().toLowerCase()
    const role = (body.role || 'admin').toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (role !== 'admin') return NextResponse.json({ error: 'Only admin role is supported' }, { status: 400 })

    const svc = createServiceClient() as any
    const { data: user, error: findErr } = await svc
      .from('auth.users' as any)
      .select('id, email')
      .eq('email', email)
      .single()

    if (findErr || !user?.id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Upsert admin role
    const { error: upsertErr } = await svc
      .from('user_roles')
      .upsert({ user_id: user.id, role: 'admin' }, { onConflict: 'user_id,role' as any })

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

// DELETE: remove admin role by email
export async function DELETE(req: Request) {
  try {
    const body = await req.json() as { email?: string }
    const email = (body.email || '').trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const svc = createServiceClient() as any
    const { data: user, error: findErr } = await svc
      .from('auth.users' as any)
      .select('id, email')
      .eq('email', email)
      .single()

    if (findErr || !user?.id) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { error: delErr } = await svc
      .from('user_roles')
      .delete()
      .eq('user_id', user.id)
      .eq('role', 'admin')

    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}

