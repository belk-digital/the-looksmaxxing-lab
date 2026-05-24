// src/app/(auth)/register/page.tsx

import AuthLayout from '@/components/auth/AuthLayout'
import AuthCard from '@/components/auth/AuthCard'
import RegisterForm from '@/components/auth/RegisterForm'
import GoogleLoginButton from '@/components/auth/GoogleLoginButton'

export const metadata = {
  title: 'Create account – Lookmaxxing Lab',
}

export default function RegisterPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <h2 className="mb-6 text-center text-2xl font-semibold text-white">Create your account</h2>
        <RegisterForm />
        <div className="mt-4 flex items-center justify-center">
          <span className="mx-2 text-gray-400">or</span>
        </div>
        <GoogleLoginButton className="mt-4" />
      </AuthCard>
    </AuthLayout>
  )
}
