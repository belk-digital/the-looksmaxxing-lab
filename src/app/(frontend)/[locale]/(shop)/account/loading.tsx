import React from 'react'
import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton'

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="flex justify-between items-center pb-4 border-b border-border-subtle">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Block Skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>
      </div>
      
    </div>
  )
}
