import React from 'react'
import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col lg:flex-row bg-cream">
      {/* Left: Image (50% on desktop, top banner on mobile) */}
      <div className="w-full lg:w-1/2 relative min-h-[30vh] lg:min-h-screen order-first lg:order-none">
        <Image 
          src="/hero-image.png" 
          alt="Register" 
          fill 
          className="object-cover" 
          priority
        />
      </div>

      {/* Right: Clerk Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 lg:p-24 bg-cream">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-10">
            <span className="text-label-md uppercase tracking-wider text-ink-muted mb-4 block">Welcome</span>
            <h1 className="text-display-md font-serif text-ink">Create account</h1>
          </div>
          
          <div className="flex justify-center w-full">
            <SignUp 
              path="/register"
              routing="path"
              signInUrl="/login"
              appearance={{
                variables: {
                  colorPrimary: '#D4AF37', // Gold
                  colorText: '#181818', // Ink
                  colorBackground: 'transparent',
                  colorInputBackground: '#F5F3E9', // Cream-warm
                  colorInputText: '#181818',
                  borderRadius: '2px',
                },
                elements: {
                  card: 'bg-transparent shadow-none w-full p-0',
                  header: 'hidden',
                  footerAction: 'justify-center mt-6',
                  footerActionText: 'text-body-md text-ink-muted',
                  footerActionLink: 'text-body-md text-gold hover:text-gold-dark font-medium',
                  formButtonPrimary: 'bg-ink hover:bg-ink/90 text-cream w-full rounded-sm h-12 text-label-md uppercase tracking-wider',
                  formFieldInput: 'border-border-subtle focus:border-gold focus:ring-1 focus:ring-gold bg-cream-warm h-12 text-body-md rounded-sm',
                  formFieldLabel: 'text-label-md uppercase tracking-wider text-ink-muted mb-2',
                  dividerLine: 'bg-border-subtle',
                  dividerText: 'text-label-sm uppercase tracking-wider text-ink-muted',
                  socialButtonsBlockButton: 'border-border-subtle hover:bg-cream-warm h-12 rounded-sm',
                  socialButtonsBlockButtonText: 'text-label-md uppercase tracking-wider text-ink',
                }
              }} 
            />
          </div>
        </div>
      </div>
    </main>
  )
}
