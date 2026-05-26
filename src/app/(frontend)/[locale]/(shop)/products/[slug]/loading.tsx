import React from 'react'
import { Container } from '@/components/ui/container'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductLoading() {
  return (
    <div className="bg-cream min-h-screen">
      {/* Promo Bar Skeleton */}
      <Skeleton className="h-10 w-full rounded-none" />
      
      <Container size="wide" className="pt-12 pb-24">
        {/* Breadcrumbs Skeleton */}
        <Skeleton className="h-4 w-48 mb-8" />

        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          {/* Left: Gallery Skeleton */}
          <div className="w-full lg:w-[55%] flex flex-col gap-4">
            <Skeleton className="w-full aspect-square md:aspect-[4/5]" />
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="w-20 h-20 shrink-0" />
              ))}
            </div>
          </div>

          {/* Right: Details Skeleton */}
          <div className="w-full lg:w-[45%] flex flex-col pt-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/3 mb-8" />
            <Skeleton className="h-8 w-1/4 mb-8" />

            <div className="space-y-4 mb-12">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Form actions */}
            <div className="space-y-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
