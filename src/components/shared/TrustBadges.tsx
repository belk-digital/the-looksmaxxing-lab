'use client'

import React from 'react'
import { Container } from '@/components/ui/container'
import { FadeUp } from '@/components/motion/FadeUp'
import { Zap, FlaskConical, ShieldCheck } from 'lucide-react'

export function TrustBadges() {
  return (
    <section className="w-full bg-white py-20 md:py-28 border-y border-ink/5">
      <Container size="page">
        <FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-y-0 relative">
            
            {/* Column 1 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left md:pr-12 lg:pr-20">
              <Zap className="w-8 h-8 text-[#5984c4]" strokeWidth={1} />
              <h3 className="text-[11px] uppercase tracking-widest text-ink mt-8 font-medium">
                ≥99% HPLC PURITY
              </h3>
              <p className="text-sm text-ink/75 mt-3 leading-relaxed max-w-[280px] md:max-w-none">
                Every batch verified by high-performance liquid chromatography.
              </p>
            </div>

            {/* Column 2 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative md:px-12 lg:px-20">
              {/* Vertical Divider */}
              <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100" />
              
              <FlaskConical className="w-8 h-8 text-[#5984c4]" strokeWidth={1} />
              <h3 className="text-[11px] uppercase tracking-widest text-ink mt-8 font-medium">
                LC-MS VERIFIED
              </h3>
              <p className="text-sm text-ink/75 mt-3 leading-relaxed max-w-[280px] md:max-w-none">
                Mass spectrometry confirms peptide identity and purity.
              </p>
            </div>

            {/* Column 3 */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left relative md:pl-12 lg:pl-20">
              {/* Vertical Divider */}
              <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100" />
              
              <ShieldCheck className="w-8 h-8 text-[#5984c4]" strokeWidth={1} />
              <h3 className="text-[11px] uppercase tracking-widest text-ink mt-8 font-medium">
                COA WITH EVERY ORDER
              </h3>
              <p className="text-sm text-ink/75 mt-3 leading-relaxed max-w-[280px] md:max-w-none">
                Lot-specific Certificate of Analysis included.
              </p>
            </div>

          </div>
        </FadeUp>
      </Container>
    </section>
  )
}
