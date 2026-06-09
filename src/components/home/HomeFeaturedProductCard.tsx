import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

export interface Product {
  name: string
  slug: string
  image: string
  shortDescription: string
  priceRange: string
  category: string
}

export interface HomeFeaturedProductCardProps {
  product: Product
  id?: string
  index?: number
}

export function HomeFeaturedProductCard({ product, id, index = 0 }: HomeFeaturedProductCardProps) {
  return (
    <div 
      className="group relative flex flex-col items-center w-full bg-transparent cursor-pointer"
    >
      {/* Absolute Link overlay so entire card is clickable */}
      <Link href={`/products/${product.slug}`} className="absolute inset-0 z-0">
        <span className="sr-only">View {product.name}</span>
      </Link>

      {/* Image Area with overlapping vial */}
      <div id={id} className="relative w-full max-w-[220px] aspect-[3/4] flex items-center justify-center mb-8 mx-auto py-4 z-10 pointer-events-none">
        
        {/* Beige Circle Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full bg-cream transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105" />

        {/* Product Image (Drops in naturally) */}
        <motion.div 
          initial={{ y: -80, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, margin: "0px 0px -100px 0px" }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15, 
            delay: index * 0.1 + 0.2 // Stagger based on index
          }}
          className="w-[75%] h-[95%] z-10"
        >
          {/* Hover Wrapper */}
          <div className="relative w-full h-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110">
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain mix-blend-multiply drop-shadow-sm"
            />
          </div>
        </motion.div>
      </div>

      {/* Info Area - Centered below image */}
      <div className="flex flex-col items-center text-center w-full z-20 px-2 pointer-events-none">
        
        {/* Product Name */}
        <h3 className="text-[14px] sm:text-[16px] font-bold text-black mb-1 leading-tight tracking-tight">
          {product.name}
        </h3>
        
        {/* Category / Dose */}
        <span className="text-[9px] sm:text-[10px] font-bold tracking-[0.15em] uppercase text-slate-500 mb-3">
          {product.category}
        </span>
        
        {/* Price */}
        <span className="text-[12px] sm:text-[14px] font-bold text-black mb-6">
          {product.priceRange}
        </span>
        
        {/* Add to Cart Button */}
        <button className="pointer-events-auto px-6 py-2.5 sm:px-8 sm:py-3 rounded-none bg-white border border-slate-300 text-black hover:bg-black hover:text-white hover:border-black transition-all duration-300 font-bold tracking-[0.15em] uppercase text-[9px] sm:text-[10px] w-full max-w-[180px]">
          ADD TO CART
        </button>
      </div>
    </div>
  )
}
