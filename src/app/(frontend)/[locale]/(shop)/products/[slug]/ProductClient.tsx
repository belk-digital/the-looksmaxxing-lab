'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, ChevronRight, Download, Star, Check } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StockIndicator } from '@/components/ui/stock-indicator'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'

import { ImageGallery } from '@/components/shop/ImageGallery'
import { VariantSelector, Variant } from '@/components/shop/VariantSelector'
import { QuantityStepper } from '@/components/shop/QuantityStepper'
import { ProductTabs, Tab } from '@/components/shop/ProductTabs'
import { ProductReviews, Review } from '@/components/shop/ProductReviews'
import { TrustBadges } from '@/components/shared/TrustBadges'
import { StaggerChildren, staggerItemVariants } from '@/components/motion/StaggerChildren'
import { ProductCard } from '@/components/shop/ProductCard'
import { FadeUp } from '@/components/motion/FadeUp'

interface ProductData {
  id: string
  name: string
  subtitle: string
  category: string
  badges?: string[]
  shortDescription: string
  images: string[]
  variants: Variant[]
  coaFile?: string
  tabs: Tab[]
  reviews: Review[]
  relatedProducts: any[]
}

interface ProductClientProps {
  product: ProductData
}

export function ProductClient({ product }: ProductClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants[0]?.id || '')
  const [quantity, setQuantity] = useState(1)

  const selectedVariant = product.variants.find(v => v.id === selectedVariantId) || product.variants[0]
  const currentStock = selectedVariant?.inStock ? 50 : 0 // Fake stock level for testing

  const [justAdded, setJustAdded] = useState(false)
  const cartStore = useCartStore()

  const handleAddToCart = () => {
    if (!selectedVariant?.inStock) return

    cartStore.addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      name: product.name,
      variantName: selectedVariant.name,
      price: parseFloat(selectedVariant.price.replace('$', '')),
      quantity: quantity,
      image: product.images[0]
    })

    setJustAdded(true)
    toast.success('Added to cart', { 
      action: { label: 'VIEW', onClick: cartStore.openCart } 
    })
    
    // Auto-open drawer as per standard e-com flows, or just rely on pulse
    cartStore.openCart()

    setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <div className="flex flex-col w-full pb-32">
      
      {/* 1. Hero Split Layout */}
      <Container size="page" className="pt-8 pb-32">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-label-md uppercase tracking-wider text-ink-muted mb-12">
          <Link href="/" className="hover:text-gold-dark transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link href="/shop" className="hover:text-gold-dark transition-colors">Shop</Link>
          <ChevronRight size={14} />
          <span className="text-ink">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-16 xl:gap-24 items-start">
          
          {/* Left Column (Sticky Gallery) */}
          <div className="w-full lg:w-1/2 lg:sticky lg:top-32">
            <ImageGallery images={product.images} />
          </div>

          {/* Right Column (Product Info) */}
          <div className="w-full lg:w-1/2 flex flex-col pt-4">
            
            <div className="flex items-center gap-3 mb-6">
              <span className="text-label-md uppercase tracking-wider text-gold">{product.category}</span>
              {product.badges?.map(badge => (
                <Badge key={badge} variant="new" className="bg-ink text-cream border border-ink px-2 py-1">{badge}</Badge>
              ))}
            </div>

            <h1 className="text-display-md font-display text-ink mb-2">{product.name}</h1>
            <p className="text-label-lg uppercase tracking-wider text-ink-muted mb-6">{product.subtitle}</p>

            <button 
              onClick={() => {
                document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity"
            >
              <div className="flex text-gold">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" strokeWidth={1.5} />)}
              </div>
              <span className="text-body-sm text-ink-muted underline underline-offset-4 decoration-border-subtle hover:decoration-ink">
                {product.reviews.length} Reviews
              </span>
            </button>

            <div className="text-display-xs text-ink mb-8">
              {selectedVariant?.price}
            </div>

            <p className="text-body-lg text-ink-muted max-w-md mb-12">
              {product.shortDescription}
            </p>

            <div className="flex flex-col gap-8 mb-12">
              <VariantSelector 
                variants={product.variants}
                value={selectedVariantId}
                onChange={setSelectedVariantId}
              />
              
              <div className="flex flex-col gap-3">
                <span className="text-label-md uppercase tracking-wider text-ink-muted">Quantity</span>
                <div className="flex items-center justify-between">
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <StockIndicator stock={currentStock} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-16">
              <Button 
                variant="dark" 
                size="lg" 
                className="w-full h-14 text-label-lg relative overflow-hidden"
                onClick={handleAddToCart}
                disabled={!selectedVariant?.inStock || justAdded}
              >
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.span 
                      key="check" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute inset-0 flex items-center justify-center text-gold"
                    >
                      <Check size={20} strokeWidth={2} />
                    </motion.span>
                  ) : (
                    <motion.span 
                      key="text" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {selectedVariant?.inStock ? 'ADD TO CART' : 'OUT OF STOCK'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              <Button variant="link" className="w-full flex items-center justify-center gap-2 text-ink-muted hover:text-ink">
                <Heart size={16} />
                <span>Save for later</span>
              </Button>
            </div>

            {/* Trust Badges Mini Row */}
            <div className="grid grid-cols-3 gap-4 py-8 border-y border-border-subtle mb-8">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center text-gold">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink">≥99% Purity</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center text-gold">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink">LC-MS Verified</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center text-gold">✓</div>
                <span className="text-label-sm uppercase tracking-wider text-ink">US Based</span>
              </div>
            </div>

            {product.coaFile && (
              <a 
                href={product.coaFile} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 border border-border-default rounded-sm group hover:border-ink transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-label-md uppercase tracking-wider text-ink">Certificate of Analysis</span>
                  <span className="text-body-sm text-ink-muted">Verified third-party testing results</span>
                </div>
                <Download size={20} className="text-ink-muted group-hover:text-ink transition-colors" />
              </a>
            )}

          </div>
        </div>
      </Container>

      {/* 2. Tabs Section */}
      <Container size="page" className="py-16">
        <ProductTabs tabs={product.tabs} />
      </Container>

      {/* 3. Editorial Science Section */}
      <section className="w-full py-32 relative flex items-center justify-center bg-ink">
        <div className="absolute inset-0 z-0">
          <Image src="/temp-products/product-image.png" alt="Science Background" fill className="object-cover opacity-20 mix-blend-overlay" />
        </div>
        <div className="relative z-10 w-full max-w-content bg-cream/5 backdrop-blur-lg p-16 rounded-md text-center border border-border-subtle/20">
          <FadeUp><span className="text-label-md uppercase tracking-wider text-gold mb-4 block">THE SCIENCE</span></FadeUp>
          <FadeUp delay={0.1}><h2 className="text-display-md font-display text-cream mb-6">Regenerative Potential.</h2></FadeUp>
          <FadeUp delay={0.2}><p className="text-body-lg text-cream/70 mb-8 max-w-xl mx-auto">
            Our TB-500 is synthesized to exact standards, matching the natural peptide sequence found in human tissue to support optimal recovery and cellular regeneration.
          </p></FadeUp>
          <FadeUp delay={0.3}><Button variant="secondary" className="border-cream text-cream hover:bg-cream hover:text-ink">Read The Protocol →</Button></FadeUp>
        </div>
      </section>

      {/* 4. Reviews Section */}
      <div id="reviews-section" className="bg-cream-warm">
        <Container size="page" className="py-32 border-b border-border-subtle">
          <ProductReviews reviews={product.reviews} />
        </Container>
      </div>

      {/* 5. Related Products */}
      <Container size="page" className="py-32">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-label-lg uppercase tracking-wider text-ink">Also Considered</h2>
        </div>
        <StaggerChildren staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {product.relatedProducts.map((p, i) => (
            <motion.div variants={staggerItemVariants} key={p.id}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </StaggerChildren>
      </Container>
    </div>
  )
}
