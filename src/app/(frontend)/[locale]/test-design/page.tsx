import React from 'react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function TestDesignPage() {
  return (
    <div className="bg-cream text-ink min-h-screen py-20">
      <Container size="page">
        
        {/* Typography Test */}
        <div className="mb-20">
          <span className="font-sans text-label-md uppercase tracking-wider text-gold block mb-4">
            THE LAB
          </span>
          <h1 className="font-display text-display-xl">
            Documented purity.
          </h1>
          <p className="font-sans text-body-md mt-6 max-w-content">
            This is a body text sample. We are testing the integration of Bodoni Moda for display text and DM Sans for body copy. The colors should be warm cream for the background and near-black ink for the text.
          </p>
        </div>

        {/* Button Variants Test */}
        <div className="space-y-12">
          
          <div>
            <h2 className="font-display text-display-sm mb-6">Button Variants (md)</h2>
            <div className="flex flex-wrap items-center gap-6 p-8 bg-cream-warm rounded-md border border-border-subtle">
              <Button variant="primary" size="md">Primary</Button>
              <Button variant="secondary" size="md">Secondary</Button>
              <Button variant="ghost" size="md">Ghost</Button>
              <Button variant="link" size="md">Link Style</Button>
              <Button variant="dark" size="md">Dark CTA</Button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-display-sm mb-6">Button Sizes (Primary)</h2>
            <div className="flex flex-wrap items-end gap-6 p-8 bg-cream-warm rounded-md border border-border-subtle">
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="md">Medium</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
          </div>

          <div>
            <h2 className="font-display text-display-sm mb-6">States</h2>
            <div className="flex flex-wrap items-center gap-6 p-8 bg-cream-warm rounded-md border border-border-subtle">
              <Button variant="primary" size="md" disabled>Disabled</Button>
              <Button variant="primary" size="md" isLoading>Loading State</Button>
              <Button variant="dark" size="md" isLoading>Dark Loading</Button>
            </div>
          </div>

        </div>

        {/* Form Primitives Test */}
        <div className="mt-20">
          <h2 className="font-display text-display-sm mb-6">Form Primitives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            {/* Valid inputs */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="email" required>Email address</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" placeholder="How can we help?" />
              </div>
            </div>

            {/* Error and Disabled */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="error-input" required>Password</Label>
                <Input 
                  id="error-input" 
                  type="password" 
                  placeholder="Enter your password" 
                  error="Password must be at least 8 characters long" 
                />
              </div>
              <div>
                <Label htmlFor="disabled-input">Discount Code</Label>
                <Input 
                  id="disabled-input" 
                  type="text" 
                  placeholder="Not applicable" 
                  disabled 
                />
              </div>
            </div>

          </div>
        </div>
      </Container>
    </div>
  )
}
