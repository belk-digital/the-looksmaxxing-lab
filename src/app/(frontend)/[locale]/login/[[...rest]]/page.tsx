import { SignIn } from '@clerk/nextjs'

export const metadata = {
  title: 'Sign In – Lookmaxxing Lab',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
