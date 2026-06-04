'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'
import { Heart, ChevronRight, ChevronLeft, Download, Star, Check } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { useCartStore } from '@/lib/cart/store'
import { toast } from 'sonner'

import { ImageGallery } from '@/components/shop/ImageGallery'
import { VariantSelector, Variant } from '@/components/shop/VariantSelector'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { ProductTabs, Tab } from '@/components/shop/ProductTabs'
import { FaqCarousel, FaqItem } from '@/components/shared/FaqCarousel'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { ProductCard } from '@/components/shop/ProductCard'
import { FadeUp } from '@/components/motion/FadeUp'
import { Space_Grotesk } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

interface ProductData {
  id: string
  name: string
  subtitle: string
  category: string
  categories?: string[]
  averageRating?: number
  reviewCount?: number
  isBundle?: boolean
  bundleItems?: { product: { name: string }; quantity: number }[]
  sku?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  badges?: string[]
  description: string
  shortDescription?: string
  images: string[]
  variants: Variant[]
  coaFile?: string
  tabs: Tab[]
  faqs?: FaqItem[]
  reviews: any[]
  relatedProducts: any[]
}

interface ProductClientProps {
  product: ProductData
}

export function ProductClient({ product }: ProductClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)
  const [descOpen, setDescOpen] = useState(true)
  const [deliveryOpen, setDeliveryOpen] = useState(true)

  // Mobile Sticky Bar Logic
  const [showMobileBar, setShowMobileBar] = useState(false)
  const { scrollY } = useScroll()

  useEffect(() => {
    // Show initially on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const pageHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const isNearBottom = window.scrollY + viewportHeight >= pageHeight - 300
      setShowMobileBar(!isNearBottom)
    }
  }, [])

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      const pageHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      // Hide when near the footer (bottom 300px)
      const isNearBottom = latest + viewportHeight >= pageHeight - 300

      if (!isNearBottom) {
        setShowMobileBar(true)
      } else {
        setShowMobileBar(false)
      }
    }
  })

  const [relatedEmblaRef, relatedEmblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  })



  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0]
  const currentStock = selectedVariant?.inStock ? 50 : 0 // Fake stock level for testing

  const [justAdded, setJustAdded] = useState(false)
  const cartStore = useCartStore()

  const handleAddToCart = () => {
    if (!selectedVariant?.inStock) return

    cartStore.addItem(
      { id: product.id, name: product.name, imageUrl: product.images[0] },
      selectedVariant.title,
      quantity,
      parseFloat(selectedVariant.price.replace('$', ''))
    )

    setJustAdded(true)
    toast.success('Added to cart', { 
      action: { label: 'VIEW', onClick: cartStore.openCart } 
    })
    
    // Auto-open drawer as per standard e-com flows, or just rely on pulse
    cartStore.openCart()

    setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <div className="flex flex-col w-full bg-[#f3f4f6] min-h-screen">
      
      {/* 1. Hero Section */}
      <section className="w-full relative z-10 pt-8 pb-32">
        
        <Container size="wide" className="relative z-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 mt-4 mb-8 relative z-20">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <ChevronRight size={14} />
            <Link href="/shop" className="hover:text-ink transition-colors">Products</Link>
            <ChevronRight size={14} />
            <span className="text-ink">{product.name}</span>
          </nav>

        <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start relative z-10">
          
          {/* Left Column (Massive Cinematic Gallery) */}
          <div className="w-full lg:w-7/12 relative">
            <ImageGallery images={product.images} />
          </div>

          {/* Right Column (Product Info) */}
          <div className="w-full lg:w-5/12 flex flex-col lg:sticky lg:top-8 pt-4">
            
            <div className="flex items-center gap-2 mb-4">
              {product.categories ? (
                product.categories.map(cat => (
                  <span key={cat} className="text-xs uppercase tracking-wider text-gray-500 font-bold">{cat}</span>
                ))
              ) : (
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">{product.category}</span>
              )}
              {product.badges?.map(badge => (
                <Badge key={badge} variant="new" className="bg-ink text-white border-none px-2 py-0.5 shadow-sm text-[10px]">{badge}</Badge>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-ink mb-4 tracking-tight">
              {product.name}
            </h1>
            
            <div className="text-2xl font-semibold text-ink mb-8">
              {selectedVariant?.salePrice ? (
                <>
                  <span className="text-gray-400 line-through mr-3">{selectedVariant.price}</span>
                  <span>{selectedVariant.salePrice}</span>
                </>
              ) : (
                <span>{selectedVariant?.price}</span>
              )}
            </div>

            {/* Description Accordion */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
              <button 
                className="w-full flex justify-between items-center p-6 bg-transparent focus:outline-none"
                onClick={() => setDescOpen(!descOpen)}
              >
                <h3 className="font-bold text-ink text-lg">Description</h3>
                <motion.div animate={{ rotate: descOpen ? -90 : 90 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="text-ink" size={20} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {descOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="px-6"
                  >
                    <p className="text-gray-500 leading-relaxed text-sm pb-6">
                      {product.description || product.shortDescription}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <VariantSelector 
                  variants={product.variants}
                  value={selectedVariantId}
                  onChange={setSelectedVariantId}
                />
              </div>
            )}

            {/* Quantity */}
            <div className="mb-8">
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Button 
                variant="outline" 
                className="w-14 h-14 p-0 flex-shrink-0 rounded-full font-bold text-ink border-2 border-ink hover:bg-ink hover:text-white transition-colors duration-300 flex items-center justify-center group"
                aria-label="Add to Wishlist"
              >
                <Heart size={24} className="group-hover:fill-white transition-colors duration-300" />
              </Button>
              <Button 
                variant="dark" 
                className="flex-1 h-14 rounded-full font-bold text-white bg-[#1a1a1a] hover:bg-black hover:shadow-lg transition-all duration-300 text-base border-none"
                onClick={handleAddToCart}
                disabled={!selectedVariant?.inStock || justAdded}
              >
                {justAdded ? 'Added' : 'Add to Cart'}
              </Button>
            </div>

            {/* Delivery Options */}
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-2xl overflow-hidden mb-8 mt-4">
              <button 
                className="w-full flex justify-between items-center p-6 bg-transparent focus:outline-none"
                onClick={() => setDeliveryOpen(!deliveryOpen)}
              >
                <h3 className="font-bold text-ink text-lg">Delivery Options</h3>
                <motion.div animate={{ rotate: deliveryOpen ? -90 : 90 }} transition={{ duration: 0.2 }}>
                  <ChevronRight className="text-ink" size={20} />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {deliveryOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="px-6 pb-6"
                  >
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 text-gray-600">%</div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Discount</span>
                          <span className="text-sm font-bold text-ink">Disc 15%</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 text-gray-600">💰</div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Payment</span>
                          <span className="text-sm font-bold text-ink">Cash on Delivery Available</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 text-gray-600">🚚</div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Delivery Time</span>
                          <span className="text-sm font-bold text-ink">3-4 Working Days</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 border border-gray-200 text-gray-600">🛡️</div>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Return & Warranty</span>
                          <span className="text-sm font-bold text-ink">7 Days easy return</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trust Badges Mini Row */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.6 }} className="grid grid-cols-3 gap-4 py-8 border-y border-blue-100/50 mb-8">
              <div className="flex flex-col items-center text-center gap-2 group cursor-default">
                <div className="w-8 h-8 rounded-full border border-[#5984c4]/30 flex items-center justify-center text-[#5984c4] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white bg-white shadow-sm">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink transition-colors duration-300 group-hover:text-[#5984c4]">≥99% Purity</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 group cursor-default">
                <div className="w-8 h-8 rounded-full border border-[#5984c4]/30 flex items-center justify-center text-[#5984c4] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white bg-white shadow-sm">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink transition-colors duration-300 group-hover:text-[#5984c4]">LC-MS Verified</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2 group cursor-default">
                <div className="w-8 h-8 rounded-full border border-[#5984c4]/30 flex items-center justify-center text-[#5984c4] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#5984c4] group-hover:text-white bg-white shadow-sm">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink transition-colors duration-300 group-hover:text-[#5984c4]">US Based</span>
              </div>
            </motion.div>

            {/* Product Specifications */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.7 }} className="flex gap-6 mb-8 text-body-sm text-ink-muted">
              {product.sku && (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm uppercase tracking-wider text-ink">SKU</span>
                  <span>{product.sku}</span>
                </div>
              )}
              {product.weight && (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm uppercase tracking-wider text-ink">Weight</span>
                  <span>{product.weight} kg</span>
                </div>
              )}
              {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height && (
                <div className="flex flex-col gap-1">
                  <span className="text-label-sm uppercase tracking-wider text-ink">Dimensions</span>
                  <span>{product.dimensions.length} x {product.dimensions.width} x {product.dimensions.height} cm</span>
                </div>
              )}
            </motion.div>

            {product.coaFile && (
              <motion.a 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.8 }}
                href={product.coaFile} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-blue-100 rounded-xl group hover:border-[#5984c4] hover:bg-[#f2f6fc] transition-all shadow-sm bg-white"
              >
                <div className="flex flex-col">
                  <span className="text-label-md uppercase tracking-wider text-[#5984c4]">Certificate of Analysis</span>
                  <span className="text-body-sm text-ink-muted">Verified third-party testing results</span>
                </div>
                <Download size={20} className="text-[#5984c4]/60 group-hover:text-[#5984c4] transition-colors" />
              </motion.a>
            )}

          </div>
        </div>
        
        {/* Merged Tabs Section */}
        <div className="mt-32 w-full">
          <ProductTabs tabs={product.tabs} />
        </div>

        </Container>
      </section>

      {/* 5. Related Editorial Carousel */}
      <section className="w-full py-32 bg-[#f8fafc] border-t border-blue-100/50 overflow-hidden relative">
        <Container size="wide" className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <span className="text-[#5984c4] text-label-sm uppercase tracking-[0.2em] font-bold mb-4 block">Continue Exploring</span>
              <h2 className={`text-[44px] sm:text-[56px] lg:text-[64px] leading-none font-bold tracking-tighter text-ink ${spaceGrotesk.className}`}>
                Also Considered.
              </h2>
            </div>
            
            {/* Carousel Navigation */}
            <div className="flex gap-3">
              <button 
                onClick={() => relatedEmblaApi?.scrollPrev()}
                className="w-12 h-12 rounded-full border border-blue-200 flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-all shadow-sm bg-white"
                aria-label="Previous Products"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => relatedEmblaApi?.scrollNext()}
                className="w-12 h-12 rounded-full border border-blue-200 flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-all shadow-sm bg-white"
                aria-label="Next Products"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="overflow-hidden" ref={relatedEmblaRef}>
              <div className="flex gap-6 lg:gap-8 pb-12 cursor-grab active:cursor-grabbing">
                {product.relatedProducts.map((p) => (
                  <div key={p.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_28%] min-w-0">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2.5 FAQs Section (Moved to Bottom) */}
      {product.faqs && product.faqs.length > 0 && (
        <FaqCarousel 
          faqs={product.faqs} 
          theme="light" 
          title="Product" 
          accentTitle="FAQs"
          description="Find answers to common questions regarding storage, reconstitution, and testing guidelines for this specific compound."
        />
      )}

      {/* Mobile Fixed Action Bar */}
      <AnimatePresence>
        {showMobileBar && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-200 flex items-center gap-3 lg:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pb-safe"
          >
            <Button 
              variant="outline" 
              className="w-14 h-14 p-0 flex-shrink-0 rounded-full font-bold text-ink border-2 border-gray-200 bg-white hover:bg-ink hover:text-white transition-colors duration-300 flex items-center justify-center group"
              aria-label="Add to Wishlist"
            >
              <Heart size={24} className="group-hover:fill-white transition-colors duration-300" />
            </Button>
            <Button 
              variant="dark" 
              className="flex-1 h-14 rounded-full font-bold text-white bg-[#1a1a1a] hover:bg-black transition-all duration-300 text-base border-none relative overflow-hidden group"
              onClick={handleAddToCart}
              disabled={!selectedVariant?.inStock || justAdded}
            >
              <AnimatePresence mode="wait">
                {justAdded ? (
                  <motion.span key="check" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0 flex items-center justify-center text-white">
                    <Check size={20} strokeWidth={2} />
                  </motion.span>
                ) : (
                  <motion.span key="text" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute inset-0 flex items-center justify-center">
                    {selectedVariant?.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
