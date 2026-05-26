import React from 'react'
import { ProductClient } from './ProductClient'
import { notFound } from 'next/navigation'

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  // Hardcoded sample data for now (shows TB-500 data for all products for testing)
  const productData = {
    id: 'prod-tb-500',
    name: 'TB-500',
    subtitle: 'THYMOSIN BETA-4',
    category: 'Recovery',
    badges: ['BEST SELLER'],
    shortDescription: 'Synthetically produced version of the natural peptide present in human and animal cells. Focuses on cellular regeneration, tissue repair, and inflammation modulation.',
    images: [
      '/temp-products/tb-500.png',
      '/temp-products/bpc-157.png',
      '/temp-products/ghk-cu.png',
      '/temp-products/semaglutide.png',
      '/temp-products/product-image.png'
    ],
    variants: [
      { id: 'v-5mg', title: '5 MG', price: '$85.00', inStock: true },
      { id: 'v-10mg', title: '10 MG', price: '$150.00', inStock: true },
      { id: 'v-20mg', title: '20 MG', price: '$280.00', inStock: true },
      { id: 'v-50mg', title: '50 MG', price: '$650.00', inStock: false },
    ],
    coaFile: '/sample-coa.pdf',
    tabs: [
      {
        id: 'overview',
        label: 'Overview',
        content: (
          <div className="flex flex-col gap-4 max-w-3xl">
            <h3 className="text-display-xs font-display text-ink mb-2">Cellular Regeneration Protocol</h3>
            <p className="text-body-lg text-ink-muted leading-relaxed">
              TB-500 is a synthetic version of the naturally occurring peptide Thymosin Beta-4. It is designed to evaluate cellular regeneration, wound healing, and tissue repair processes in vitro.
            </p>
            <p className="text-body-lg text-ink-muted leading-relaxed">
              Its primary mechanism involves the upregulation of actin, an essential cellular protein that plays a critical role in muscle contraction, cell mobility, and structural integrity.
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2 text-ink-muted">
              <li>Purity: ≥ 99.2% (HPLC verified)</li>
              <li>Sequence: Ac-Ser-Asp-Lys-Pro-Asp-Met-Ala-Glu-Ile-Glu-Lys-Phe-Asp-Lys-Ser-Lys-Leu-Lys-Lys-Thr-Glu-Thr-Gln-Glu-Lys-Asn-Pro-Leu-Pro-Ser-Lys-Glu-Thr-Ile-Glu-Gln-Glu-Lys-Gln-Ala-Gly-Glu-Ser</li>
              <li>Molecular Formula: C212H350N56O78S1</li>
            </ul>
          </div>
        )
      },
      {
        id: 'lab-results',
        label: 'Lab Results',
        content: (
          <div className="flex flex-col gap-4">
            <p className="text-body-lg text-ink-muted">
              Every batch undergoes rigorous third-party testing via HPLC and LC-MS to verify purity, identity, and ensure the absence of heavy metals or biological contaminants.
            </p>
          </div>
        )
      },
      {
        id: 'reconstitution',
        label: 'Reconstitution',
        content: (
          <div className="flex flex-col gap-4">
            <p className="text-body-lg text-ink-muted">
              Lyophilized peptide must be reconstituted with bacteriostatic water prior to use. Store in a cool, dry place away from light until ready for reconstitution.
            </p>
          </div>
        )
      },
      {
        id: 'shipping',
        label: 'Shipping',
        content: (
          <div className="flex flex-col gap-4">
            <p className="text-body-lg text-ink-muted">
              Orders over $300 qualify for complimentary expedited shipping within the continental US. International shipping subject to local customs regulations.
            </p>
          </div>
        )
      }
    ],
    reviews: [
      {
        id: 'r1',
        author: 'Dr. Michael Chen',
        rating: 5,
        date: '2025-10-14',
        title: 'Consistent purity across batches',
        content: 'We use TB-500 extensively in our tissue recovery models. The Lab has provided consistent >99% purity verified by our own internal mass spec over 4 different lot orders.'
      },
      {
        id: 'r2',
        author: 'Sarah Jenkins',
        rating: 5,
        date: '2025-09-02',
        title: 'Excellent solubility',
        content: 'Reconstitutes perfectly clear within seconds. The included COAs matching the vial lot numbers gives us great confidence in the integrity of our research.'
      },
      {
        id: 'r3',
        author: 'Anonymous Researcher',
        rating: 4,
        date: '2025-08-18',
        title: 'Good compound, fast shipping',
        content: 'Shipping was overnight as promised. The lyophilized puck was intact upon arrival.'
      }
    ],
    relatedProducts: [
      {
        id: 'rp1',
        name: 'BPC-157 Blend',
        slug: 'bpc-157-blend',
        image: '/temp-products/bpc-157.png',
        descriptor: 'EXPERIMENTAL · 5MG',
        price: '$120.00',
        badge: 'bestseller'
      },
      {
        id: 'rp2',
        name: 'GHK-Cu Copper Peptide',
        slug: 'ghk-cu',
        image: '/temp-products/ghk-cu.png',
        descriptor: 'EXPERIMENTAL · 50MG',
        price: '$85.00'
      },
      {
        id: 'rp3',
        name: 'Semaglutide',
        slug: 'semaglutide',
        image: '/temp-products/semaglutide.png',
        descriptor: 'METABOLIC · 3MG',
        price: '$200.00'
      },
      {
        id: 'rp4',
        name: 'NAD+',
        slug: 'nad-plus',
        image: '/temp-products/product-image.png',
        descriptor: 'CELLULAR · 500MG',
        price: '$150.00'
      }
    ]
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 mt-20">
        <ProductClient product={productData as any} />
      </main>
    </div>
  )
}
