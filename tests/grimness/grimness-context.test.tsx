import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'
import React, { type PropsWithChildren } from 'react'

import {
  GRIM_LEVELS,
  GrimnessProvider,
  calculateGrimnessWeights,
  useGrimness,
} from '@/components/grimness/GrimnessContext'

const STORAGE_KEY = 'orr:grimness'

function wrapper({ children }: PropsWithChildren) {
  return <GrimnessProvider>{children}</GrimnessProvider>
}

describe('GrimnessProvider', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('restores persisted level and writes updates back to storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, 'Goat-Approved')

    const { result } = renderHook(() => useGrimness(), { wrapper })

    expect(result.current.level).toBe('Goat-Approved')

    act(() => {
      result.current.setLevel('Full Ritual')
    })

    await waitFor(() => {
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe('Full Ritual')
    })
  })
})

describe('calculateGrimnessWeights', () => {
  it('produces monotonically increasing weights across the five levels', () => {
    const weightsByLevel = GRIM_LEVELS.map((_, index) => calculateGrimnessWeights(index))
    const keys: (keyof ReturnType<typeof calculateGrimnessWeights>)[] = [
      'fogIntensity',
      'vignette',
      'audioGain',
      'colorShift',
    ]

    keys.forEach((key) => {
      for (let index = 1; index < weightsByLevel.length; index += 1) {
        const previous = weightsByLevel[index - 1][key]
        const current = weightsByLevel[index][key]
        expect(previous).toBeGreaterThanOrEqual(0)
        expect(current).toBeLessThanOrEqual(1)
        expect(current).toBeGreaterThanOrEqual(previous)
      }
    })
  })
})
