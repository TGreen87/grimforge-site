'use server'

import { revalidatePath } from 'next/cache'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function updateDashboardAnnouncement(message: string) {
  const trimmed = message.trim()
  if (trimmed.length === 0) {
    throw new Error('Announcement cannot be empty')
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('You must be signed in to update announcements')
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!role) {
    throw new Error('Only admins can update the announcement')
  }

  const service = createServiceClient()
  const { data: current } = await service
    .from('dashboard_announcements')
    .select('id')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const payload = {
    message: trimmed,
    updated_by: session.user.id,
    updated_at: new Date().toISOString(),
    is_active: true,
  }

  let announcementId = current?.id ?? null

  if (announcementId) {
    const { error } = await service
      .from('dashboard_announcements')
      .update(payload)
      .eq('id', announcementId)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { data, error } = await service
      .from('dashboard_announcements')
      .insert(payload)
      .select('id')
      .limit(1)
      .single()

    if (error) {
      throw new Error(error.message)
    }
    announcementId = data?.id ?? null
  }

  if (announcementId) {
    const { error: historyError } = await service.from('dashboard_announcement_history').insert({
      announcement_id: announcementId,
      message: trimmed,
      created_by: session.user.id,
    })
    if (historyError) {
      console.error('Failed to insert announcement history', historyError)
    }
  }

  revalidatePath('/admin/dashboard')
}

export async function revertDashboardAnnouncement(historyId: string) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('You must be signed in to revert announcements')
  }

  const { data: role } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  if (!role) {
    throw new Error('Only admins can revert an announcement')
  }

  const service = createServiceClient()
  const { data: history, error: historyError } = await service
    .from('dashboard_announcement_history')
    .select('announcement_id, message')
    .eq('id', historyId)
    .maybeSingle()

  if (historyError) {
    throw new Error(historyError.message)
  }
  if (!history?.announcement_id) {
    throw new Error('History entry not found')
  }

  const { error: updateError } = await service
    .from('dashboard_announcements')
    .update({
      message: history.message,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', history.announcement_id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  const { error: insertError } = await service.from('dashboard_announcement_history').insert({
    announcement_id: history.announcement_id,
    message: history.message,
    created_by: session.user.id,
  })
  if (insertError) {
    console.error('Failed to append announcement history during revert', insertError)
  }

  revalidatePath('/admin/dashboard')
}
