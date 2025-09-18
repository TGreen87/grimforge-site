import type { Transition } from 'framer-motion'

export type MotionPreset = Transition & {
  type?: 'spring' | 'tween' | 'keyframes'
}

export const fadeInUp: MotionPreset = {
  type: 'spring',
  damping: 24,
  stiffness: 220,
  mass: 0.9,
  bounce: 0.15,
  duration: 0.45,
}

export const fadeIn: MotionPreset = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.35,
}

export const scaleIn: MotionPreset = {
  type: 'spring',
  damping: 20,
  stiffness: 240,
  mass: 0.8,
}

export const motionDurations = {
  quick: 0.2,
  base: 0.35,
  leisurely: 0.6,
} as const

export const motionEasings = {
  brand: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
  entrance: [0.12, 0.9, 0.38, 1],
  exit: [0.37, 0, 0.63, 1],
}

export const reducedMotionTransition: Transition = {
  duration: 0,
}

export const prefersReducedMotionQuery = '(prefers-reduced-motion: reduce)'

export function getTransition(preset: MotionPreset, reducedMotion = false): Transition {
  if (reducedMotion) {
    return reducedMotionTransition
  }
  return {
    ...preset,
  }
}
