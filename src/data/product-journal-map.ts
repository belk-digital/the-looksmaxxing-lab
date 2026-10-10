export type JournalLinkEntry = {
  slug: string
  title: string
  subtitle: string
}

/**
 * Maps product slugs to contextually relevant static journal posts.
 * Only strongly relevant, dedicated articles are included — no incidental mentions.
 * Products absent from this map receive only the two generic guide links
 * (COA guide + reconstitution guide) that appear on every product page.
 */
export const PRODUCT_JOURNAL_MAP: Record<string, JournalLinkEntry[]> = {
  'bpc-157': [
    {
      slug: 'bpc-157-tb-500-synergy',
      title: 'BPC-157 vs. TB-500: Angiogenesis & Healing',
      subtitle: 'Mechanistic breakdown of BPC-157 angiogenesis and cellular repair pathways',
    },
  ],
  'tb-500': [
    {
      slug: 'bpc-157-tb-500-synergy',
      title: 'BPC-157 vs. TB-500: Angiogenesis & Healing',
      subtitle: 'How TB-500 drives cellular motility and tissue repair alongside BPC-157',
    },
  ],
  'ghk-cu': [
    {
      slug: 'ghk-cu-pharmacokinetics',
      title: 'The Pharmacokinetics of GHK-Cu',
      subtitle: 'Fibroblast activation, collagen synthesis, and clinical implications',
    },
  ],
  'semaglutide': [
    {
      slug: 'glp-1-tissue-laxity',
      title: 'GLP-1 Agonists & Tissue Laxity',
      subtitle: 'How GLP-1/GIP receptor agonists affect subcutaneous fat and skin structure',
    },
    {
      slug: 'semaglutide-vs-tirzepatide-vs-glp-3-comparison',
      title: 'Semaglutide vs. Tirzepatide vs. GLP-3',
      subtitle: 'Head-to-head comparison of single, dual, and triple receptor agonists',
    },
  ],
  'tirzepatide': [
    {
      slug: 'glp-1-tissue-laxity',
      title: 'GLP-1 Agonists & Tissue Laxity',
      subtitle: 'How GLP-1/GIP receptor agonists affect subcutaneous fat and skin structure',
    },
    {
      slug: 'semaglutide-vs-tirzepatide-vs-glp-3-comparison',
      title: 'Semaglutide vs. Tirzepatide vs. GLP-3',
      subtitle: 'Head-to-head comparison of single, dual, and triple receptor agonists',
    },
  ],
  'retatrutide-10mg-20mg-30mg-60mg-45-sprays': [
    {
      slug: 'glp-3-rt-peptide-triple-agonist-research-guide',
      title: 'GLP-3 (Rt): Complete Research Guide',
      subtitle: 'GLP-1/GIP/glucagon triple agonist — mechanism, evidence, and sourcing standards',
    },
    {
      slug: 'semaglutide-vs-tirzepatide-vs-glp-3-comparison',
      title: 'Semaglutide vs. Tirzepatide vs. GLP-3',
      subtitle: 'Head-to-head comparison of single, dual, and triple receptor agonists',
    },
  ],
  'tesamorelin': [
    {
      slug: 'tesamorelin-vs-retatrutide-visceral-fat-research',
      title: 'Tesamorelin vs. GLP-3 (Rt): Visceral Fat Research',
      subtitle: 'Comparing GHRH analog and triple agonist approaches to visceral adipose research',
    },
  ],
  'kisspeptin': [
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'HPG axis regulation and mitochondrial signaling in female physiology research',
    },
  ],
  'mots-c': [
    {
      slug: 'mots-c-peptide-mitochondrial-exercise-mimetic-research',
      title: 'MOTS-C: Mitochondrial Signaling & AMPK Activation',
      subtitle: 'Exercise mimetic research, nuclear translocation, and metabolic regulation',
    },
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'HPG axis regulation and mitochondrial signaling in female physiology research',
    },
  ],
  'epithalon': [
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'Longevity peptide stacking in female hormonal-metabolic axis research',
    },
  ],
  'nad-plus': [
    {
      slug: 'nad-plus-peptide-mitochondrial-sirtuin-research-guide',
      title: 'NAD+ Research: Mitochondrial Function & Sirtuins',
      subtitle: 'ATP production, DNA repair, sirtuin pathway, and age-related NAD+ decline',
    },
  ],
  'cjc-1295-no-dac': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'ipamorelin': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'cjc-ipamorelin': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'mt2-spray': [
    {
      slug: 'mt-2-nasal-spray-dosage-administration-research-protocol',
      title: 'MT-2 Nasal Spray: Dosage & Protocol',
      subtitle: 'Subcutaneous literature, reconstitution math, and intranasal delivery science',
    },
    {
      slug: 'melanotan-2-research-status-legal-safety-profile',
      title: 'Melanotan II: Research Status & Safety',
      subtitle: 'Mechanism, documented safety signals, regulatory status, and MT-I comparison',
    },
  ],
  'melanotan-ii': [
    {
      slug: 'melanotan-2-research-status-legal-safety-profile',
      title: 'Melanotan II: Research Status & Safety',
      subtitle: 'Mechanism, documented safety signals, regulatory status, and MT-I comparison',
    },
    {
      slug: 'mt-2-nasal-spray-dosage-administration-research-protocol',
      title: 'MT-2 Nasal Spray: Dosage & Protocol',
      subtitle: 'Subcutaneous literature, reconstitution math, and intranasal delivery science',
    },
  ],
  'semax': [
    {
      slug: 'semax-nasal-spray-dosing-mixing-storage-guide',
      title: 'Semax Nasal Spray: Dosing, Mixing & Storage',
      subtitle: 'Reconstitution protocol, concentration math, and intranasal administration guide',
    },
  ],

}
