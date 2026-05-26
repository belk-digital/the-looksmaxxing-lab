import React from 'react'
import { Container } from '@/components/ui/container'
import { Skeleton, ProductCardSkeleton } from '@/components/ui/skeleton'

export default function ShopLoading() {
  return (
    <div className="w-full bg-cream min-h-screen">
      <Container size="page" className="py-12">
        {/* Breadcrumbs Skeleton */}
        <Skeleton className="h-4 w-32 mb-8" />
        
        {/* Header Skeleton */}
        <div className="mb-12 space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-full max-w-2xl" />
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col md:flex-row gap-12 items-start">
          
          {/* Left: Filter Sidebar Skeleton */}
          <div className="hidden md:flex flex-col gap-8 w-64 shrink-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-6 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              </div>
            ))}
          </div>

          {/* Right: Results Area Skeleton */}
          <div className="flex-1 flex flex-col w-full">
            <div className="flex justify-between mb-8">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-10 w-48" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
