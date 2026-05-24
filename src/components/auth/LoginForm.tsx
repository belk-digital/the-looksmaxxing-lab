// src/components/auth/LoginForm.tsx

'use client'
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validation/authSchemas'
import { cn } from '@/lib/utils'
// Login handled via server API route; no direct import of server utilities
import { useRouter } from 'next/navigation'

interface LoginFormProps {
  /** Optional URL to redirect after successful login */
  redirectTo?: string
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    setServerError('')
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }
      // On success, the server will set an HttpOnly cookie.
      router.refresh() // refresh to load any auth state
      router.push(redirectTo ?? '/account')
    } catch (err: any) {
      console.error(err)
      setServerError(err?.message ?? 'Login failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <p className="text-sm text-red-400" role="alert">
          {serverError}
        </p>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-200">
          Email address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className={cn(
            'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            errors.email && 'border-red-500',
          )}
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-400" role="alert">
            {errors.email.message?.toString()}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-200">
          Password
        </label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          className={cn(
            'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            errors.password && 'border-red-500',
          )}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400" role="alert">
            {errors.password.message?.toString()}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-300">Remember me</span>
        </label>
        <a href="/auth/forgot-password" className="text-sm text-indigo-400 hover:underline">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50',
        )}
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
