'use server'

import { revalidatePath } from 'next/cache'

import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function updateDashboardAnnouncement(message: string) {
  const trimmed = message.trim()
  if (trimmed.length === 0) {
    throw new Error('Announcement cannot be empty')
  }

  const supabase = createClient()
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

  if (current?.id) {
    const { error } = await service
      .from('dashboard_announcements')
      .update(payload)
      .eq('id', current.id)

    if (error) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await service.from('dashboard_announcements').insert(payload)
    if (error) {
      throw new Error(error.message)
    }
  }

  revalidatePath('/admin/dashboard')
}
