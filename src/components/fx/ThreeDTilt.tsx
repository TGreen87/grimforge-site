'use client'

import { useEffect, useRef, type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

const MAX_DEG = 8
const PERSPECTIVE = 800
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'
const GRIMNESS_ENABLED = process.env.NEXT_PUBLIC_GRIMNESS_ENABLED === '1'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface ThreeDTiltProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function ThreeDTilt({ children, className, ...divProps }: ThreeDTiltProps) {
  if (!GRIMNESS_ENABLED) {
    return (
      <div
        className={cn('three-d-tilt release-card', className)}
        data-tilt-disabled="true"
        {...divProps}
      >
        {children}
      </div>
    )
  }

  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotionQueryRef = useRef<MediaQueryList | null>(null)
  const tiltEnabledRef = useRef(true)

  useEffect(() => {
    const element = rootRef.current
    if (!element) return

    element.style.setProperty('--tilt-x', '0deg')
    element.style.setProperty('--tilt-y', '0deg')
    element.style.setProperty('--glare-x', '50%')
    element.style.setProperty('--glare-y', '50%')
    element.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`
    element.dataset.tiltActive = 'false'

    const reduceQuery = window.matchMedia?.(REDUCED_MOTION_QUERY) ?? null
    reduceMotionQueryRef.current = reduceQuery

    const updateEnabled = () => {
      const prefersReduce = Boolean(reduceQuery?.matches)
      tiltEnabledRef.current = !prefersReduce
      element.dataset.tiltDisabled = prefersReduce ? 'true' : 'false'
      if (prefersReduce) {
        resetTilt(element)
      }
    }

    updateEnabled()
    reduceQuery?.addEventListener('change', updateEnabled)

    const handlePointerMove = (event: PointerEvent) => {
      if (!tiltEnabledRef.current) return
      if (event.pointerType !== 'mouse') return
      if (!element.isConnected) return

      const rect = element.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const relativeX = (event.clientX - rect.left) / rect.width
      const relativeY = (event.clientY - rect.top) / rect.height

      const rotateY = clamp((relativeX - 0.5) * 2 * MAX_DEG, -MAX_DEG, MAX_DEG)
      const rotateX = clamp((0.5 - relativeY) * 2 * MAX_DEG, -MAX_DEG, MAX_DEG)

      element.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`)
      element.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`)
      element.style.setProperty('--glare-x', `${(relativeX * 100).toFixed(1)}%`)
      element.style.setProperty('--glare-y', `${(relativeY * 100).toFixed(1)}%`)
      element.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`
      element.dataset.tiltActive = 'true'
    }

    const neutralise = () => {
      if (!element.isConnected) return
      resetTilt(element)
    }

    const handlePointerEnter = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') {
        tiltEnabledRef.current = false
        element.dataset.tiltDisabled = 'true'
        return
      }
      tiltEnabledRef.current = !(reduceMotionQueryRef.current?.matches ?? false)
      element.dataset.tiltDisabled = tiltEnabledRef.current ? 'false' : 'true'
    }

    element.addEventListener('pointerenter', handlePointerEnter)
    element.addEventListener('pointermove', handlePointerMove, { passive: true })
    element.addEventListener('pointerleave', neutralise)
    element.addEventListener('pointercancel', neutralise)
    element.addEventListener('pointerup', neutralise)

    return () => {
      reduceQuery?.removeEventListener('change', updateEnabled)
      element.removeEventListener('pointerenter', handlePointerEnter)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerleave', neutralise)
      element.removeEventListener('pointercancel', neutralise)
      element.removeEventListener('pointerup', neutralise)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={cn('three-d-tilt release-card', className)}
      {...divProps}
    >
      {children}
    </div>
  )
}

function resetTilt(element: HTMLDivElement) {
  element.style.setProperty('--tilt-x', '0deg')
  element.style.setProperty('--tilt-y', '0deg')
  element.style.setProperty('--glare-x', '50%')
  element.style.setProperty('--glare-y', '50%')
  element.style.transform = `perspective(${PERSPECTIVE}px) rotateX(0deg) rotateY(0deg)`
  element.dataset.tiltActive = 'false'
}
