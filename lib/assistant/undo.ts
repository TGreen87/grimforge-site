import { TablesInsert } from '@/integrations/supabase/types'
import { createServiceClient } from '@/lib/supabase/server'

export interface UndoToken {
  token: string
  expiresAt: string
}

export interface CreateUndoTokenOptions {
  actionType: string
  payload: Record<string, unknown>
  sessionId?: string | null
  userId?: string | null
  ttlMinutes?: number
}

export async function createUndoToken(options: CreateUndoTokenOptions): Promise<UndoToken> {
  const supabase = createServiceClient()
  const ttl = Math.max(1, options.ttlMinutes ?? 30)
  const expiresAt = new Date(Date.now() + ttl * 60 * 1000).toISOString()

  const record: TablesInsert<'assistant_action_undos'> = {
    action_type: options.actionType,
    payload: options.payload as TablesInsert<'assistant_action_undos'>['payload'],
    expires_at: expiresAt,
  }

  if (options.sessionId !== undefined) {
    record.session_id = options.sessionId ?? null
  }

  if (options.userId !== undefined) {
    record.created_by = options.userId ?? null
  }

  const { data, error } = await supabase
    .from('assistant_action_undos')
    .insert(record)
    .select('id, expires_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create undo token')
  }

  return {
    token: data.id,
    expiresAt: data.expires_at,
  }
}

export async function loadUndoToken(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('assistant_action_undos')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function markUndoCompleted(id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('assistant_action_undos')
    .update({ undone_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
