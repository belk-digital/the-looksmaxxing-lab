'use client'
import { motion } from 'framer-motion'
import React from 'react'
import { useReducedMotion } from './useReducedMotion'

export function StaggerChildren({
  children,
  staggerDelay = 0.08,
  initialDelay = 0,
  className,
}: {
  children: React.ReactNode
  staggerDelay?: number
  initialDelay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -100px 0px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduced ? 0 : staggerDelay, delayChildren: reduced ? 0 : initialDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
}
