'use client'
import { motion } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'
import React from 'react'

export function FadeUp({
  children,
  delay = 0,
  duration = 0.6,
  distance = 24,
  once = true,
  className,
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  distance?: number
  once?: boolean
  className?: string
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>

  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '0px 0px -100px 0px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
