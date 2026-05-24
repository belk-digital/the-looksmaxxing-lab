'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h2 className="mb-4 text-3xl font-bold">Something went wrong!</h2>
      <p className="mb-8 text-gray-400">An unexpected error occurred.</p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-indigo-500 px-6 py-3 font-semibold text-white transition-all hover:bg-indigo-600 hover:scale-105"
      >
        Try again
      </button>
    </div>
  )
}
