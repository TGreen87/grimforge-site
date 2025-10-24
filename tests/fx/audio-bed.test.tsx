import React from 'react'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import AudioBed from '@/components/fx/AudioBed'
import { GrimnessProvider } from '@/components/grimness/GrimnessContext'

describe('AudioBed', () => {
  beforeEach(() => {
    delete (window as any).ORR_AUDIO
    delete (window as any).Howl
  })

  it('mounts without howler and exposes ORR_AUDIO controls', async () => {
    const { unmount } = render(
      <GrimnessProvider>
        <AudioBed />
      </GrimnessProvider>,
    )

    await waitFor(() => {
      expect(window.ORR_AUDIO).toBeDefined()
    })

    expect(typeof window.ORR_AUDIO?.mute).toBe('function')
    expect(typeof window.ORR_AUDIO?.unmute).toBe('function')

    unmount()
  })
})
