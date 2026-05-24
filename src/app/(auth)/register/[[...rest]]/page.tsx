import { SignUp } from '@clerk/nextjs'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-950">
      <SignUp path="/register" routing="path" signInUrl="/login" forceRedirectUrl="/account" />
    </div>
  )
}
