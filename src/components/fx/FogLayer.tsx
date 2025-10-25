'use client'

import { useMemo, type CSSProperties } from 'react'

import { useGrimness } from '@/components/grimness/GrimnessContext'

const GRIMNESS_ENABLED = process.env.NEXT_PUBLIC_GRIMNESS_ENABLED === '1'

export default function FogLayer() {
  const { weights } = useGrimness()

  if (!GRIMNESS_ENABLED) {
    return null
  }

  const style = useMemo(() => {
    const opacity = 0.12 + weights.fogIntensity * 0.32
    const blur = 14 + weights.fogIntensity * 18
    const scale = 1 + weights.fogIntensity * 0.08

    return {
      '--fog-opacity': opacity.toFixed(3),
      '--fog-blur': `${blur.toFixed(1)}px`,
      '--fog-scale': scale.toFixed(3),
    } as CSSProperties
  }, [weights.fogIntensity])

  return <div className="grimness-fog-layer" style={style} aria-hidden="true" />
}
