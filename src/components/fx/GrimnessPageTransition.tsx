'use client'

import type { ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

import { useGrimness } from '@/components/grimness/GrimnessContext'

interface GrimnessPageTransitionProps {
  children: ReactNode
}

const BASE_DURATION = 0.35
const STEP_DURATION = 0.05
const MAX_DURATION = 0.45

export default function GrimnessPageTransition({ children }: GrimnessPageTransitionProps) {
  const pathname = usePathname() ?? ''
  const { levelIndex } = useGrimness()
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <>{children}</>
  }

  const duration = Math.min(MAX_DURATION, BASE_DURATION + Math.max(0, levelIndex) * STEP_DURATION)
  const exitBlur = levelIndex >= 3 ? 6 : 2

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          data-testid="grimness-transition-wrapper"
          initial={{ opacity: 0, filter: 'blur(2px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: `blur(${exitBlur}px)` }}
          transition={{ duration, ease: 'easeOut' }}
          style={{ minHeight: '100%' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
