'use client'

import * as React from 'react'
import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion'

import { getTransition, fadeIn } from '@/lib/motion'

export interface MotionBoxProps extends HTMLMotionProps<'div'> {
  transitionPreset?: Parameters<typeof getTransition>[0]
}

const MotionBox = React.forwardRef<HTMLDivElement, MotionBoxProps>(
  ({ children, transitionPreset = fadeIn, transition, ...props }, ref) => {
    const reduceMotion = useReducedMotion() ?? false

    return (
      <motion.div
        ref={ref}
        transition={transition ?? getTransition(transitionPreset, Boolean(reduceMotion))}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)
MotionBox.displayName = 'MotionBox'

export { MotionBox }
