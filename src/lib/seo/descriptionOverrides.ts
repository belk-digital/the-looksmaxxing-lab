import { buildDescription } from './buildMetadata'

/**
 * Hand-written meta descriptions (<= 160 chars, complete sentences) for pages whose
 * CMS/source text has no clean way to fit a search snippet. Each is condensed only from
 * facts already present in that page's own copy. Keyed by URL path; takes precedence
 * over the CMS value. Pages not listed here use their source text if a whole-sentence
 * fit exists (see buildDescription).
 */
export const DESCRIPTION_OVERRIDES: Record<string, string> = {
  // ---- Products: spray formats ----
  '/products/kpv-10mg-45-sprays': 'KPV (Lys-Pro-Val), a synthetic tripeptide from the C-terminal α-MSH sequence, studied in melanocortin and NF-κB research. 10mg, 45 sprays. Research use only.',
  '/products/klow-80mg-45-sprays': 'KLOW 80mg blend of GHK-Cu, KPV, BPC-157 and TB-500 for preclinical research on copper biology, melanocortin signaling and actin. 45 sprays. Research use only.',
  '/products/kisspeptin-10mg-45-sprays': 'Kisspeptin, a family of KISS1-derived signaling peptides studied in KISS1R/GPR54, GnRH neuron and HPG-axis research. 10mg, 45 sprays. Research use only.',
  '/products/ipamorelin-5mg-10mg-45-sprays': 'Ipamorelin, a synthetic pentapeptide growth hormone secretagogue studied in ghrelin receptor and pituitary research. 5mg and 10mg, 45 sprays. Research use only.',
  '/products/igf-lr3-1mg-45-sprays': 'IGF-LR3, a modified 83-amino-acid IGF-1 analogue with reduced binding protein affinity, studied in IGF1R cell signaling. 1mg, 45 sprays. Research use only.',
  '/products/hcg-5000iu-10000iu-45-sprays': 'HCG, a heterodimeric glycoprotein gonadotropin hormone studied in LHCGR signaling and reproductive endocrinology research. 5000 and 10000 IU, 45 sprays.',
  '/products/h-frag-5mg-45-sprays': 'H Frag, a synthetic fragment of human growth hormone residues 176–191, studied in lipid metabolism and adipose biology. 5mg, 45 sprays. Research use only.',
  '/products/glow-70mg-45-sprays': 'GLOW 70mg blend of GHK-Cu, BPC-157 and TB-500 for research on extracellular matrix biology, cellular signaling and tissue models. 45 sprays. Research use only.',
  '/products/ghrp-6-10mg-45-sprays': 'GHRP-6, a synthetic hexapeptide growth hormone secretagogue studied in ghrelin receptor and pituitary signaling research. 10mg, 45 sprays. Research use only.',
  '/products/ghrp-2-100mg-45-sprays': 'GHRP-2, a synthetic hexapeptide growth hormone secretagogue studied in ghrelin receptor and pituitary signaling research. 100mg, 45 sprays. Research use only.',
  '/products/ghk-cu-50mg-100mg-45-sprays': 'GHK-Cu, a copper-binding tripeptide complex studied in extracellular matrix biology and gene-expression research. 50mg and 100mg, 45 sprays. Research use only.',
  '/products/epithalon-10mg-50mg-45-sprays': 'Epithalon, a synthetic AEDG tetrapeptide studied in cellular aging, telomere-related mechanisms and pineal biology research. 10mg and 50mg, 45 sprays.',
  '/products/dsip-10mg-90-sprays': 'DSIP (Delta Sleep-Inducing Peptide), a nonapeptide studied in sleep-related biology and neuroendocrine research. 10mg spray, 90 sprays. Research use only.',
  '/products/bpc-157-spray': 'BPC-157 spray, a synthetic pentadecapeptide (CAS 137525-51-0) in 5mg and 10mg formats, 45 sprays each. Batch COA available. For laboratory research use only.',
  '/products/aod-9604-spray': 'AOD-9604 spray, a synthetic C-terminal hGH fragment (CAS 221231-10-3) in 5mg and 10mg formats, 45 sprays each. For laboratory research use only.',
  '/products/semax-spray': 'Semax spray, a research-grade nootropic neuropeptide in spray format, studied in BDNF modulation and neuroprotective signaling research. COA-verified.',

  // ---- Products: vials ----
  '/products/tirzepatide': 'Tirzepatide, a synthetic dual GIP/GLP-1 receptor agonist studied in incretin pharmacology and metabolic signaling research. 10, 20, 30 and 60mg vials.',
  '/products/5-amino-1mq': '5-Amino-1MQ 50mg, a synthetic small-molecule NNMT inhibitor supplied for in-vitro and analytical laboratory use. >99% purity with batch COA available.',
  '/products/vip': 'VIP (Vasoactive Intestinal Peptide), a synthetic 28-amino-acid neuropeptide studied in VPAC1/VPAC2 receptor and neuroendocrine research. 10mg vial.',
  '/products/snap-8': 'SNAP-8 (Acetyl Octapeptide-3), a synthetic peptide studied in SNARE complex assembly and synaptic vesicle fusion research. 10mg and 20mg vials.',
  '/products/pt-141': 'PT-141 (Bremelanotide), a synthetic cyclic melanocortin receptor agonist studied in MC1R, MC3R and MC4R pharmacology research. 10mg vial.',
  '/products/melanotan-1': 'Melanotan I (afamelanotide), a synthetic linear α-MSH analogue studied in melanocortin receptor pharmacology and melanogenesis research. 10mg vial.',
  '/products/l-carnitine': 'L-Carnitine, a quaternary ammonium compound studied in mitochondrial fatty acid transport and cellular energy metabolism research. 400mg vial.',
  '/products/igf-1-lr3': 'IGF-1 LR3, a synthetic 83-amino-acid IGF-1 analogue studied in IGF-1 receptor signaling and PI3K/AKT/mTOR pathway research. 1mg vial.',
  '/products/ghrp-6': 'GHRP-6, a synthetic hexapeptide ghrelin receptor agonist studied in GHSR-1a pharmacology and pituitary somatotroph signaling research. 10mg vial.',
  '/products/cjc-1295-w-dac': 'CJC-1295 with DAC, a synthetic albumin-binding GHRH analogue studied in GHRH receptor engagement and pituitary biology research. 5mg vial.',
  '/products/cagrilintide': 'Cagrilintide, a synthetic long-acting amylin analogue studied in amylin receptor pharmacology and satiety biology research. 10mg vial.',
  '/products/ara-290': 'ARA-290, a synthetic 11-amino-acid peptide derived from erythropoietin, studied in innate repair receptor signaling research. 10mg vial.',
  '/products/aod-9604': 'AOD-9604, a synthetic 16-amino-acid fragment of human growth hormone (176–191) studied in lipolysis signaling research. 5mg and 10mg vials.',
  '/products/ahk-cu': 'AHK-Cu, a copper-binding tripeptide studied in copper metallopeptide chemistry and extracellular matrix signaling research. 50mg and 100mg vials.',
  '/products/thymosin-alpha-1': 'Thymosin Alpha-1, a 28-amino-acid thymic peptide studied in T-cell maturation and innate and adaptive immune signaling research. 10mg vial.',
  '/products/ss-31': 'SS-31 (Elamipretide), a mitochondria-targeted tetrapeptide studied in mitochondrial membrane integrity and cellular bioenergetics research. 10mg and 50mg vials.',
  '/products/pinealon': 'Pinealon, a synthetic tripeptide bioregulator at 99%+ purity, studied in neuroprotection, retinal function and pineal signaling research.',
  '/products/sermorelin': 'Sermorelin, a synthetic 29-amino-acid GHRH analogue studied in GHRH receptor pharmacology and pituitary signaling research. 10mg and 20mg vials.',
  '/products/semax-selank': 'Semax/Selank blend, 10mg of each in one research vial, studied in neuropeptide signaling, BDNF pathway and GABAergic biology research.',
  '/products/oxytocin': 'Oxytocin, a cyclic nonapeptide neuropeptide hormone studied in oxytocin receptor signaling and neuroendocrine regulation research. 10mg vial.',
  '/products/ll-37': 'LL-37, a synthetic 37-amino-acid human cathelicidin antimicrobial peptide studied in innate immune signaling and antimicrobial biology research. 1mg vial.',
  '/products/kpv': 'KPV, a synthetic tripeptide from the C-terminal α-MSH sequence, studied in melanocortin receptor signaling and NF-κB pathway research. 10mg vial.',
  '/products/kisspeptin': 'Kisspeptin (KP-10), a synthetic 10-amino-acid neuropeptide studied in KISS1R/GPR54 pharmacology and GnRH pulse research. 10mg vial.',
  '/products/ghk-cu': 'GHK-Cu, a naturally occurring copper-binding tripeptide studied in copper metallopeptide chemistry and extracellular matrix research. 50mg and 100mg vials.',
  '/products/cjc-1295-no-dac': 'CJC-1295 No DAC (Modified GRF 1-29), a synthetic GHRH analogue studied in GHRH receptor signaling and pituitary biology research. 10mg vial.',
  '/products/bpc-tb-500': 'BPC-157 + TB-500 blend in a single research vial, studied in angiogenesis, actin dynamics and tissue biology models. For laboratory research use only.',
  '/products/bpc-157': 'BPC-157, a synthetic 15-amino-acid peptide fragment studied in tendon and ligament biology and nitric oxide signaling research. 5mg and 10mg vials.',
  '/products/tesamorelin': 'Tesamorelin, a synthetic 44-amino-acid GHRH analogue studied in GHRH receptor pharmacology and pituitary signaling research. 10mg and 20mg vials.',
  '/products/semax': 'Semax, a synthetic heptapeptide analogue of ACTH(4–7) studied in neuropeptide signaling and BDNF expression research. 10mg and 30mg vials.',
  '/products/nad-plus': 'NAD⁺, a naturally occurring coenzyme studied in cellular energy metabolism, sirtuin biology and mitochondrial function research. 500mg and 1000mg vials.',
  '/products/melanotan-ii': 'Melanotan II, a synthetic cyclic heptapeptide α-MSH analogue studied in melanocortin receptor pharmacology and melanogenesis research. 10mg vial.',
  '/products/ipamorelin': 'Ipamorelin, a synthetic pentapeptide GH secretagogue studied in GHSR-1a pharmacology and pulsatile GH secretion models. 5mg and 10mg vials.',
  '/products/glutathione': 'Glutathione (GSH), a naturally occurring tripeptide antioxidant studied in oxidative stress biology and redox cycling research. 600mg and 1500mg vials.',
  '/products/epithalon': 'Epithalon, a synthetic tetrapeptide studied in telomerase activation, telomere biology and pineal peptide pharmacology research. 10mg and 50mg vials.',
  '/products/glow-blend': 'GLOW 70mg blend of GHK-Cu (50mg), BPC-157 (10mg) and TB-500 (10mg), studied in copper metallopeptide chemistry and extracellular matrix models.',
  '/products/semaglutide': 'Semaglutide, a synthetic fatty acid-conjugated GLP-1 receptor agonist studied in GLP-1R pharmacology and incretin signaling. 5, 10, 20 and 30mg vials.',

  // ---- Journal ----
  '/journal/mt-2-nasal-spray-dosage-administration-research-protocol': 'No clinical trial has established intranasal MT-2 dosing. A review of what the subcutaneous literature shows and where the claims break down.',
  '/journal/sourcing-nad-research-compound-coa-purity-checks': 'A checklist for sourcing NAD+ research compounds: how to read a COA, what a purity figure excludes, and why lot traceability matters most.',
  '/journal/oxytocin-research-mechanism-social-bonding-pathways': "Oxytocin's receptor mechanism, documented social-bonding and stress-regulation research, and the evidence-based limits of “love hormone” claims.",
  '/journal/ghk-cu-pharmacokinetics': 'A cited review of how GHK-Cu interacts with dermal fibroblasts, modulates the extracellular matrix and up-regulates collagen synthesis in research settings.',
  '/journal/glp-1-tissue-laxity': 'How GLP-1 and GIP receptor agonists such as semaglutide and tirzepatide affect adipocytes and the extracellular matrix: the science behind “GLP-1 face”.',
  '/journal/bpc-157-tb-500-synergy': 'The mechanistic differences between BPC-157 (angiogenic signaling) and TB-500 (actin up-regulation) in soft tissue repair research models.',
  '/journal/kisspeptin-mots-c-hormonal-metabolic-research': 'A review of Kisspeptin-10 (HPG-axis regulator) and MOTS-C (mitochondrial-derived peptide) and why they are studied together in female physiology models.',
  '/journal/tesamorelin-vs-retatrutide-visceral-fat-research': 'Comparing Tesamorelin (a GHRH analog) and GLP-3 (Rt) (a GLP-1/GIP/glucagon triple agonist) in visceral fat and female-physiology body composition research.',
  '/journal/cjc-1295-ipamorelin-muscle-recovery-research': 'A mechanistic guide to CJC-1295 (GHRH analog) and Ipamorelin (ghrelin receptor agonist) and their dual-pathway GH stimulation in muscle recovery research.',
  '/journal/peptide-coa-hplc-purity-testing-guide': "A researcher's guide to Certificates of Analysis: how HPLC measures purity, how mass spectrometry confirms identity, and how to spot an unreliable supplier.",
  '/journal/peptide-reconstitution-storage-guide': 'A guide to reconstituting lyophilized research peptides, calculating concentration and storing compounds correctly to preserve molecular integrity.',
  '/journal/glp-3-rt-peptide-triple-agonist-research-guide': 'A guide to GLP-3 (Rt), the GLP-1/GIP/glucagon triple agonist: molecular architecture, receptor pharmacology, Phase 2/3 evidence and research-grade sourcing.',
  '/journal/mots-c-peptide-mitochondrial-exercise-mimetic-research': 'A research guide to MOTS-c, the mitochondrial-derived exercise mimetic peptide: AMPK activation, nuclear translocation, preclinical metabolic data and sourcing.',
  '/journal/glp-3-peptide-triple-agonist-research-guide': 'What is GLP-3 peptide? A research guide to the triple GLP-1/GIP/glucagon receptor agonist: mechanism, receptor biology, preclinical data and sourcing standards.',
  '/journal/semaglutide-vs-tirzepatide-vs-glp-3-comparison': 'A structural and mechanistic comparison of single, dual and triple incretin receptor agonists: molecular architecture, trial data and sourcing standards.',
  '/journal/nad-plus-peptide-mitochondrial-sirtuin-research-guide': 'A research guide to NAD+ coenzyme biology: mitochondrial ATP production, sirtuin and PARP pathways, age-related decline and research-grade sourcing standards.',
}

/** Override for this path if one exists, otherwise a whole-sentence fit of the source text. */
export function resolveDescription(path: string, raw: string, maxLen = 160): string {
  return DESCRIPTION_OVERRIDES[path] ?? buildDescription(raw, maxLen, path)
}
