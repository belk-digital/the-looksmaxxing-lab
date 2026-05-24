'use client'
import React from 'react'

import { signIn } from 'next-auth/react'
import { cn } from '@/lib/utils'

/**
 * A stylized button that initiates Google OAuth via NextAuth.
 */
export default function GoogleLoginButton({ className }: { className?: string }) {
  const handleClick = () => {
    signIn('google', { callbackUrl: '/account' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full items-center justify-center space-x-2 rounded-md border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700',
        className,
      )}
    >
      {/* Google SVG icon */}
      <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M533.5 278.4c0-17.6-1.6-35.2-4.9-52.3H272v99.1h146.9c-6.4 34.8-25.6 64.4-54.6 84.1v70.3h88.2c51.6-47.5 81.5-117.5 81.5-201.2z"
          fill="#4285F4"
        />
        <path
          d="M272 544.3c73 0 134.2-24.2 178.9-65.7l-88.2-70.3c-24.4 16.4-55.5 26-90.7 26-69.6 0-128.6-46.9-149.7-110.1H31.1v69.6c44.7 88.6 136.2 150.5 240.9 150.5z"
          fill="#34A853"
        />
        <path
          d="M122.3 324.2c-10.5-31.3-10.5-65 0-96.3V158.3H31.1c-41.2 80.5-41.2 176.5 0 257z"
          fill="#FBBC05"
        />
        <path
          d="M272 107.7c39.5-.6 77.5 14.8 106.5 43.2l79.6-79.6C415.3 24.5 344.9 0 272 0 167.3 0 75.8 61.9 31.1 150.5l91.2 69.6C143.4 154.6 202.4 107.7 272 107.7z"
          fill="#EA4335"
        />
      </svg>
      <span>Continue with Google</span>
    </button>
  )
}
