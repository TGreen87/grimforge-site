import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { recordAssistantUpload } from '@/lib/assistant/sessions'
import { assertAdmin } from '@/lib/assistant/auth'

const BUCKET_NAME = 'assistant-media'

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
  const sessionId = (formData.get('sessionId') as string | null) ?? null
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

  try {
    await recordAssistantUpload({
      storagePath: path,
      fileName: file.name,
      sizeBytes: file.size,
      mimeType: file.type || null,
      sessionId,
      userId: admin.userId,
    })
  } catch (error) {
    console.error('Failed to persist assistant upload audit', error)
  }

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

  try {
    await supabase.from('assistant_uploads').delete().eq('storage_path', path)
  } catch (auditError) {
    console.error('Failed to delete assistant upload record', auditError)
  }

  return NextResponse.json({ ok: true })
}
