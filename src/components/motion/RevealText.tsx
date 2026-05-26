'use client'
import { motion } from 'framer-motion'
import React from 'react'
import { useReducedMotion } from './useReducedMotion'

export function RevealText({
  lines,
  baseDelay = 0,
  className,
}: {
  lines: string[]
  baseDelay?: number
  className?: string
}) {
  const reduced = useReducedMotion()

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            initial={reduced ? { y: 0, opacity: 1 } : { y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              duration: reduced ? 0 : 1.0,
              delay: reduced ? 0 : baseDelay + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  )
}
