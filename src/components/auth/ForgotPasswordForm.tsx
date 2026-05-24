'use client'
// src/components/auth/ForgotPasswordForm.tsx

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
// Use API endpoint for forgot password
import { emailSchema } from '@/lib/validation/authSchemas'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

// Simple schema – only email required
const forgotSchema = z.object({ email: emailSchema })

export default function ForgotPasswordForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (data: { email: string }) => {
    setServerError('')
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Failed to send reset email')
      }
      router.push('/verify-email')
    } catch (err: any) {
      console.error(err)
      setServerError(err?.message ?? 'Failed to send reset email')
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
      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50',
        )}
      >
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
