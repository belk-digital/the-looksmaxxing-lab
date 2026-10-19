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
      slug: 'stack-research-peptides-safe-combinations-avoid',
      title: 'Stacking Research Peptides: Safe Combinations',
      subtitle: 'Mechanistic breakdown of BPC-157 angiogenesis and cellular repair pathways',
    },
  ],
  'tb-500': [
    {
      slug: 'stack-research-peptides-safe-combinations-avoid',
      title: 'Stacking Research Peptides: Safe Combinations',
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
    {
      slug: 'glp-3-peptide-triple-agonist-research-guide',
      title: 'GLP-3 Peptide: Triple Receptor Agonism',
      subtitle: 'Mechanism of action, receptor targets, and what researchers need to know in 2026',
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
    {
      slug: 'glp-3-peptide-triple-agonist-research-guide',
      title: 'GLP-3 Peptide: Triple Receptor Agonism',
      subtitle: 'Mechanism of action, receptor targets, and what researchers need to know in 2026',
    },
  ],
  'glp-3rta-spray': [
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
    {
      slug: 'tesamorelin-vs-retatrutide-visceral-fat-research',
      title: 'Tesamorelin vs. GLP-3 (Rt): Visceral Fat Research',
      subtitle: 'Comparing GHRH analog and triple agonist approaches to visceral adipose research',
    },
  ],
  'glp-3rta': [
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
    {
      slug: 'tesamorelin-vs-retatrutide-visceral-fat-research',
      title: 'Tesamorelin vs. GLP-3 (Rt): Visceral Fat Research',
      subtitle: 'Comparing GHRH analog and triple agonist approaches to visceral adipose research',
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
      slug: 'mots-c-dosage-reconstitution-research-guide',
      title: 'MOTS-c Dosage & Reconstitution Research Guide',
      subtitle: 'Dosage protocols, reconstitution math, storage, and administration research',
    },
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'HPG axis regulation and mitochondrial signaling in female physiology research',
    },
    {
      slug: 'peptide-reconstitution-storage-guide',
      title: 'Peptide Reconstitution & Storage Guide',
      subtitle: 'Bacteriostatic water, concentration math, and shelf life after reconstitution',
    },
    {
      slug: 'peptide-coa-hplc-purity-testing-guide',
      title: 'How to Read a Peptide COA',
      subtitle: 'HPLC purity %, LC-MS identity, and endotoxin results explained for researchers',
    },
  ],
  'epithalon': [
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'Longevity peptide stacking in female hormonal-metabolic axis research',
    },
  ],
  'reconstitution-solution': [
    {
      slug: 'peptide-reconstitution-storage-guide',
      title: 'Peptide Reconstitution & Storage Guide',
      subtitle: 'How to store reconstitution solution: bacteriostatic water, concentration math, shelf life',
    },
    {
      slug: 'peptide-coa-hplc-purity-testing-guide',
      title: 'How to Read a Peptide COA',
      subtitle: 'HPLC purity %, LC-MS identity, and endotoxin results explained for researchers',
    },
    {
      slug: 'why-peptide-purity-matters-in-scientific-research',
      title: 'Why Peptide Purity Matters in Research',
      subtitle: 'How to read HPLC purity figures, mass spec identity data, and spot an unreliable supplier',
    },
  ],
  'nad-plus': [
    {
      slug: 'nad-plus-peptide-mitochondrial-sirtuin-research-guide',
      title: 'NAD+ Mitochondrial & Sirtuin Research Guide',
      subtitle: 'Mitochondrial ATP production, sirtuin and PARP pathways, and age-related NAD+ decline',
    },
    {
      slug: 'nad-vs-nmn-vs-nr-research-comparison',
      title: 'NAD+ vs. NMN vs. NR: Research Comparison',
      subtitle: 'Comparative review of NAD+ precursors in cellular energy and longevity research',
    },
  ],
  'nad-plus-500mg-1000mg-45-sprays': [
    {
      slug: 'nad-plus-peptide-mitochondrial-sirtuin-research-guide',
      title: 'NAD+ Mitochondrial & Sirtuin Research Guide',
      subtitle: 'Mitochondrial ATP production, sirtuin and PARP pathways, and age-related NAD+ decline',
    },
    {
      slug: 'nad-vs-nmn-vs-nr-research-comparison',
      title: 'NAD+ vs. NMN vs. NR: Research Comparison',
      subtitle: 'Comparative review of NAD+ precursors in cellular energy and longevity research',
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

  'bpc-157-spray': [
    {
      slug: 'stack-research-peptides-safe-combinations-avoid',
      title: 'Stacking Research Peptides: Safe Combinations',
      subtitle: 'Mechanistic differences between BPC-157 angiogenic and TB-500 actin-modulating pathways',
    },
  ],
  'cjc-1295-no-dac-10mg-spray': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'cjc-ipamorelin-5mg-5mg-spray': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'epithalon-10mg-50mg-45-sprays': [
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'Longevity peptide stacking in female hormonal-metabolic axis research',
    },
  ],
  'ghk-cu-50mg-100mg-45-sprays': [
    {
      slug: 'ghk-cu-pharmacokinetics',
      title: 'The Pharmacokinetics of GHK-Cu',
      subtitle: 'Fibroblast activation, collagen synthesis, and clinical implications',
    },
  ],
  'ipamorelin-5mg-10mg-45-sprays': [
    {
      slug: 'cjc-1295-ipamorelin-muscle-recovery-research',
      title: 'CJC-1295 + Ipamorelin: GH Axis Research',
      subtitle: 'Growth hormone secretagogue stack for muscle recovery and body composition',
    },
  ],
  'kisspeptin-10mg-45-sprays': [
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'HPG axis regulation and mitochondrial signaling in female physiology research',
    },
  ],
  'melanotan-ii-10mg-45-sprays': [
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
  'mots-c-10mg-40mg-45-sprays': [
    {
      slug: 'mots-c-dosage-reconstitution-research-guide',
      title: 'MOTS-c Dosage & Reconstitution Research Guide',
      subtitle: 'Dosage protocols, reconstitution math, storage, and administration research',
    },
    {
      slug: 'kisspeptin-mots-c-hormonal-metabolic-research',
      title: 'Kisspeptin-10 & MOTS-C: Hormonal-Metabolic Axis',
      subtitle: 'HPG axis regulation and mitochondrial signaling in female physiology research',
    },
  ],
  'tirzepatide-10mg-20mg-30mg-60mg-45-sprays': [
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
    {
      slug: 'glp-3-peptide-triple-agonist-research-guide',
      title: 'GLP-3 Peptide: Triple Receptor Agonism',
      subtitle: 'Mechanism of action, receptor targets, and what researchers need to know in 2026',
    },
  ],
  'semax-spray': [
    {
      slug: 'semax-nasal-spray-dosing-mixing-storage-guide',
      title: 'Semax Nasal Spray: Dosing, Mixing & Storage',
      subtitle: 'Reconstitution protocol, concentration math, and intranasal administration guide',
    },
  ],
  'semax-10mg-30mg-90-sprays': [
    {
      slug: 'semax-nasal-spray-dosing-mixing-storage-guide',
      title: 'Semax Nasal Spray: Dosing, Mixing & Storage',
      subtitle: 'Reconstitution protocol, concentration math, and intranasal administration guide',
    },
  ],
  'semax-selank': [
    {
      slug: 'semax-nasal-spray-dosing-mixing-storage-guide',
      title: 'Semax Nasal Spray: Dosing, Mixing & Storage',
      subtitle: 'Reconstitution protocol, concentration math, and intranasal administration guide',
    },
  ],
  'semax-selank-10mg-10mg-90-sprays': [
    {
      slug: 'semax-nasal-spray-dosing-mixing-storage-guide',
      title: 'Semax Nasal Spray: Dosing, Mixing & Storage',
      subtitle: 'Reconstitution protocol, concentration math, and intranasal administration guide',
    },
  ],
  'bpc-tb-500': [
    {
      slug: 'bpc-157-tb-500-synergy',
      title: 'BPC-157 + TB-500: Synergy Research',
      subtitle: 'Mechanistic differences between BPC-157 angiogenesis and TB-500 actin pathways',
    },
    {
      slug: 'stack-research-peptides-safe-combinations-avoid',
      title: 'Stacking Research Peptides: Safe Combinations',
      subtitle: 'How BPC-157 and TB-500 are studied together in soft tissue repair models',
    },
    {
      slug: 'peptide-reconstitution-storage-guide',
      title: 'Peptide Reconstitution & Storage Guide',
      subtitle: 'Bacteriostatic water, concentration math, and correct storage temperature',
    },
    {
      slug: 'peptide-coa-hplc-purity-testing-guide',
      title: 'How to Read a Peptide COA',
      subtitle: 'HPLC purity %, LC-MS identity, and endotoxin results explained for researchers',
    },
  ],
  'glutathione': [
    {
      slug: 'glutathione-skin-systematic-review-2026',
      title: 'Glutathione Skin Research: 2026 Systematic Review',
      subtitle: 'Findings from 194 studies on topical, oral, and injectable glutathione',
    },
    {
      slug: 'peptide-coa-hplc-purity-testing-guide',
      title: 'How to Read a Peptide COA',
      subtitle: 'HPLC purity %, LC-MS identity, and endotoxin results explained for researchers',
    },
    {
      slug: 'endotoxin-lal-testing-peptide-coa',
      title: 'Endotoxin & LAL Testing on a Peptide COA',
      subtitle: 'Why the endotoxin row matters and what <1 EU/mg means for research quality',
    },
  ],
  'klow-blend': [
    {
      slug: 'bpc-157-tb-500-synergy',
      title: 'BPC-157 + TB-500: Synergy Research',
      subtitle: 'Mechanistic differences between BPC-157 angiogenesis and TB-500 actin pathways',
    },
    {
      slug: 'ghk-cu-pharmacokinetics',
      title: 'The Pharmacokinetics of GHK-Cu',
      subtitle: 'Fibroblast activation, collagen synthesis, and clinical implications',
    },
  ],
  'klow-80mg-45-sprays': [
    {
      slug: 'bpc-157-tb-500-synergy',
      title: 'BPC-157 + TB-500: Synergy Research',
      subtitle: 'Mechanistic differences between BPC-157 angiogenesis and TB-500 actin pathways',
    },
    {
      slug: 'ghk-cu-pharmacokinetics',
      title: 'The Pharmacokinetics of GHK-Cu',
      subtitle: 'Fibroblast activation, collagen synthesis, and clinical implications',
    },
  ],

}
