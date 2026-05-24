// src/app/(auth)/forgot-password/page.tsx

import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Forgot password – Lookmaxxing Lab',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">Reset your password</h2>
        <ForgotPasswordForm />
      </AuthCard>
    </AuthLayout>
  )
}
