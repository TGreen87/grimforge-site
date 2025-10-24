'use client'

import { GrimnessSlider } from '@/components/grimness/GrimnessSlider'

export default function GrimnessControlPanel() {
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
