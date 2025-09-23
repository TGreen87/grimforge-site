import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const BUCKET_NAME = 'assistant-media'

async function assertAdmin(request: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if ((role?.role ?? '').toLowerCase() === 'admin') {
    return { ok: true as const, userId: user.id }
  }

  return { ok: false as const, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

async function ensureBucket() {
  const supabase = createServiceClient()
  try {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB safety cap
    })
  } catch (error) {
    // ignore if bucket already exists
  }
}

export async function POST(request: NextRequest) {
  const admin = await assertAdmin(request)
  if (!admin.ok) {
    return admin.error
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const intent = (formData.get('intent') as string | null) ?? 'general'
  const intentSafe = intent.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() || 'general'

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  await ensureBucket()
  const supabase = createServiceClient()
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const extension = file.name.includes('.') ? file.name.split('.').pop() : undefined
  const path = `${intentSafe}/${Date.now()}-${Math.random().toString(36).slice(2)}${extension ? `.${extension}` : ''}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
      cacheControl: '3600',
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

  return NextResponse.json({
    url: publicUrlData?.publicUrl ?? '',
    path: path,
  })
}

export async function DELETE(request: NextRequest) {
  const admin = await assertAdmin(request)
  if (!admin.ok) {
    return admin.error
  }

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path])
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
