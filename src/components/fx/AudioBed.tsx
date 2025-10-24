'use client'

import { useEffect, useRef } from 'react'

import { useGrimness } from '@/components/grimness/GrimnessContext'

const AUDIO_SRC = '/audio/vinyl.mp3'
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

function squareVolume(value: number) {
  const clamped = Math.max(0, Math.min(1, value))
  return clamped * clamped * 0.2
}

export default function AudioBed() {
  const { weights, levelIndex } = useGrimness()
  const backendRef = useRef<AudioBackend | null>(null)
  const htmlFadeRef = useRef<number | null>(null)
  const isMutedRef = useRef(false)
  const latestTargetRef = useRef(0)

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
    latestTargetRef.current = target
    const backend = backendRef.current
    if (!backend) return

    if (isMutedRef.current) {
      target = 0
    }

    if (backend.type === 'howler') {
      const instance = backend.howl
      const current = instance.volume()
      if (typeof instance.fade === 'function') {
        instance.fade(current, target, FADE_DURATION_MS)
      } else {
        instance.volume(target)
      }
      if (!instance.playing()) {
        try {
          void instance.play()
        } catch (error) {
          console.warn('AudioBed: unable to start playback', error)
        }
      }
      return
    }

    const audio = backend.audio
    const startVolume = audio.volume
    const delta = target - startVolume
    if (Math.abs(delta) < 0.01) {
      audio.volume = target
      if (target > 0) {
        void audio.play().catch(() => null)
      }
      return
    }

    cleanupHtmlFade()
    const start = performance.now()
    const animate = (timestamp: number) => {
      const progress = Math.min(1, (timestamp - start) / FADE_DURATION_MS)
      audio.volume = startVolume + delta * progress
      if (progress < 1) {
        htmlFadeRef.current = requestAnimationFrame(animate)
      } else {
        htmlFadeRef.current = null
      }
    }
    htmlFadeRef.current = requestAnimationFrame(animate)
    if (target > 0) {
      void audio.play().catch(() => null)
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    ensureControls()

    let disposed = false
    const globalHowl = window.Howl

    const establishBackend = async () => {
      if (disposed) return

      if (typeof globalHowl === 'function') {
        try {
          const howlInstance = new globalHowl({
            src: [AUDIO_SRC],
            loop: true,
            volume: 0,
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
      audio.addEventListener('canplay', tryPlay, { once: true })
      document.body.appendChild(audio)
      backendRef.current = { type: 'html', audio }
      applyVolume(latestTargetRef.current)
    }

    void establishBackend()

    return () => {
      disposed = true
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
        backend.audio.pause()
        backend.audio.remove()
      }
      backendRef.current = null
    }
  }, [])

  useEffect(() => {
    const targetVolume = levelIndex === 0 ? 0 : squareVolume(weights.audioGain)
    latestTargetRef.current = targetVolume
    applyVolume(targetVolume)
  }, [levelIndex, weights.audioGain])

  return null
}
