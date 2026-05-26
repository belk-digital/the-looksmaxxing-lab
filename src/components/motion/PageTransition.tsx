'use client'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useReducedMotion } from './useReducedMotion'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: reduced ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
