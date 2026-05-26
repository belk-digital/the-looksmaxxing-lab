import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function Footer() {
  return (
    <footer className="bg-ink text-cream pt-32 pb-16 border-t border-border-subtle">
      <Container size="wide" className="flex flex-col items-center">
        
        {/* Logo Block */}
        <div className="flex flex-col items-center py-24 text-center w-full">
          <Link href="/" className="font-display text-display-md text-cream hover:opacity-80 transition-opacity">
            THE LOOKSMAXXING LAB
          </Link>
          {/* Placeholder for Face Profile Mark */}
          <div className="mt-8 w-12 h-16 border border-cream/20 flex items-center justify-center text-cream/40 text-body-xs rounded-[50%]">
            MARK
          </div>
        </div>

        {/* Newsletter Block */}
        <div className="w-full max-w-2xl flex flex-col items-center text-center mb-32">
          <span className="text-label-md uppercase tracking-wider text-gold mb-4">NEWSLETTER</span>
          <h2 className="font-display text-display-sm mb-4">Be the first to know.</h2>
          <p className="text-body-md text-cream/70 mb-8 max-w-md">
            Quiet updates. New compounds and research notes — no marketing noise.
          </p>
          <form className="flex w-full max-w-md gap-2">
            <Input 
              type="email" 
              placeholder="your@email.com" 
              required
              className="bg-ink-soft border-cream/20 text-cream placeholder:text-cream/40 focus-visible:border-cream flex-1"
            />
            <Button type="submit" variant="primary" className="shrink-0">SUBSCRIBE</Button>
          </form>
        </div>

        {/* Links Grid */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-32">
          <div className="flex flex-col gap-6">
            <h3 className="text-label-md uppercase tracking-wider text-cream">SHOP</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/shop" className="text-body-sm text-cream/70 hover:text-cream transition-colors">All Products</Link></li>
              <li><Link href="/shop/categories" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Categories</Link></li>
              <li><Link href="/shop/best-sellers" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Best Sellers</Link></li>
              <li><Link href="/gift-cards" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Gift Cards</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-label-md uppercase tracking-wider text-cream">THE LAB</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/about" className="text-body-sm text-cream/70 hover:text-cream transition-colors">About</Link></li>
              <li><Link href="/science" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Science</Link></li>
              <li><Link href="/journal" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Journal</Link></li>
              <li><Link href="/press" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Press</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-label-md uppercase tracking-wider text-cream">RESOURCES</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/calculator" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Peptide Calculator</Link></li>
              <li><Link href="/coa" className="text-body-sm text-cream/70 hover:text-cream transition-colors">COA Library</Link></li>
              <li><Link href="/faq" className="text-body-sm text-cream/70 hover:text-cream transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Shipping</Link></li>
            </ul>
          </div>
          <div className="flex flex-col gap-6">
            <h3 className="text-label-md uppercase tracking-wider text-cream">CONNECT</h3>
            <ul className="flex flex-col gap-4">
              <li><Link href="/contact" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Contact</Link></li>
              <li><Link href="/affiliates" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Affiliates</Link></li>
              <li><a href="#" className="text-body-sm text-cream/70 hover:text-cream transition-colors">Instagram</a></li>
              <li><a href="#" className="text-body-sm text-cream/70 hover:text-cream transition-colors">YouTube</a></li>
              <li><a href="#" className="text-body-sm text-cream/70 hover:text-cream transition-colors">TikTok</a></li>
            </ul>
          </div>
        </div>

        {/* Tagline Strip */}
        <div className="mb-24 text-center">
          <span className="text-label-md uppercase tracking-wider text-gold">
            BIOTECHNOLOGY <span className="text-cream/30 mx-4">|</span> PRECISION <span className="text-cream/30 mx-4">|</span> PURITY
          </span>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-cream/20 mb-8" />

        {/* Bottom Row */}
        <div className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-16">
          <p className="text-body-sm text-cream/60">
            © 2026 The Looksmaxxing Lab.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/terms" className="text-body-sm text-cream/60 hover:text-cream transition-colors">Terms</Link>
            <Link href="/privacy" className="text-body-sm text-cream/60 hover:text-cream transition-colors">Privacy</Link>
            <Link href="/refund" className="text-body-sm text-cream/60 hover:text-cream transition-colors">Refund</Link>
            <Link href="/disclaimer" className="text-body-sm text-cream/60 hover:text-cream transition-colors">Disclaimer</Link>
          </div>
        </div>

        {/* FDA Disclaimer */}
        <div className="max-w-4xl text-center text-[11px] leading-relaxed text-cream/50">
          <p className="mb-2">
            <strong>FDA Disclaimer:</strong> These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.
          </p>
          <p>
            <strong>Research Use Only:</strong> Products on this site are sold for laboratory and research purposes only. They are not intended for human or animal consumption. By purchasing, you certify that you are at least 21 years of age and a qualified researcher or licensed professional.
          </p>
        </div>

      </Container>
    </footer>
  )
}
