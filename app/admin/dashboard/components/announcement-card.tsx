'use client'

import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

import { updateDashboardAnnouncement } from '../actions'

interface AnnouncementRecord {
  id: string
  message: string
  updated_at: string
}

interface Props {
  announcement: AnnouncementRecord | null
}

const DEFAULT_MESSAGE = 'Welcome back! Review paid orders and publish new releases when you\'re ready.'

export default function AnnouncementCard({ announcement }: Props) {
  const [value, setValue] = React.useState(announcement?.message ?? DEFAULT_MESSAGE)
  const [isSaving, startTransition] = React.useTransition()

  const lastUpdated = announcement?.updated_at
    ? formatDistanceToNow(new Date(announcement.updated_at), { addSuffix: true })
    : 'not updated yet'

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateDashboardAnnouncement(value)
        toast.success('Announcement updated')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update announcement'
        toast.error(message)
      }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-background/60 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-bone">Dashboard announcement</h2>
          <p className="text-sm text-muted-foreground">
            This message appears at the top of the dashboard for all admins. Use it for release reminders or urgent ops notes.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setValue(DEFAULT_MESSAGE)}
          disabled={isSaving}
        >
          Reset copy
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={4}
          maxLength={320}
          className="bg-background/80"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">Last updated {lastUpdated}</span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setValue(announcement?.message ?? DEFAULT_MESSAGE)}
              disabled={isSaving}
            >
              Undo changes
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save announcement'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
