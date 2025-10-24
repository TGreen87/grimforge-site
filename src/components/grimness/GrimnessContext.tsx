'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export const GRIM_LEVELS = [
  'Coffin-Casual',
  'Corpse Paint Optional',
  'Full Ritual',
  'Goat-Approved',
  'Existential Collapse',
] as const

type ExtractLevel<T extends readonly string[]> = T extends readonly (infer U)[] ? U : never

export type GrimnessLevel = ExtractLevel<typeof GRIM_LEVELS>

export interface GrimnessWeights {
  fogIntensity: number
  vignette: number
  audioGain: number
  colorShift: number
}

interface GrimnessContextValue {
  level: GrimnessLevel
  levelIndex: number
  weights: GrimnessWeights
  setLevel: (next: GrimnessLevel) => void
  setLevelIndex: (nextIndex: number) => void
}

const STORAGE_KEY = 'orr:grimness'
const DEFAULT_INDEX = 0

const GrimnessContext = createContext<GrimnessContextValue | undefined>(undefined)

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function calculateGrimnessWeights(levelIndex: number): GrimnessWeights {
  const maxIndex = GRIM_LEVELS.length - 1
  const ratio = maxIndex === 0 ? 0 : clamp01(levelIndex / maxIndex)

  return {
    fogIntensity: clamp01(ratio),
    vignette: clamp01(0.2 + ratio * 0.7),
    audioGain: clamp01(0.1 + ratio * 0.8),
    colorShift: clamp01(0.15 + ratio * 0.75),
  }
}

function getLevelIndex(level: string | null): number {
  if (!level) return DEFAULT_INDEX
  const normalised = level.trim()
  const resolvedIndex = GRIM_LEVELS.findIndex((entry) => entry === normalised)
  return resolvedIndex >= 0 ? resolvedIndex : DEFAULT_INDEX
}

export function GrimnessProvider({ children }: { children: ReactNode }) {
  const [levelIndex, setLevelIndexState] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_INDEX
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return getLevelIndex(stored)
    } catch (error) {
      console.warn('GrimnessProvider: unable to read from localStorage', error)
      return DEFAULT_INDEX
    }
  })

  const hasMounted = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!hasMounted.current) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        const storedIndex = getLevelIndex(stored)
        if (storedIndex !== levelIndex) {
          setLevelIndexState(storedIndex)
        }
      } catch (error) {
        console.warn('GrimnessProvider: unable to hydrate from localStorage', error)
      } finally {
        hasMounted.current = true
      }
    }
  }, [levelIndex])

  useEffect(() => {
    if (typeof window === 'undefined' || !hasMounted.current) return
    try {
      window.localStorage.setItem(STORAGE_KEY, GRIM_LEVELS[levelIndex])
    } catch (error) {
      console.warn('GrimnessProvider: unable to persist to localStorage', error)
    }
  }, [levelIndex])

  const setLevelIndex = useCallback((nextIndex: number) => {
    setLevelIndexState((current) => {
      const maxIndex = GRIM_LEVELS.length - 1
      const clamped = Math.min(Math.max(Math.round(nextIndex), 0), maxIndex)
      return clamped === current ? current : clamped
    })
  }, [])

  const setLevel = useCallback((nextLevel: GrimnessLevel) => {
    const nextIndex = GRIM_LEVELS.indexOf(nextLevel)
    if (nextIndex === -1) return
    setLevelIndex(nextIndex)
  }, [setLevelIndex])

  const weights = useMemo(() => calculateGrimnessWeights(levelIndex), [levelIndex])
  const level = useMemo(() => GRIM_LEVELS[levelIndex] ?? GRIM_LEVELS[DEFAULT_INDEX], [levelIndex])

  const value = useMemo<GrimnessContextValue>(() => ({
    level,
    levelIndex,
    weights,
    setLevel,
    setLevelIndex,
  }), [level, levelIndex, weights, setLevel, setLevelIndex])

  return (
    <GrimnessContext.Provider value={value}>
      {children}
    </GrimnessContext.Provider>
  )
}

export function useGrimness(): GrimnessContextValue {
  const context = useContext(GrimnessContext)
  if (!context) {
    throw new Error('useGrimness must be used within a GrimnessProvider')
  }
  return context
}
