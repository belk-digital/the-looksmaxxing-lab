// src/app/(auth)/verify-email/page.tsx

import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import Link from 'next/link'

export const metadata = {
  title: 'Verify email – Lookmaxxing Lab',
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">Verify your email</h2>
        <p className="mb-4 text-gray-200">
          A verification link has been sent to your email address. Please check your inbox and click
          the link to verify your account.
        </p>
        <Link href="/auth/login" className="block text-center text-indigo-400 hover:underline">
          Back to login
        </Link>
      </AuthCard>
    </AuthLayout>
  )
}
