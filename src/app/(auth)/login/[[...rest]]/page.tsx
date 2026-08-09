'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import { toast } from 'sonner'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials. If this is your first time logging in since our upgrade, please reset your password.')
      } else {
        toast.success('Successfully logged in')
        router.push('/account')
        router.refresh()
      }
    } catch (error) {
      toast.error('An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-black/10">
      
      {/* Left Column - Imagery / Branding */}
      <div className="w-full lg:w-[45%] relative min-h-[30vh] lg:min-h-screen order-first lg:order-none flex flex-col justify-between p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-gray-100 overflow-hidden">
        
        {/* Background Image */}
        <Image 
          src="/New Images/vials-on-magazine.webp"
          alt="Longevia Research NAD+, Glow, and MOTS-C research peptide vials displayed on an open longevity-science magazine spread"
          fill
          className="object-cover object-center z-0"
          priority
        />
        
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

        {/* Top Logo / Back */}
        <div className="relative z-10 flex justify-between items-center w-full">
          <Link href="/" className="inline-flex items-center text-xs font-bold uppercase tracking-[0.2em] text-white hover:opacity-80 transition-opacity drop-shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return
          </Link>
          <div className="font-serif text-xl font-bold tracking-tighter text-white drop-shadow-sm">Longevia</div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 flex flex-col justify-center h-full max-w-sm mt-12 lg:mt-0 drop-shadow-md">
          <h2 className="text-[10px] font-bold text-white/80 tracking-[0.25em] uppercase mb-6">
            Portal Access
          </h2>
          <h1 className={`text-4xl lg:text-5xl leading-[1.1] font-bold tracking-tighter text-white mb-6 ${spaceGrotesk.className}`}>
            Welcome back to the laboratory.
          </h1>
          <p className="text-white/80 text-sm leading-relaxed max-w-[320px]">
            Sign in to access your account, manage your subscriptions, and explore premium research materials.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-[55%] flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="w-full max-w-[420px] flex flex-col">
          <h2 className={`text-2xl font-bold tracking-tight text-black mb-1 ${spaceGrotesk.className}`}>
            Sign In
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Don't have an account? <Link href="/register" className="text-black font-bold hover:underline transition-all">Sign Up</Link>
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/account' })}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-black w-full h-[52px] text-sm font-medium transition-all flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] text-gray-400 uppercase tracking-widest font-bold">Or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800 mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-200 focus:border-black focus:ring-1 focus:ring-black focus:outline-none bg-white h-14 text-black rounded-none transition-all px-4"
              />
            </div>
            
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-gray-800" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-black hover:underline text-[10px] font-bold uppercase tracking-[0.1em] transition-all">
                  Forgot?
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={isLoading}
              className="bg-black hover:bg-gray-900 disabled:opacity-50 text-white w-full rounded-none h-14 text-xs font-bold uppercase tracking-[0.2em] transition-colors flex items-center justify-center mt-4"
            >
              {isLoading ? 'Signing In...' : 'Continue'}
            </button>




          </form>
        </div>
      </div>
    </main>
  )
}
