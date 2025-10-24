import type { ReactNode } from 'react'
import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: () => '/test-path',
}))

vi.mock('framer-motion', async () => {
  const ReactActual = await import('react')

  const PassThrough = ({ children }: { children: ReactNode }) => <>{children}</>

  return {
    MotionConfig: PassThrough,
    AnimatePresence: PassThrough,
    motion: {
      div: ({ children }: { children: ReactNode }) => <div data-testid="motion-stub">{children}</div>,
    },
    useReducedMotion: () => true,
  }
})

import GrimnessPageTransition from '@/components/fx/GrimnessPageTransition'
import { GrimnessProvider } from '@/components/grimness/GrimnessContext'

const wrapper = ({ children }: { children: ReactNode }) => (
  <GrimnessProvider>{children}</GrimnessProvider>
)

describe('GrimnessPageTransition', () => {
  it('renders without animation wrapper when reduced motion is preferred', () => {
    const { queryByTestId, getByText } = render(
      <GrimnessPageTransition>
        <div>Content</div>
      </GrimnessPageTransition>,
      { wrapper }
    )

    expect(getByText('Content')).toBeInTheDocument()
    expect(queryByTestId('grimness-transition-wrapper')).toBeNull()
  })
})
