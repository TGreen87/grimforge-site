'use client'

import { GrimnessSlider } from '@/components/grimness/GrimnessSlider'

const GRIMNESS_ENABLED = process.env.NEXT_PUBLIC_GRIMNESS_ENABLED === '1'

export default function GrimnessControlPanel() {
  if (!GRIMNESS_ENABLED) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 hidden justify-center md:flex">
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/70 bg-background/90 px-4 py-3 shadow-xl backdrop-blur-xl"
        role="region"
        aria-label="Grimness level control"
      >
        <GrimnessSlider />
      </div>
    </div>
  )
}
