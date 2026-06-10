'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Debounced search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [query])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col bg-cream/95 backdrop-blur-md"
        >
          {/* Header Bar */}
          <div className="w-full flex justify-between items-center px-6 py-6 border-b border-ink/10 max-w-5xl mx-auto">
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-ink/5 text-ink hover:bg-ink hover:text-cream transition-colors duration-300"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search Input Area */}
          <div className="w-full max-w-3xl mx-auto px-6 mt-12 mb-8">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-ink/40 w-8 h-8" />
              <input
                ref={inputRef}
                type="text"
                placeholder="What are you looking for?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-24 pl-20 pr-8 bg-white border border-ink/10 rounded-full text-3xl font-display font-medium text-ink placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent shadow-sm transition-all"
              />
              {isLoading && (
                <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 text-ink/40 w-6 h-6 animate-spin" />
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-20">
            <div className="w-full max-w-3xl mx-auto">
              {query && !isLoading && results.length === 0 && (
                <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-2xl font-display text-ink/50 mb-2">No results found</p>
                  <p className="text-ink/40">Try checking your spelling or using different keywords.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <p className="text-sm font-bold text-ink/50 uppercase tracking-wider mb-2">
                    Products ({results.length})
                  </p>
                  {results.map((product) => (
                    <Link
                      key={product.id}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="group flex items-center p-4 bg-white rounded-3xl border border-ink/5 hover:border-ink hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative w-20 h-20 bg-cream rounded-2xl overflow-hidden shrink-0">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-ink/5" />
                        )}
                      </div>
                      
                      <div className="ml-6 flex-1 flex flex-col justify-center">
                        <h3 className="text-xl font-display font-bold text-ink group-hover:text-ink/80 transition-colors">
                          {product.name}
                        </h3>
                        {product.descriptor && (
                          <p className="text-sm text-ink/60 mt-1 line-clamp-1">
                            {product.descriptor}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 mr-2">
                        <p className="text-lg font-bold text-ink">${product.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
