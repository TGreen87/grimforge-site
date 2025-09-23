import { Json, TablesInsert } from '@/integrations/supabase/types'
import { createServiceClient } from '@/lib/supabase/server'

export type AssistantSessionStatus = 'active' | 'completed' | 'failed'

export interface EnsureAssistantSessionOptions {
  sessionId: string
  userId?: string | null
  status?: AssistantSessionStatus
  metadata?: Record<string, unknown>
  title?: string | null
}

export interface LogAssistantEventOptions {
  sessionId: string
  eventType: string
  payload?: Record<string, unknown>
  userId?: string | null
}

export interface RecordAssistantUploadOptions {
  storagePath: string
  fileName: string
  sizeBytes: number
  mimeType?: string | null
  sessionId?: string | null
  userId?: string | null
}

export async function ensureAssistantSession(options: EnsureAssistantSessionOptions) {
  const supabase = createServiceClient()
  const record: TablesInsert<'assistant_sessions'> = {
    id: options.sessionId,
    status: options.status ?? 'active',
  }

  if (options.userId !== undefined) {
    record.user_id = options.userId ?? null
  }

  if (options.metadata) {
    record.metadata = options.metadata as unknown as Json
  }

  if (options.title !== undefined) {
    record.title = options.title ?? null
  }

  const { error } = await supabase.from('assistant_sessions').upsert(record, {
    onConflict: 'id',
    ignoreDuplicates: false,
  })

  if (error) {
    throw new Error(`Failed to upsert assistant session: ${error.message}`)
  }
}

export async function logAssistantEvent(options: LogAssistantEventOptions) {
  const supabase = createServiceClient()
  const event: TablesInsert<'assistant_session_events'> = {
    session_id: options.sessionId,
    event_type: options.eventType,
    payload: (options.payload ?? {}) as unknown as Json,
  }

  if (options.userId !== undefined) {
    event.actor_user_id = options.userId ?? null
  }

  const { error } = await supabase.from('assistant_session_events').insert(event)
  if (error) {
    throw new Error(`Failed to log assistant event: ${error.message}`)
  }
}

export async function recordAssistantUpload(options: RecordAssistantUploadOptions) {
  const supabase = createServiceClient()
  const row: TablesInsert<'assistant_uploads'> = {
    storage_path: options.storagePath,
    file_name: options.fileName,
    size_bytes: options.sizeBytes,
  }

  if (options.mimeType !== undefined) {
    row.mime_type = options.mimeType
  }

  if (options.sessionId !== undefined) {
    row.session_id = options.sessionId ?? null
  }

  if (options.userId !== undefined) {
    row.uploaded_by = options.userId ?? null
  }

  const { error } = await supabase.from('assistant_uploads').upsert(row, {
    onConflict: 'storage_path',
    ignoreDuplicates: false,
  })

  if (error) {
    throw new Error(`Failed to record assistant upload: ${error.message}`)
  }
}

export async function completeAssistantSession(sessionId: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('assistant_sessions')
    .update({ status: 'completed' })
    .eq('id', sessionId)

  if (error) {
    throw new Error(`Failed to complete assistant session: ${error.message}`)
  }
}
