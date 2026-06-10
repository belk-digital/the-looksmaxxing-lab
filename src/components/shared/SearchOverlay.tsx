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
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex flex-col bg-white/95 backdrop-blur-2xl"
        >
          {/* Header Bar */}
          <div className="w-full flex justify-between items-center px-6 h-[72px] border-b border-black/5">
            <div className="flex-1" />
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink flex-1 text-center">
              Search
            </span>
            <div className="flex flex-1 justify-end">
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-ink hover:bg-black/5 transition-colors rounded-full"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Search Input Area */}
          <div className="w-full max-w-4xl mx-auto px-6 mt-12 mb-12">
            <div className="relative flex items-center border-b border-black/20 focus-within:border-black transition-colors pb-4">
              <Search className="text-black/40 w-6 h-6 mr-4" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search formulations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent text-2xl sm:text-4xl font-light text-black placeholder:text-black/20 focus:outline-none transition-all"
              />
              {isLoading && (
                <Loader2 className="text-black/40 w-5 h-5 animate-spin ml-4" strokeWidth={1.5} />
              )}
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="w-full max-w-4xl mx-auto">
              {query && !isLoading && results.length === 0 && (
                <div className="text-center py-20 animate-in fade-in duration-500">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 mb-2">0 Results Found</p>
                  <p className="text-sm text-black/40">Try adjusting your search terms.</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="flex flex-col animate-in fade-in duration-500">
                  <div className="flex items-center justify-between border-b border-black/10 pb-4 mb-4">
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-[0.2em]">
                      Products
                    </p>
                    <p className="text-[10px] font-bold text-black/50 uppercase tracking-[0.2em]">
                      {results.length} {results.length === 1 ? 'Result' : 'Results'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {results.map((product) => (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="group flex items-center p-4 hover:bg-black/5 rounded-2xl transition-colors duration-300 -mx-4"
                      >
                        <div className="relative w-16 h-16 bg-[#F5F5F5] rounded-xl overflow-hidden shrink-0 mix-blend-multiply">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full bg-black/5" />
                          )}
                        </div>
                        
                        <div className="ml-5 flex-1 flex flex-col justify-center">
                          <h3 className="text-sm font-bold text-black uppercase tracking-[0.1em] group-hover:text-black/70 transition-colors">
                            {product.name}
                          </h3>
                          {product.descriptor && (
                            <p className="text-[11px] text-black/50 mt-1 line-clamp-1 pr-4">
                              {product.descriptor}
                            </p>
                          )}
                        </div>

                        <div className="ml-4">
                          <p className="text-xs font-bold text-black tracking-widest">${product.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
