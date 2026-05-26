import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'

export function MinimalFooter() {
  return (
    <footer className="w-full border-t border-border-subtle bg-cream py-8">
      <Container size="wide" className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="text-body-sm text-ink-muted">
          © {new Date().getFullYear()} The Looksmaxxing Lab. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-label-sm uppercase tracking-wider text-ink-muted">
          <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
          <Link href="/refunds" className="hover:text-ink transition-colors">Refunds</Link>
        </div>
      </Container>
    </footer>
  )
}
