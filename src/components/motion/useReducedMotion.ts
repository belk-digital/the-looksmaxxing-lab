'use client'
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

export function useReducedMotion() {
  return useFramerReducedMotion() ?? false
}

export function withReducedMotion<T extends Record<string, any>>(
  full: T,
  reduced: boolean,
): T {
  if (!reduced) return full
  return {
    ...full,
    initial: full.animate ?? full.initial,
    transition: { duration: 0 },
  }
}
