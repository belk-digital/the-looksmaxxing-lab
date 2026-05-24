'use client'
// src/components/auth/RegisterForm.tsx

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '@/lib/validation/authSchemas'
import { cn } from '@/lib/utils'
// Server-side register handled via API route; no direct import of server utilities
import { useRouter } from 'next/navigation'

export default function RegisterForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string>('')
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      acceptsMarketing: false,
    },
  })

  const onSubmit = async (data: any) => {
    setServerError('')
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          firstName: data.firstName,
          lastName: data.lastName,
          acceptsMarketing: data.acceptsMarketing,
          provider: 'email',
        }),
      })
      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.message || 'Registration failed')
      }
      router.push('/verify-email')
    } catch (err: any) {
      console.error(err)
      setServerError(err?.message ?? 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <p className="text-sm text-red-400" role="alert">
          {serverError}
        </p>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-200">
            First name
          </label>
          <input
            id="firstName"
            type="text"
            {...formRegister('firstName')}
            className={cn(
              'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              errors.firstName && 'border-red-500',
            )}
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {errors.firstName.message?.toString()}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-200">
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            {...formRegister('lastName')}
            className={cn(
              'w-full rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500',
              errors.lastName && 'border-red-500',
            )}
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-red-400" role="alert">
              {errors.lastName.message?.toString()}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-200">
          Email address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...formRegister('email')}
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
          {...formRegister('password')}
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

      <div className="flex items-center space-x-2">
        <input
          id="acceptsMarketing"
          type="checkbox"
          {...formRegister('acceptsMarketing')}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="acceptsMarketing" className="text-sm text-gray-300">
          I want to receive marketing emails
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          'w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50',
        )}
      >
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
