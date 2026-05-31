import React from 'react'
import { FadeUp } from '@/components/motion/FadeUp'
import { Container } from '@/components/ui/container'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Newsletter() {
  return (
    <section className="relative z-10 w-full bg-[#EAE4DC] py-32">
      <Container size="content" className="flex flex-col items-center text-center">
        
        <FadeUp>
          <span className="text-label-md uppercase tracking-wider text-gold mb-4 block">
            STAY INFORMED
          </span>
        </FadeUp>
        
        <FadeUp delay={0.1}>
          <h2 className="text-display-md font-display text-ink mb-6">
            Quiet updates.
          </h2>
        </FadeUp>
        
        <FadeUp delay={0.2}>
          <p className="text-body-lg text-ink max-w-lg">
            New compounds and research notes — no marketing noise.
          </p>
        </FadeUp>
        
        <FadeUp delay={0.3} className="w-full">
          <form 
            action={async () => {
              'use server'
              // Server action stub for newsletter subscription
              console.log('Newsletter subscription stub')
            }}
            className="flex flex-col md:flex-row gap-3 max-w-md mx-auto mt-12 w-full"
          >
            <Input 
              type="email" 
              name="email"
              placeholder="your@email.com" 
              required
              className="flex-1 bg-transparent"
            />
            <Button type="submit" variant="dark" size="md" className="shrink-0 w-full md:w-auto">
              SUBSCRIBE
            </Button>
          </form>
        </FadeUp>
        
        <FadeUp delay={0.4}>
          <p className="text-body-sm text-ink-muted mt-4">
            Unsubscribe at any time.
          </p>
        </FadeUp>

      </Container>
    </section>
  )
}
