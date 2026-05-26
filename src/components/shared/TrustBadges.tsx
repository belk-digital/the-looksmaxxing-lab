'use client'

import React from 'react'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { Zap, FlaskConical, ShieldCheck } from 'lucide-react'

export function TrustBadges() {
  return (
    <section className="w-full py-24">
      <Container size="page">
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-0 items-start">
            
            {/* Column 1 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:pr-12">
              <Zap className="w-8 h-8 text-gold" strokeWidth={1.5} />
              <h3 className="text-label-lg uppercase tracking-wider text-ink mt-6">
                ≥99% HPLC PURITY
              </h3>
              <p className="text-body-sm text-ink-muted mt-2 line-clamp-2">
                Every batch verified by high-performance liquid chromatography.
              </p>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:border-l md:border-gold/30 md:px-12 relative">
              <FlaskConical className="w-8 h-8 text-gold" strokeWidth={1.5} />
              <h3 className="text-label-lg uppercase tracking-wider text-ink mt-6">
                LC-MS VERIFIED
              </h3>
              <p className="text-body-sm text-ink-muted mt-2 line-clamp-2">
                Mass spectrometry confirms peptide identity and purity.
              </p>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:border-l md:border-gold/30 md:pl-12 relative">
              <ShieldCheck className="w-8 h-8 text-gold" strokeWidth={1.5} />
              <h3 className="text-label-lg uppercase tracking-wider text-ink mt-6">
                COA WITH EVERY ORDER
              </h3>
              <p className="text-body-sm text-ink-muted mt-2 line-clamp-2">
                Lot-specific Certificate of Analysis included.
              </p>
            </div>

          </div>
        </FadeUp>
      </Container>
    </section>
  )
}
