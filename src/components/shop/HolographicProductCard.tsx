'use client'

import React, { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Heart, Activity, Thermometer, TestTube } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { StandardProduct } from './CompactProductCard'

export function HolographicProductCard({ product }: { product: StandardProduct }) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // 3D Tilt Effect
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 })
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"])
  
  // Glow Follow
  const glowX = useSpring(useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 300, damping: 30 })
  const glowY = useSpring(useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 300, damping: 30 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5
    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      whileHover="hover"
      initial="rest"
      className="group relative flex flex-col w-full h-full cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-md"
    >
      {/* Interactive Golden Glow */}
      <motion.div 
        className="absolute w-[200px] h-[200px] bg-gold/30 rounded-full blur-[70px] pointer-events-none z-0"
        style={{ left: glowX, top: glowY, x: '-50%', y: '-50%' }}
        variants={{ rest: { opacity: 0 }, hover: { opacity: 1 } }}
      />

      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1 relative z-10">
        
        {/* Image Area */}
        <div className="relative w-full aspect-[4/5] overflow-hidden flex items-center justify-center p-8">
          <motion.div
            variants={{
              rest: { scale: 1, y: 0 },
              hover: { scale: 0.9, y: -15 },
            }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full relative"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain drop-shadow-2xl"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </motion.div>

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-4 left-4 z-20">
              <Badge variant={product.badge} className="px-3 py-1 bg-white/10 backdrop-blur-md text-white border-white/20">
                {product.badge === 'bestseller' ? 'Best Seller' : product.badge}
              </Badge>
            </div>
          )}

          {/* Wishlist Heart */}
          <motion.div
            variants={{
              rest: { opacity: 0, x: 10 },
              hover: { opacity: 1, x: 0 },
            }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 z-20"
          >
            <button 
              onClick={(e) => {
                e.preventDefault()
              }}
              className="p-2 text-white/60 hover:text-gold transition-colors bg-ink/50 backdrop-blur-sm rounded-full"
            >
              <Heart size={20} strokeWidth={1.5} />
            </button>
          </motion.div>

          {/* Specs HUD (Slides up on hover) */}
          <motion.div 
            variants={{
              rest: { opacity: 0, y: 20 },
              hover: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="absolute bottom-4 inset-x-4 bg-ink/80 backdrop-blur-md border border-white/10 rounded-xl p-3 flex justify-around items-center z-20"
          >
             <div className="flex flex-col items-center gap-1">
                <TestTube size={14} className="text-gold" />
                <span className="text-[10px] text-white/60 uppercase tracking-widest">&ge;99%</span>
             </div>
             <div className="w-[1px] h-6 bg-white/10" />
             <div className="flex flex-col items-center gap-1">
                <Thermometer size={14} className="text-gold" />
                <span className="text-[10px] text-white/60 uppercase tracking-widest">2-8&deg;C</span>
             </div>
             <div className="w-[1px] h-6 bg-white/10" />
             <div className="flex flex-col items-center gap-1">
                <Activity size={14} className="text-gold" />
                <span className="text-[10px] text-white/60 uppercase tracking-widest">Active</span>
             </div>
          </motion.div>
        </div>

        {/* Info Area */}
        <div className="flex flex-col flex-1 p-6 border-t border-white/10 bg-white/5">
          <h3 className="text-editorial-md font-display text-white mb-2 transition-colors duration-300 group-hover:text-gold">
            {product.name}
          </h3>
          <span className="text-label-md uppercase tracking-wider text-white/50 mb-4 line-clamp-1">
            {product.descriptor}
          </span>
          <div className="mt-auto flex justify-between items-end">
            <span className="text-body-lg font-medium text-white">
              {product.price}
            </span>
            <span className="text-label-sm text-gold opacity-0 group-hover:opacity-100 transition-opacity duration-300 uppercase tracking-widest">
              Explore &rarr;
            </span>
          </div>
        </div>
        
      </Link>
    </motion.div>
  )
}
