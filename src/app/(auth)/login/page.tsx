// src/app/(auth)/login/page.tsx

import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import LoginForm from '@/components/auth/LoginForm'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'

export const metadata = {
  title: 'Sign In – Lookmaxxing Lab',
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">
          Sign in to your account
        </h2>
        <LoginForm />
        <div className="mt-4 flex items-center justify-center">
          <span className="mx-2 text-gray-400">or</span>
        </div>
        <GoogleLoginButton className="mt-4" />
      </AuthCard>
    </AuthLayout>
  )
}
