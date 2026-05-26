'use client'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import React from 'react'
import { useReducedMotion } from './useReducedMotion'

export function ParallaxImage({
  src, alt, intensity = 0.2, className,
}: {
  src: string; alt: string; intensity?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : `${intensity * 100}%`])

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div style={{ y }} className="relative h-[120%] -top-[10%]">
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      </motion.div>
    </div>
  )
}
