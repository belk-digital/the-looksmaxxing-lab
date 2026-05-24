import { SignIn } from '@clerk/nextjs'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gray-950">
      <SignIn path="/login" routing="path" signUpUrl="/register" forceRedirectUrl="/account" />
    </div>
  )
}
