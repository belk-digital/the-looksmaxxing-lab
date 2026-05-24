// src/app/(auth)/reset-password/[token]/page.tsx

import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Reset password – Lookmaxxing Lab',
}

export default function ResetPasswordPage() {
  // The token will be read from the query string by the form component.
  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">
          Choose a new password
        </h2>
        <ResetPasswordForm />
      </AuthCard>
    </AuthLayout>
  )
}
