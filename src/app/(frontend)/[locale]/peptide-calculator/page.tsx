'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FadeUp } from '@/components/motion/FadeUp'
import { EyebrowHeading } from '@/components/editorial/EyebrowHeading'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion'

export default function PeptideCalculatorPage() {
  const [vialMg, setVialMg] = useState('5')
  const [waterMl, setWaterMl] = useState('2')
  const [doseMcg, setDoseMcg] = useState('250')

  let concentration = '—'
  let volumePerDose = '—'
  let syringeIU = '—'
  let dosesPerVial = '—'

  const vMg = parseFloat(vialMg)
  const wMl = parseFloat(waterMl)
  const dMcg = parseFloat(doseMcg)

  if (!isNaN(vMg) && !isNaN(wMl) && wMl > 0 && vMg > 0) {
    const conc = (vMg * 1000) / wMl
    concentration = conc.toLocaleString(undefined, { maximumFractionDigits: 2 })
    
    if (!isNaN(dMcg) && dMcg > 0) {
      const vol = dMcg / conc
      volumePerDose = vol.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })
      syringeIU = (vol * 100).toLocaleString(undefined, { maximumFractionDigits: 0 })
      dosesPerVial = Math.floor(wMl / vol).toString()
    }
  }

  return (
    <main className="bg-cream min-h-screen pt-32 pb-24">
      {/* Header */}
      <section className="px-6 mb-16 max-w-[720px] mx-auto text-center flex flex-col items-center">
        <FadeUp>
          <EyebrowHeading gold className="items-center mb-4 text-center">Research Tools</EyebrowHeading>
          <h1 className="text-display-md font-serif text-ink mb-6">Peptide reconstitution calculator</h1>
          <p className="text-body-lg text-ink-muted">
            A guided calculator for accurate peptide reconstitution and dose volume calculation. For research use only.
          </p>
        </FadeUp>
      </section>

      {/* Calculator Section */}
      <section className="px-6 mb-24 max-w-[720px] mx-auto">
        <FadeUp delay={0.1}>
          <div className="bg-cream-warm rounded-md p-8 md:p-12 shadow-sm border border-border-subtle">
            <h3 className="text-label-md uppercase tracking-wider text-ink mb-6">Input</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div>
                <Label htmlFor="vialMg" className="text-body-sm text-ink-muted mb-2 block">Peptide amount in vial (MG)</Label>
                <Input 
                  id="vialMg"
                  type="number" 
                  min="0"
                  step="any"
                  value={vialMg} 
                  onChange={(e) => setVialMg(e.target.value)} 
                  className="text-center font-medium text-lg"
                  placeholder="5"
                />
              </div>
              <div>
                <Label htmlFor="waterMl" className="text-body-sm text-ink-muted mb-2 block">Bacteriostatic water (ML)</Label>
                <Input 
                  id="waterMl"
                  type="number" 
                  min="0"
                  step="any"
                  value={waterMl} 
                  onChange={(e) => setWaterMl(e.target.value)} 
                  className="text-center font-medium text-lg"
                  placeholder="2"
                />
              </div>
              <div>
                <Label htmlFor="doseMcg" className="text-body-sm text-ink-muted mb-2 block">Desired dose (MCG)</Label>
                <Input 
                  id="doseMcg"
                  type="number" 
                  min="0"
                  step="any"
                  value={doseMcg} 
                  onChange={(e) => setDoseMcg(e.target.value)} 
                  className="text-center font-medium text-lg"
                  placeholder="250"
                />
              </div>
            </div>

            <div className="w-full h-[1px] bg-border-subtle mb-10" />

            <h3 className="text-label-md uppercase tracking-wider text-ink mb-6">Results</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-body-md text-ink-muted">Concentration</span>
                <span className="text-body-lg font-medium text-ink">{concentration !== '—' ? `${concentration} mcg / mL` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-body-md text-ink-muted">Volume per dose</span>
                <span className="text-body-lg font-medium text-ink">{volumePerDose !== '—' ? `${volumePerDose} mL` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border-subtle">
                <span className="text-body-md text-ink-muted">Syringe marking</span>
                <span className="text-body-lg font-medium text-ink">{syringeIU !== '—' ? `${syringeIU} IU (on 100u syringe)` : '—'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-body-md text-ink-muted">Doses per vial</span>
                <span className="text-body-lg font-medium text-ink">{dosesPerVial !== '—' ? `${dosesPerVial} doses` : '—'}</span>
              </div>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Info Section */}
      <section className="px-6 mb-16 max-w-[720px] mx-auto">
        <FadeUp delay={0.2}>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-to-use">
              <AccordionTrigger className="text-body-lg font-sans text-ink">How to use this calculator</AccordionTrigger>
              <AccordionContent className="text-body-md text-ink-muted leading-relaxed">
                Enter the amount of peptide provided in the vial (usually listed in mg), the volume of bacteriostatic water you plan to use for reconstitution (in mL), and the specific research dose you wish to achieve (in mcg). The calculator will instantly determine the concentration and required volume.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="math">
              <AccordionTrigger className="text-body-lg font-sans text-ink">Why each calculation matters</AccordionTrigger>
              <AccordionContent className="text-body-md text-ink-muted leading-relaxed">
                Precision is paramount. Concentration ensures you understand the exact mg-to-mL ratio. Volume per dose ensures accurate extraction. Syringe markings provide a practical translation to common U-100 insulin syringes, where 100 IU equals 1 mL.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="storage">
              <AccordionTrigger className="text-body-lg font-sans text-ink">Storage and handling</AccordionTrigger>
              <AccordionContent className="text-body-md text-ink-muted leading-relaxed">
                Lyophilized (powdered) peptides should be stored in a freezer away from light. Once reconstituted with bacteriostatic water, they must be refrigerated (2°C to 8°C) and typically remain stable for 2 to 4 weeks, depending on the specific sequence.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-12 text-center">
            <span className="text-body-md text-ink">
              See also: <Link href="/journal" className="text-gold hover:text-gold-dark transition-colors underline underline-offset-4">full reconstitution guide →</Link>
            </span>
          </div>
        </FadeUp>
      </section>

      {/* Disclaimer */}
      <section className="px-6 max-w-[720px] mx-auto">
        <FadeUp delay={0.3}>
          <div className="bg-cream-sand p-6 rounded-sm text-center">
            <p className="text-body-xs text-ink-muted uppercase tracking-wider">
              Disclaimer: These products are intended for laboratory research use only and are not for human consumption, diagnostic, or therapeutic purposes. This calculator is provided strictly as a theoretical research tool.
            </p>
          </div>
        </FadeUp>
      </section>
    </main>
  )
}
