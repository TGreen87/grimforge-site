'use client'

import * as SliderPrimitive from '@radix-ui/react-slider'
import { useId } from 'react'

import { cn } from '@/lib/utils'
import { GRIM_LEVELS, useGrimness } from '@/components/grimness/GrimnessContext'

interface GrimnessSliderProps {
  className?: string
}

export function GrimnessSlider({ className }: GrimnessSliderProps) {
  const { levelIndex, setLevelIndex, level } = useGrimness()
  const sliderId = useId()
  const labelId = `${sliderId}-label`
  const maxIndex = GRIM_LEVELS.length - 1

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-400">
        <span id={labelId}>Grimness</span>
        <span className="font-semibold text-neutral-100">{level}</span>
      </div>

      <SliderPrimitive.Root
        aria-labelledby={labelId}
        aria-valuetext={level}
        className="relative flex w-full touch-none select-none items-center"
        value={[levelIndex]}
        min={0}
        max={maxIndex}
        step={1}
        onValueChange={(values) => {
          const [nextIndex] = values
          if (typeof nextIndex === 'number') {
            setLevelIndex(nextIndex)
          }
        }}
      >
        <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-neutral-800">
          <SliderPrimitive.Range className="absolute h-full bg-violet-500 transition-all" />
          {GRIM_LEVELS.map((label, idx) => {
            if (maxIndex === 0) return null
            return (
              <span
                key={label}
                aria-hidden="true"
                className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-neutral-600"
                style={{ left: `${(idx / maxIndex) * 100}%` }}
              />
            )
          })}
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          aria-label={`Grimness level: ${level}`}
          className="block h-5 w-5 -translate-y-1/2 rounded-full border-2 border-violet-400 bg-neutral-950 shadow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
        />
      </SliderPrimitive.Root>

      <div className="flex justify-between text-[0.7rem] text-neutral-400" aria-hidden="true">
        {GRIM_LEVELS.map((label, idx) => (
          <span
            key={label}
            className={cn('max-w-[5.5rem] text-center leading-tight', idx === levelIndex ? 'text-neutral-100 font-medium' : undefined)}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
