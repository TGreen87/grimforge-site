'use client'

import { useEffect, useRef } from 'react'

import { applyArtManifest, voidArtManifest } from '@/lib/artManifest'

const VOIDMODE_ENABLED = process.env.NEXT_PUBLIC_VOIDMODE_ENABLED === '1'

const TOGGLE_KEY = '6'
const ACTIVATION_COUNT = 3
const ACTIVATION_WINDOW_MS = 2000

let voidModeEnabled = false

function swapImagesToVoid() {
  if (typeof window === 'undefined') return
  const images = document.querySelectorAll<HTMLImageElement>('img[data-void-src]')
  images.forEach((img) => {
    const targetSrc = img.dataset.voidSrc
    if (!targetSrc) return
    if (!img.dataset.voidSrcOrig) {
      img.dataset.voidSrcOrig = img.currentSrc || img.getAttribute('src') || ''
    }
    if (targetSrc && img.src !== targetSrc) {
      img.src = targetSrc
    }
  })
}

function restoreImagesFromVoid() {
  if (typeof window === 'undefined') return
  const images = document.querySelectorAll<HTMLImageElement>('img[data-void-src-orig]')
  images.forEach((img) => {
    const original = img.dataset.voidSrcOrig
    if (!original) return
    if (img.src !== original) {
      img.src = original
    }
  })
}

function dispatchVoidEvent(eventName: 'voidmode:on' | 'voidmode:off') {
  if (typeof window === 'undefined') return
  document.dispatchEvent(new CustomEvent(eventName))
}

export function enableVoidMode() {
  if (!VOIDMODE_ENABLED || typeof window === 'undefined') return
  const root = document.documentElement
  if (voidModeEnabled && root.classList.contains('void-mode')) return
  root.classList.add('void-mode')
  swapImagesToVoid()
  dispatchVoidEvent('voidmode:on')
  voidModeEnabled = true
}

export function disableVoidMode() {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  if (!voidModeEnabled && !root.classList.contains('void-mode')) return
  root.classList.remove('void-mode')
  restoreImagesFromVoid()
  dispatchVoidEvent('voidmode:off')
  voidModeEnabled = false
}

export function toggleVoidMode(force?: boolean) {
  if (!VOIDMODE_ENABLED || typeof window === 'undefined') return
  const shouldEnable = typeof force === 'boolean'
    ? force
    : !document.documentElement.classList.contains('void-mode')

  if (shouldEnable) {
    enableVoidMode()
  } else {
    disableVoidMode()
  }
}

export function isVoidModeEnabled() {
  if (typeof window === 'undefined') return false
  return document.documentElement.classList.contains('void-mode')
}

export function VoidToggle() {
  if (!VOIDMODE_ENABLED) {
    return null
  }

  const keypresses = useRef<number[]>([])

  useEffect(() => {
    applyArtManifest(voidArtManifest)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    voidModeEnabled = document.documentElement.classList.contains('void-mode')

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.isComposing) return
      const key = event.key || event.code
      if (key !== TOGGLE_KEY && event.code !== 'Numpad6') {
        keypresses.current = []
        return
      }

      const timestamp = Date.now()
      keypresses.current = [...keypresses.current, timestamp].filter((value) => value >= timestamp - ACTIVATION_WINDOW_MS)

      if (keypresses.current.length >= ACTIVATION_COUNT) {
        toggleVoidMode()
        keypresses.current = []
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => {
      window.removeEventListener('keydown', handleKeydown)
    }
  }, [])

  return null
}

export default VoidToggle
