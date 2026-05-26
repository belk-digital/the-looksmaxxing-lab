'use client'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useRef } from 'react'
import React from 'react'
import { useReducedMotion } from './useReducedMotion'

export function MagneticHover({
  children, strength = 0.3, className,
}: {
  children: React.ReactNode; strength?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 20 })
  const sy = useSpring(y, { stiffness: 200, damping: 20 })

  const onMove = (e: React.MouseEvent) => {
    if (!ref.current || reduced) return
    const rect = ref.current.getBoundingClientRect()
    x.set((e.clientX - rect.left - rect.width / 2) * strength)
    y.set((e.clientY - rect.top - rect.height / 2) * strength)
  }
  const onLeave = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x: reduced ? 0 : sx, y: reduced ? 0 : sy }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
