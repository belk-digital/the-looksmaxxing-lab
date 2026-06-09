import React from 'react'

export default function AccountLoading() {
  return (
    <div className="flex flex-col gap-12 w-full animate-in fade-in duration-500">
      
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 mb-4 border-b border-gray-200 pb-6">
        <div className="h-10 w-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-4 w-96 bg-gray-100 rounded-md animate-pulse" />
      </div>

      {/* Stats Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 h-32 flex flex-col justify-between animate-pulse">
            <div className="h-3 w-24 bg-gray-100 rounded-md" />
            <div className="h-12 w-16 bg-gray-100 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-12 items-start mt-4">
        {/* Left Column Skeleton */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
          
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-6 bg-white border border-gray-100 rounded-3xl h-24 animate-pulse flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-24 bg-gray-100 rounded-md" />
                  <div className="h-4 w-32 bg-gray-100 rounded-md" />
                </div>
                <div className="h-10 w-32 bg-gray-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4">
              <div className="h-4 w-32 bg-gray-100 rounded-md animate-pulse" />
            </div>
            <div className="bg-white p-8 rounded-3xl border border-gray-100 h-48 animate-pulse flex flex-col gap-4">
              <div className="h-6 w-32 bg-gray-100 rounded-full" />
              <div className="h-4 w-full bg-gray-100 rounded-md mt-2" />
              <div className="h-4 w-3/4 bg-gray-100 rounded-md" />
              <div className="h-4 w-1/2 bg-gray-100 rounded-md" />
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
