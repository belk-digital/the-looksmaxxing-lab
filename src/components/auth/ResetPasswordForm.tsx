'use client'
// src/components/auth/ResetPasswordForm.tsx

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema } from '@/lib/validation/authSchemas'
import { cn } from '@/lib/utils'
// Server-side reset password handled via API route; no direct import of server utilities
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') // token should be in query string
  const [serverError, setServerError] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = async (data: { password: string; confirmPassword: string }) => {
    setServerError('')
    if (!token) {
      setServerError('Missing reset token')
      return
    }
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Reset failed')
      }
      router.push('/auth/login')
    } catch (err: any) {
      console.error(err)
      setServerError(err?.message ?? 'Reset failed')
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
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-200">
          New password
        </label>
        <input
          id="password"
          type="password"
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
      <div>
        <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-gray-200">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className={cn(
            'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
            errors.confirmPassword && 'border-red-500',
          )}
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-red-400" role="alert">
            {errors.confirmPassword.message?.toString()}
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
        {isSubmitting ? 'Updating…' : 'Reset password'}
      </button>
    </form>
  )
}
