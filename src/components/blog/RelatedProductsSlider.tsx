'use client'

import React, { useEffect, useState } from 'react'
import { PrimaryProductCard, type Product } from '@/components/shop/PrimaryProductCard'

export function RelatedProductsSlider({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0)
  const multiple = products && products.length > 1

  useEffect(() => {
    if (!multiple) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % products.length)
    }, 3000)
    return () => clearInterval(id)
  }, [multiple, products?.length])

  if (!products || products.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-border-subtle shadow-sm p-6 md:p-8 mb-8">
      <div className="flex items-center gap-2.5 mb-6">
        <span className="h-px w-6 bg-gold" />
        <span className="text-label-md uppercase tracking-wider text-gold-dark font-semibold">Related Research Peptides</span>
      </div>

      {/* Desktop / tablet: static grid */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {products.map((product) => (
          <PrimaryProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Mobile: single card, or auto-swiping carousel with dots when there's more than one */}
      <div className="sm:hidden">
        {!multiple ? (
          <PrimaryProductCard product={products[0]} />
        ) : (
          <>
            <div className="overflow-hidden -mx-1">
              <div
                className="flex transition-transform duration-500 ease-out-quart"
                style={{ transform: `translateX(-${index * 100}%)` }}
              >
                {products.map((product) => (
                  <div key={product.id} className="w-full shrink-0 px-1">
                    <PrimaryProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-5">
              {products.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to product ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-gold' : 'w-1.5 bg-ink/15'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
