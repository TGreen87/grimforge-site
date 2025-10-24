import { describe, expect, it, beforeEach } from 'vitest'

import {
  disableVoidMode,
  enableVoidMode,
  isVoidModeEnabled,
  toggleVoidMode,
} from '@/components/fx/VoidToggle'
import { applyArtManifest } from '@/lib/artManifest'

describe('void-mode toggling', () => {
  beforeEach(() => {
    disableVoidMode()
    document.documentElement.classList.remove('void-mode')
    document.body.innerHTML = ''
  })

  it('adds and removes the html.void-mode class', () => {
    expect(isVoidModeEnabled()).toBe(false)

    enableVoidMode()
    expect(document.documentElement.classList.contains('void-mode')).toBe(true)
    expect(isVoidModeEnabled()).toBe(true)

    disableVoidMode()
    expect(document.documentElement.classList.contains('void-mode')).toBe(false)
    expect(isVoidModeEnabled()).toBe(false)
  })

  it('swaps image sources when void-mode toggles on and restores on exit', () => {
    const img = document.createElement('img')
    img.src = 'regular.jpg'
    document.body.appendChild(img)

    applyArtManifest({ img: { void: 'void.jpg' } }, document)

    toggleVoidMode(true)
    expect(img.dataset.voidSrcOrig).toMatch(/regular\.jpg$/)
    expect(img.src).toMatch(/void\.jpg$/)

    toggleVoidMode(false)
    expect(img.src).toMatch(/regular\.jpg$/)
  })
})
