import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/')
}

/*
import { Metadata } from 'next'
import PeptideCalculatorPage from './PeptideCalculatorClient'

export const metadata: Metadata = {
  openGraph: {
    images: [{ url: '/og/og-calculator.webp', width: 1200, height: 630, alt: 'Peptide Reconstitution Calculator — Longevia Research' }],
  },
  title: 'Peptide Reconstitution Calculator - Free Tool',
  description: 'Free peptide reconstitution calculator. Enter your vial size, BAC water volume, and target dose to get exact IU syringe units, concentration, and total doses. No signup - instant results.',
  alternates: {
    canonical: 'https://longeviaresearch.com/peptide-calculator',
    languages: {
      'en-US': 'https://longeviaresearch.com/peptide-calculator',
    },
  },
}

function LegacyCalculatorPage() {
  return (
    <>
      <PeptideCalculatorPage />
    </>
  )
}
*/

