import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ThreeDTilt from '@/components/fx/ThreeDTilt'

const baseRect = {
  width: 200,
  height: 200,
  top: 0,
  left: 0,
  right: 200,
  bottom: 200,
  x: 0,
  y: 0,
  toJSON: () => ({}),
}

function mockMatchMedia(prefersReducedMotion = false) {
  return vi.fn().mockImplementation((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? prefersReducedMotion : false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    media: query,
    onchange: null,
    dispatchEvent: () => false,
  }))
}

describe('ThreeDTilt', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error happy-dom typings
    window.matchMedia = mockMatchMedia()
  })

  it('clamps rotation to ±8 degrees', () => {
    const { container } = render(
      <ThreeDTilt>
        <div>content</div>
      </ThreeDTilt>,
    )

    const tiltRoot = container.firstElementChild as HTMLDivElement
    expect(tiltRoot).toBeTruthy()

    tiltRoot.getBoundingClientRect = () => baseRect as DOMRect

    fireEvent.pointerEnter(tiltRoot, { pointerType: 'mouse' })
    fireEvent.pointerMove(tiltRoot, { pointerType: 'mouse', clientX: 1000, clientY: -1000 })

    const transform = tiltRoot.style.transform
    const rotateXMatch = transform.match(/rotateX\((-?\d+\.?\d*)deg\)/)
    const rotateYMatch = transform.match(/rotateY\((-?\d+\.?\d*)deg\)/)

    expect(rotateXMatch).not.toBeNull()
    expect(rotateYMatch).not.toBeNull()

    const rotateX = parseFloat(rotateXMatch?.[1] ?? '0')
    const rotateY = parseFloat(rotateYMatch?.[1] ?? '0')

    expect(Math.abs(rotateX)).toBeLessThanOrEqual(8)
    expect(Math.abs(rotateY)).toBeLessThanOrEqual(8)
  })

  it('resets to neutral transform on pointer leave', () => {
    const { container } = render(
      <ThreeDTilt>
        <div>content</div>
      </ThreeDTilt>,
    )

    const tiltRoot = container.firstElementChild as HTMLDivElement
    tiltRoot.getBoundingClientRect = () => baseRect as DOMRect

    fireEvent.pointerEnter(tiltRoot, { pointerType: 'mouse' })
    fireEvent.pointerMove(tiltRoot, { pointerType: 'mouse', clientX: 50, clientY: 50 })
    fireEvent.pointerLeave(tiltRoot)

    expect(tiltRoot.style.transform).toBe('perspective(800px) rotateX(0deg) rotateY(0deg)')
    expect(tiltRoot.dataset.tiltActive).toBe('false')
  })

  it('disables tilt when reduced motion is preferred', () => {
    // @ts-expect-error happy-dom typings
    window.matchMedia = mockMatchMedia(true)

    const { container } = render(
      <ThreeDTilt>
        <div>content</div>
      </ThreeDTilt>,
    )

    const tiltRoot = container.firstElementChild as HTMLDivElement
    tiltRoot.getBoundingClientRect = () => baseRect as DOMRect

    fireEvent.pointerEnter(tiltRoot, { pointerType: 'mouse' })
    fireEvent.pointerMove(tiltRoot, { pointerType: 'mouse', clientX: 150, clientY: 150 })

    expect(tiltRoot.dataset.tiltDisabled).toBe('true')
    expect(tiltRoot.style.transform).toBe('perspective(800px) rotateX(0deg) rotateY(0deg)')
  })
})
