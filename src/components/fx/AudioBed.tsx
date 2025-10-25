'use client'

import { useEffect, useRef } from 'react'

import { useGrimness } from '@/components/grimness/GrimnessContext'

const AUDIO_SRC = '/audio/vinyl.mp3'
const AUDIO_ENABLED = process.env.NEXT_PUBLIC_AUDIO_ENABLED === '1'
const FADE_DURATION_MS = 300

type HowlerBackend = {
  type: 'howler'
  howl: {
    play: () => Promise<void> | void
    playing: () => boolean
    volume: (value?: number) => number
    fade?: (from: number, to: number, duration: number) => void
    stop: () => void
    unload: () => void
  }
}

type HtmlBackend = {
  type: 'html'
  audio: HTMLAudioElement
}

type AudioBackend = HowlerBackend | HtmlBackend

declare global {
  interface Window {
    ORR_AUDIO?: {
      mute: () => void
      unmute: () => void
      isMuted: () => boolean
    }
    Howl?: any
    Howler?: any
  }
}

function clampVolume(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function squareVolume(value: number) {
  const clamped = clampVolume(value)
  return clampVolume(clamped * clamped * 0.2)
}

export default function AudioBed() {
  const { weights, levelIndex } = useGrimness()
  const backendRef = useRef<AudioBackend | null>(null)
  const htmlFadeRef = useRef<number | null>(null)
  const isMutedRef = useRef(false)
  const latestTargetRef = useRef(0)
  const htmlErrorHandlerRef = useRef<EventListener | null>(null)
  const assetStatusRef = useRef<'unknown' | 'ready' | 'missing'>(AUDIO_ENABLED ? 'unknown' : 'missing')

  const ensureControls = () => {
    if (typeof window === 'undefined') return
    if (!window.ORR_AUDIO) {
      window.ORR_AUDIO = {
        mute: () => {
          isMutedRef.current = true
          applyVolume(0)
        },
        unmute: () => {
          isMutedRef.current = false
          applyVolume(latestTargetRef.current)
        },
        isMuted: () => isMutedRef.current,
      }
    }
  }

  const cleanupHtmlFade = () => {
    if (htmlFadeRef.current !== null) {
      cancelAnimationFrame(htmlFadeRef.current)
      htmlFadeRef.current = null
    }
  }

  const applyVolume = (target: number) => {
    const clampedTarget = clampVolume(target)
    latestTargetRef.current = clampedTarget
    const backend = backendRef.current

    if (!backend || !AUDIO_ENABLED || assetStatusRef.current !== 'ready') return

    const desired = isMutedRef.current ? 0 : clampedTarget

    if (backend.type === 'howler') {
      const instance = backend.howl
      const current = clampVolume(instance.volume())
      if (typeof instance.fade === 'function') {
        instance.fade(current, clampVolume(desired), FADE_DURATION_MS)
      } else {
        instance.volume(clampVolume(desired))
      }
      const shouldPlay = clampVolume(desired) > 0
      if (shouldPlay && typeof instance.play === 'function' && !instance.playing()) {
        try {
          void instance.play()
        } catch (error) {
          console.warn('AudioBed: unable to start playback', error)
        }
      }
      return
    }

    const audio = backend.audio
    const startVolume = clampVolume(audio.volume)
    const safeTarget = clampVolume(desired)
    const delta = safeTarget - startVolume
    if (Math.abs(delta) < 0.01) {
      audio.volume = safeTarget
      if (safeTarget > 0) {
        void audio.play().catch(() => null)
      }
      return
    }

    cleanupHtmlFade()
    const start = performance.now()
    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / FADE_DURATION_MS)
      audio.volume = clampVolume(startVolume + delta * progress)
      if (progress < 1) {
        htmlFadeRef.current = requestAnimationFrame(animate)
      } else {
        htmlFadeRef.current = null
      }
    }
    htmlFadeRef.current = requestAnimationFrame(animate)
    if (safeTarget > 0) {
      void audio.play().catch(() => null)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    ensureControls()

    if (!AUDIO_ENABLED) {
      return () => {
        cleanupHtmlFade()
        backendRef.current = null
      }
    }

    let disposed = false

    const cleanupBackend = () => {
      cleanupHtmlFade()
      const backend = backendRef.current
      if (backend?.type === 'howler') {
        try {
          backend.howl.stop()
          backend.howl.unload()
        } catch (error) {
          console.warn('AudioBed: failed to cleanup howler', error)
        }
      } else if (backend?.type === 'html') {
        if (htmlErrorHandlerRef.current) {
          backend.audio.removeEventListener('error', htmlErrorHandlerRef.current)
          htmlErrorHandlerRef.current = null
        }
        backend.audio.pause()
        backend.audio.remove()
      }
      backendRef.current = null
    }

    const establishBackend = async () => {
      if (disposed || assetStatusRef.current !== 'ready' || backendRef.current) return

      const globalHowl = typeof window !== 'undefined' ? window.Howl : undefined

      if (typeof globalHowl === 'function') {
        try {
          const howlInstance = new globalHowl({
            src: [AUDIO_SRC],
            loop: true,
            volume: 0,
            html5: true,
            onloaderror: () => {
              console.warn('AudioBed: Howler failed to load audio asset, disabling bed')
              assetStatusRef.current = 'missing'
              backendRef.current = null
            },
          })
          backendRef.current = { type: 'howler', howl: howlInstance }
          try {
            void howlInstance.play()
          } catch {
            // ignore autoplay restrictions
          }
          applyVolume(latestTargetRef.current)
          return
        } catch (error) {
          console.warn('AudioBed: failed to initialise howler backend', error)
        }
      }

      const audio = document.createElement('audio')
      audio.src = AUDIO_SRC
      audio.loop = true
      audio.preload = 'auto'
      audio.volume = 0
      audio.setAttribute('data-orr-audio', 'bed')
      const tryPlay = () => {
        void audio.play().catch(() => null)
      }
      const handleError: EventListener = () => {
        console.warn('AudioBed: audio asset failed to load, disabling bed')
        assetStatusRef.current = 'missing'
        cleanupBackend()
      }
      htmlErrorHandlerRef.current = handleError
      audio.addEventListener('canplay', tryPlay, { once: true })
      audio.addEventListener('error', handleError)
      document.body.appendChild(audio)
      backendRef.current = { type: 'html', audio }
      applyVolume(latestTargetRef.current)
    }

    const verifyAsset = async () => {
      if (assetStatusRef.current === 'ready') {
        await establishBackend()
        return
      }

      try {
        const response = await fetch(AUDIO_SRC, { method: 'HEAD' })
        if (!disposed && response.ok) {
          assetStatusRef.current = 'ready'
          await establishBackend()
        } else if (!disposed) {
          assetStatusRef.current = 'missing'
        }
      } catch (error) {
        if (!disposed) {
          assetStatusRef.current = 'missing'
          console.warn('AudioBed: audio asset unavailable, skipping playback', error)
        }
      }
    }

    void verifyAsset()

    return () => {
      disposed = true
      cleanupBackend()
    }
  }, [])

  useEffect(() => {
    const targetVolume = levelIndex === 0 ? 0 : squareVolume(weights.audioGain)
    const clamped = clampVolume(targetVolume)
    latestTargetRef.current = clamped
    applyVolume(clamped)
  }, [levelIndex, weights.audioGain])

  return null
}
