import { SignUp } from '@clerk/nextjs'

export const metadata = {
  title: 'Register – Lookmaxxing Lab',
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  )
}
