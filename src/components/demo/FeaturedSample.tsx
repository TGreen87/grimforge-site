'use client'

import Image from 'next/image'

import ThreeDTilt from '@/components/fx/ThreeDTilt'
import { cn } from '@/lib/utils'

const sampleImage = '/assets/album-1.jpg'

interface FeaturedSampleProps {
  className?: string
}

export default function FeaturedSample({ className }: FeaturedSampleProps) {
  return (
    <ThreeDTilt
      className={cn(
        'group relative flex items-center gap-6 overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-6 shadow-2xl backdrop-blur-xl transition-shadow hover:shadow-[0_24px_60px_rgba(123,98,255,0.25)]',
        className,
      )}
    >
      <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-2xl border border-border/60">
        <Image
          src={sampleImage}
          alt="Limited edition pressing of Obsidian Rite release"
          fill
          priority
          className="object-cover"
          data-void-key="album-1"
          data-void-src="/art/ant/album-1-void.jpg"
        />
      </div>
      <div className="space-y-2 text-left">
        <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Featured Vinyl
        </p>
        <h3 className="text-2xl font-semibold text-bone">
          Ritual of the Frozen Gate
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          180g midnight marble pressing with lyric book and silk-screened outer sleeve. Grimness responds to your dial.
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 px-3 py-1">
            <span className="font-semibold text-accent">666</span>
            <span>void ready</span>
          </span>
          <span>Rotate the wheel to awaken the veil.</span>
        </div>
      </div>
    </ThreeDTilt>
  )
}
