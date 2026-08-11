'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { toast } from 'sonner'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      if (!res.ok) {
        throw new Error('Failed to reset password')
      }

      toast.success('Password successfully reset! You can now log in.')
      router.push('/login')
    } catch (err) {
      setError('This reset link is invalid or has expired. Please request a new one.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="text-red-500 text-xs font-bold bg-red-50 p-3 border border-red-100">
          {error}
        </div>
      )}

      <div className="flex flex-col">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800 mb-1" htmlFor="password">
          New Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border border-gray-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white h-14 text-black rounded-none transition-all px-4 w-full pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800 mb-1" htmlFor="confirmPassword">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border border-gray-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white h-14 text-black rounded-none transition-all px-4 w-full pr-12"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="bg-black hover:bg-gray-900 disabled:opacity-50 text-white w-full rounded-none h-14 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center mt-4"
      >
        {isLoading ? 'Resetting...' : 'Update Password'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-black/10">
      {/* Left Column - Imagery / Branding */}
      <div className="w-full lg:w-[45%] relative min-h-[30vh] lg:min-h-screen order-first lg:order-none flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden">
        {/* Background Image */}
        <Image 
          src="/New Images/vials-on-magazine.webp"
          alt="Longevia Research"
          fill
          className="object-cover object-center z-0"
          priority
        />
        
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

        {/* Top Logo / Back */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/login" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:opacity-80 transition-opacity drop-shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          <div className="font-serif text-xl font-bold tracking-tighter text-white drop-shadow-sm">Longevia</div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-sm mt-12 lg:mt-0 drop-shadow-md">
          <h2 className="text-[10px] font-bold text-white/80 tracking-[0.25em] uppercase mb-6">
            Account Recovery
          </h2>
          <h1 className={`text-4xl lg:text-5xl leading-[1.1] font-bold tracking-tighter text-white mb-6 ${spaceGrotesk.className}`}>
            Set a new password.
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Please enter your new password below. Make sure it is at least 8 characters long.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-[420px] flex flex-col">
          <h2 className={`text-2xl font-bold tracking-tight text-black mb-1 ${spaceGrotesk.className}`}>
            New Password
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Create a secure password to protect your account.
          </p>
          
          <Suspense fallback={<div className="h-14 w-full flex items-center justify-center text-gray-500 text-sm">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
