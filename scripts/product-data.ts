// ──────────────────────────────────────────────
// Product Data — All products from products.md
// ──────────────────────────────────────────────

interface ProductVariant {
  sku: string
  price: number
  salePrice?: number
  stock: number
  options: { key: string; value: string }[]
}

interface ProductFaq {
  question: string
  answer: string
}

export interface ProductDef {
  name: string
  slug: string
  description: string
  seoTitle: string
  seoDescription: string
  price: number
  salePrice?: number
  stock?: number
  sku?: string
  hasVariants?: boolean
  variants?: ProductVariant[]
  categoryNames?: string[]
  productDetailsTitle?: string
  productDetailsDescription: string
  researchFocusTitle?: string
  researchFocusDescription: string
  qualityPurityTitle?: string
  qualityPurityDescription: string
  complianceNoticeTitle?: string
  complianceNoticeDescription: string
  faqs: ProductFaq[]
  status?: 'active' | 'draft' | 'archived'
}

// ──────────────────────────────────────────────
// Shared templates
// ──────────────────────────────────────────────

const COMPLIANCE = `This product is strictly for research and laboratory use only. It is not approved by the FDA or any global regulatory body for human consumption, veterinary use, or therapeutic application. The purchaser assumes all responsibility for the proper handling, storage, and application of this compound. It must only be handled by qualified professionals in a controlled laboratory setting. By purchasing this product, you agree to abide by all local and international laws regarding the use of research chemicals.`

function qualityTemplate(name: string): string {
  return `Every batch of ${name} is synthesized using Solid-Phase Peptide Synthesis (SPPS) and purified via preparative HPLC to eliminate truncated sequences and synthesis byproducts. Final identity confirmation is performed via Electrospray Ionization Mass Spectrometry (ESI-MS), verifying exact molecular weight. Each lot ships with a Certificate of Analysis documenting purity exceeding 99%, giving researchers traceable, batch-specific verification before use in any laboratory protocol.`
}

function mkVariant(sku: string, price: number, label: string, stock = 500): ProductVariant {
  return { sku, price, stock, options: [{ key: 'Size', value: label }] }
}

// ──────────────────────────────────────────────
// Products WITH .md content
// ──────────────────────────────────────────────

const tirzepatide: ProductDef = {
  name: 'Tirzepatide',
  slug: 'tirzepatide',
  seoTitle: 'Tirzepatide | Research-Grade GLP-1/GIP Peptide, COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy 99%+ pure Tirzepatide research peptide, a dual GIP/GLP-1 receptor agonist. HPLC/LC-MS verified, COA-backed, lyophilized. Strictly for laboratory research use.',
  price: 60,
  hasVariants: true,
  variants: [
    mkVariant('TIRZ-10MG', 60, '10mg'),
    mkVariant('TIRZ-20MG', 82, '20mg'),
    mkVariant('TIRZ-30MG', 122, '30mg'),
    mkVariant('TIRZ-60MG', 175, '60mg'),
  ],
  categoryNames: ['research use only'],
  description: `Tirzepatide is a synthetic dual GIP and GLP-1 receptor agonist (LY3298176) representing a milestone in incretin-based peptide research. This high-purity sequence is engineered for stability and precise molecular integrity across demanding laboratory conditions. Researchers investigating metabolic regulation, appetite signaling, glucose homeostasis, and insulin sensitivity will find this compound an indispensable reference standard. Each batch is synthesized using automated solid-phase peptide synthesis and purified by High-Performance Liquid Chromatography (HPLC) to isolate the target molecule from truncated sequences and synthesis impurities. The resulting lyophilized powder demonstrates exceptional solubility and reconstitution consistency across experimental protocols. Its state-of-the-art lyophilization preserves shelf-life and structural conformation, supporting reproducible data in longitudinal in-vitro work. Whether conducting preliminary binding-affinity assays or complex receptor-signaling analyses, this compound delivers the precision required by academic and independent institutions worldwide.`,
  productDetailsDescription: `Tirzepatide is a research-grade GIP/GLP-1 dual agonist prized for sequence fidelity and structural purity. This lyophilized formulation is optimized for precise reconstitution and reproducible laboratory application.`,
  researchFocusDescription: `Targeting two incretin receptors simultaneously, this dual-agonist sequence supports research into metabolic pathways, energy balance, and receptor signaling, engineered for maximum structural integrity under testing conditions.`,
  qualityPurityDescription: `Each peptide is produced via automated Solid Phase Peptide Synthesis (SPPS), yielding 99%+ purity confirmed by independent third-party HPLC and LC-MS analysis with a batch-specific Certificate of Analysis.`,
  complianceNoticeDescription: `This product is sold strictly as a research chemical for laboratory use only. It is not a drug and is not intended for human consumption, diagnosis, or therapeutic use.`,
  faqs: [
    { question: 'What is Tirzepatide?', answer: 'Tirzepatide (research code LY3298176) is a synthetic peptide and dual incretin receptor agonist. It activates both the GIP and GLP-1 receptors, making it a widely studied reference compound in metabolic and incretin biology research.' },
    { question: 'Is Tirzepatide a peptide?', answer: 'Yes. Tirzepatide is a 39-amino-acid synthetic peptide with a C20 fatty diacid chain that enables albumin binding and extended stability, which is why it is a popular subject in peptide pharmacology studies.' },
    { question: 'How does Tirzepatide work as a dual agonist?', answer: 'Tirzepatide binds and activates two separate incretin receptors, GIP and GLP-1, simultaneously. This dual mechanism is the focus of research into glucose homeostasis, insulin signaling, and appetite regulation pathways.' },
    { question: 'What makes Tirzepatide different from Semaglutide?', answer: 'Semaglutide is a single GLP-1 receptor agonist, while Tirzepatide is a dual GIP/GLP-1 agonist. Researchers study Tirzepatide specifically to compare single-receptor versus dual-receptor activation in metabolic models.' },
    { question: 'What purity is this Tirzepatide?', answer: 'This Tirzepatide is ≥99% pure, verified by third-party HPLC and LC-MS testing. A batch-specific Certificate of Analysis (COA) documents purity, identity, and mass for full traceability.' },
    { question: 'How should Tirzepatide be stored?', answer: 'Lyophilized Tirzepatide should be stored sealed at -20°C, protected from light and moisture. After reconstitution, it should be kept refrigerated and used within the timeframe indicated by your research protocol.' },
    { question: 'Is Tirzepatide COA-verified?', answer: 'Yes. Every batch ships with a Certificate of Analysis from independent laboratory testing, confirming the compound meets the stated 99%+ purity standard for research applications.' },
    { question: 'What are Tirzepatide research applications?', answer: 'It is used in laboratory research on metabolic regulation, incretin biology, receptor signaling, glucose metabolism, and body composition models. It is strictly for in-vitro and non-human research use only.' },
  ],
}

const retatrutide: ProductDef = {
  name: 'Retatrutide',
  slug: 'retatrutide',
  seoTitle: 'Retatrutide | Research-Grade Triple Agonist Peptide | The Looksmaxxing Lab',
  seoDescription: 'Explore Retatrutide — a high-purity, COA-verified research peptide targeting GLP-1, GIP, and glucagon receptors. Lyophilized, batch-tested. Research use only.',
  price: 100,
  hasVariants: true,
  variants: [
    mkVariant('RETA-10MG', 100, '10mg'),
    mkVariant('RETA-20MG', 155, '20mg'),
    mkVariant('RETA-30MG', 185, '30mg'),
    mkVariant('RETA-60MG', 300, '60mg'),
  ],
  categoryNames: ['research use only'],
  description: `Retatrutide 10mg is a synthetic research peptide designed for laboratory investigation of multi-receptor hormonal signaling. Classified as a triple agonist compound, it simultaneously targets three distinct metabolic receptors: glucagon-like peptide-1 (GLP-1), glucose-dependent insulinotropic polypeptide (GIP), and glucagon. This receptor profile makes it one of the most pharmacologically complex peptides available within the research peptide field. Each vial contains lyophilized Retatrutide powder, synthesized via solid-phase peptide synthesis and subjected to third-party HPLC purity verification. COA documentation is provided with every batch. This compound is strictly intended for in vitro and preclinical research. It is not approved for human consumption, veterinary use, or therapeutic application.`,
  productDetailsDescription: `Retatrutide is a long-chain synthetic peptide comprising 39 amino acids. Unlike earlier incretin mimetics, its sequence is engineered to generate balanced, simultaneous activity across three separate receptor classes — GLP-1, GIP, and glucagon — within a single molecular construct. This architecture is what separates it from dual agonists like tirzepatide and single-target compounds like semaglutide. The compound exhibits a molecular weight of approximately 4,531 g/mol and is presented in lyophilized form to maximize shelf stability under standard cold-chain storage conditions. The defining characteristic of Retatrutide is its capacity to activate three incretin and counter-regulatory hormone receptors simultaneously. Researchers investigating downstream metabolic signaling, energy homeostasis, and neuroendocrine feedback mechanisms will find its multi-pathway profile valuable for comparative pharmacological analysis.`,
  researchFocusDescription: `Research applications for Retatrutide center on its utility as a multi-receptor pharmacological probe within metabolic science. Its triple agonist activity enables investigators to study convergent hormonal signaling at the intersection of incretin biology, counter-regulatory feedback, and energy balance. Preclinical literature has explored the compound's downstream effects on body weight regulation, adipose tissue remodeling, and hepatic lipid metabolism in animal models. Retatrutide's distinct agonist ratios across GLP-1, GIP, and glucagon pathways make it a valuable comparator compound against dual agonists in receptor selectivity studies. Emerging preclinical models have examined GLP-1 and GIP receptor pathways in the context of neuronal survival, synaptic plasticity, and hypothalamic energy sensing.`,
  qualityPurityDescription: `Every batch of Retatrutide undergoes independent high-performance liquid chromatography (HPLC) analysis prior to release. HPLC remains the gold standard for peptide purity assessment in research settings, providing precise quantification of the target compound against potential impurities, truncated sequences, and synthesis byproducts. We guarantee ≥99% purity on all Retatrutide products. This analysis is performed by independent third-party laboratories with no affiliation to our production process. Raw HPLC chromatograms and purity calculations are documented within the Certificate of Analysis supplied with each order.`,
  complianceNoticeDescription: `Retatrutide is manufactured and sold exclusively for research purposes under Research Use Only (RUO) classification. This product has not been evaluated or approved by the U.S. Food and Drug Administration (FDA), the European Medicines Agency (EMA), or any equivalent national regulatory body. It is not approved for human consumption, veterinary treatment, or therapeutic application of any kind. By purchasing this product, the buyer confirms that they are a qualified researcher using this compound exclusively for in vitro or preclinical research.`,
  faqs: [
    { question: 'What is Retatrutide?', answer: 'Retatrutide (LY3437943) is a synthetic research peptide designed to simultaneously activate three hormone receptors: GLP-1, GIP, and glucagon. This triple agonist profile distinguishes it from other incretin-based research compounds. It is a 39-amino acid lyophilized peptide intended exclusively for laboratory research.' },
    { question: 'How does Retatrutide work?', answer: 'Retatrutide engages GLP-1, GIP, and glucagon receptors through its engineered amino acid sequence. Each receptor interaction initiates distinct downstream intracellular signaling cascades relevant to metabolic research.' },
    { question: 'What is a triple agonist peptide?', answer: 'A triple agonist peptide is a compound engineered to activate three different receptor targets simultaneously within a single molecular structure. Retatrutide allows researchers to study the convergent effects of incretin and counter-regulatory hormone signaling pathways without administering three separate compounds.' },
    { question: 'What receptors does Retatrutide target?', answer: 'Retatrutide targets three distinct hormone receptors: the GLP-1 receptor, the GIP receptor, and the glucagon receptor. Each belongs to the class B GPCR family and plays a role in metabolic regulation.' },
    { question: 'What are Retatrutide research applications?', answer: 'Research applications include metabolic pathway modeling, obesity biology investigation, hepatic glucose output studies, adipose tissue remodeling assays, and neuroendocrine signaling research.' },
    { question: 'How is Retatrutide purity verified?', answer: 'Each batch undergoes independent third-party HPLC analysis to verify purity prior to release. We guarantee a minimum purity of ≥99% for all Retatrutide products. Purity data is documented in the Certificate of Analysis supplied with every order.' },
    { question: 'How should Retatrutide be stored?', answer: 'Lyophilized Retatrutide should be stored at –20°C to maintain long-term stability. Avoid repeated freeze-thaw cycles. Once reconstituted, store at 4°C for a maximum of 7 days.' },
    { question: 'Is Retatrutide safe for human use?', answer: 'No. Retatrutide from The Looksmaxxing Lab is strictly classified as a Research Use Only (RUO) compound. It is not approved by the FDA, EMA, or any regulatory authority for human consumption or therapeutic use.' },
  ],
}

const glowBlend: ProductDef = {
  name: 'Glow Blend',
  slug: 'glow-blend',
  seoTitle: 'Glow Blend | Research-Grade Skin & Collagen Peptide Blend | The Looksmaxxing Lab',
  seoDescription: 'Glow Blend is a COA-verified research peptide blend formulated for skin regeneration, collagen synthesis, and extracellular matrix research. HPLC tested. Research use only.',
  price: 123,
  categoryNames: ['research use only'],
  description: `Glow Blend is a premium research-grade peptide blend formulated for laboratory investigation of skin regeneration biology, collagen synthesis pathways, and extracellular matrix signaling. Combining individually COA-verified component peptides into a single lyophilized preparation, Glow is engineered for researchers studying the convergent molecular mechanisms that govern cellular renewal, dermal tissue integrity, and oxidative stress response in controlled experimental settings. Each vial delivers the GLOW blend in lyophilized powder form, independently verified to ≥99% aggregate purity by third-party HPLC analysis. A full Certificate of Analysis is supplied with every batch. This compound is classified Research Use Only (RUO) and is intended exclusively for in vitro and preclinical laboratory research.`,
  productDetailsDescription: `Glow Blend is a proprietary multi-peptide research blend developed specifically for advanced laboratory investigation of dermal biology, skin barrier integrity, and collagen pathway signaling. Unlike single-entity research compounds, a peptide blend enables researchers to study synergistic receptor interactions and compound downstream signaling effects. Each component peptide is synthesized individually via SPPS and subjected to rigorous independent HPLC purity verification before blending, ensuring ≥99% purity.`,
  researchFocusDescription: `The primary research applications driving interest in GLOW center on its utility as a multi-pathway substrate for in vitro investigation of collagen biology and extracellular matrix dynamics. Oxidative stress is a primary driver of ECM degradation and reduced fibroblast viability in skin biology research models. GLOW's formulation targets the intersection of regenerative pathways with antioxidant defense signaling.`,
  qualityPurityDescription: `Every batch of Glow Blend is synthesized using SPPS, subjecting the resulting lyophilized blend to independent third-party HPLC analysis before release. We guarantee ≥99% aggregate purity across the full GLOW formulation. Third-party verification is a structural commitment — by routing all purity analysis through independent certified laboratories, we remove confirmation bias from the quality control chain.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Glow Blend?', answer: 'Glow Blend is a research-grade multi-peptide blend developed for laboratory investigation of skin regeneration, collagen synthesis, and extracellular matrix signaling pathways. It is classified Research Use Only (RUO).' },
    { question: 'What is a peptide blend?', answer: 'A peptide blend combines multiple distinct peptide compounds into a single preparation, enabling simultaneous study of converging signaling pathways within the same experimental system.' },
    { question: 'What research applications does Glow Blend support?', answer: 'Applications include collagen synthesis assays, extracellular matrix remodeling studies, MMP activity experiments, oxidative stress and antioxidant signaling research, keratinocyte proliferation assays, and wound healing studies.' },
    { question: 'How is Glow Blend tested for purity?', answer: 'Every batch undergoes independent third-party HPLC analysis guaranteeing minimum 99% aggregate purity. Results are documented in the Certificate of Analysis included with every order.' },
    { question: 'How should Glow Blend be stored?', answer: 'Store lyophilized Glow at -20°C, dry and protected from light. Once reconstituted in sterile water or PBS (pH 7.0-7.4), use within 24-48 hours or store at 4°C.' },
    { question: 'Is Glow Blend approved for human or cosmetic use?', answer: 'No. Glow Blend is a Research Use Only compound not approved by the FDA or any regulatory authority for human consumption, cosmetic application, or therapeutic use.' },
  ],
}

const cjcIpamorelin: ProductDef = {
  name: 'CJC-1295 / Ipamorelin',
  slug: 'cjc-ipamorelin',
  seoTitle: 'CJC-1295 + Ipamorelin | Research-Grade GHS Peptide Blend | The Looksmaxxing Lab',
  seoDescription: 'CJC-1295 + Ipamorelin — COA-verified research peptide blend targeting GHRH and ghrelin receptors for growth hormone secretagogue research. HPLC tested. Research use only.',
  price: 73,
  hasVariants: true,
  variants: [
    mkVariant('CJC-IPA-5-5', 73, '5mg/5mg'),
  ],
  categoryNames: ['research use only'],
  description: `CJC-1295 + Ipamorelin is a research-grade growth hormone secretagogue (GHS) blend combining two distinct peptide mechanisms into a single lyophilized preparation. CJC-1295 is a synthetic analogue of growth hormone releasing hormone (GHRH) that acts at pituitary GHRH receptors. Ipamorelin is a selective growth hormone secretagogue receptor (GHSR) agonist — functionally a ghrelin mimetic. Together, these two compounds target the somatotropic axis through complementary mechanisms, making their combination a widely studied research design in growth hormone biology. Each vial is verified to ≥99% individual purity by third-party HPLC analysis before blending. This product is classified Research Use Only (RUO).`,
  productDetailsDescription: `CJC-1295 is a synthetic analogue of GHRH, specifically a modified version of GHRH (1-29). CJC-1295 acts at pituitary GHRH receptors (GHRHR) to stimulate growth hormone secretion via Gs protein coupling and adenylate cyclase activation. Ipamorelin is a pentapeptide (711.9 g/mol) and a highly selective agonist at GHSR-1a — the canonical ghrelin receptor. The combination reflects a dual-mechanism hypothesis: simultaneous activation of GHRH receptor and ghrelin receptor produces synergistic GH secretion exceeding what either compound achieves alone.`,
  researchFocusDescription: `Research applications center on dual-mechanism pharmacological probes for the hypothalamic-pituitary somatotropic axis. Comparative pharmacology studies examining CJC-1295 and Ipamorelin individually versus in combination provide experimental data on receptor crosstalk and synergy dynamics. Sleep physiology research represents a distinct GHS research territory, as Ipamorelin's selectivity for GHSR-1a without significant cortisol or prolactin co-stimulation has made it a tool compound in preclinical studies.`,
  qualityPurityDescription: `Each component is synthesized separately via SPPS and subjected to independent third-party HPLC analysis before co-lyophilization. This component-first quality architecture ensures purity is verified at the individual compound level. We guarantee ≥99% purity for each component individually. The certifying laboratory's name, HPLC methodology, and testing date for each component are documented on the Certificate of Analysis.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is CJC-1295?', answer: 'CJC-1295 is a synthetic GHRH analog (modified GHRH 1-29) that acts at pituitary GHRH receptors via Gs/cAMP signaling to stimulate growth hormone secretion. Modified residues provide DPP-IV resistance. Classified Research Use Only.' },
    { question: 'What is Ipamorelin?', answer: 'Ipamorelin is a selective pentapeptide GHSR-1a agonist (ghrelin mimetic, 711.9 g/mol) that stimulates GH release via Gq/Ca2+/PKC signaling with minimal off-target activity at ACTH/cortisol or prolactin axes.' },
    { question: 'Why are CJC-1295 and Ipamorelin studied in combination?', answer: 'They activate different GH-stimulating receptors (GHRHR and GHSR-1a) via distinct signaling pathways that converge on GH secretion. Researchers study the combination to investigate potential synergistic GH secretory responses.' },
    { question: 'What are CJC-1295 + Ipamorelin research applications?', answer: 'Applications include dual-mechanism GH pharmacology assays, GHRHR vs. GHSR-1a synergy studies, GH/IGF-1 axis research, sleep-associated GH pulse biology, and GHSR receptor selectivity profiling.' },
    { question: 'How is purity verified?', answer: 'Each component undergoes independent third-party HPLC analysis guaranteeing minimum 99% purity per compound before co-lyophilization. Full chromatograms and certifying laboratory details are in the COA.' },
    { question: 'How should it be stored?', answer: 'Store lyophilized blend at -20°C, dry and protected from light. Reconstitute in bacteriostatic water or sterile PBS. Once reconstituted, store at 4°C and use within 7 days.' },
    { question: 'Is it approved for human use?', answer: 'No. This is a Research Use Only (RUO) compound not approved by the FDA or any regulatory authority for human consumption, therapeutic use, or performance application.' },
  ],
}

const epithalon: ProductDef = {
  name: 'Epithalon',
  slug: 'epithalon',
  seoTitle: 'Epithalon | Research-Grade Longevity & Telomere Peptide | The Looksmaxxing Lab',
  seoDescription: 'Epithalon (Epitalon) — a high-purity, COA-verified research tetrapeptide for telomere biology, cellular aging, and longevity research. Third-party HPLC tested. Research use only.',
  price: 58,
  hasVariants: true,
  variants: [
    mkVariant('EPITH-10MG', 58, '10mg'),
    mkVariant('EPITH-50MG', 93, '50mg'),
  ],
  categoryNames: ['research use only'],
  description: `Epithalon (also known as Epitalon) is a research-grade synthetic tetrapeptide — Ala-Glu-Asp-Gly — derived from the endogenous polypeptide Epithalamin, which is produced by the pineal gland. It is one of the most studied longevity-focused research peptides in the published literature, with preclinical research examining its role in telomerase activation, telomere elongation, cellular senescence modulation, and age-associated neuroendocrine regulation. Each vial contains lyophilized Epithalon peptide, synthesized via SPPS and independently verified to ≥99% purity by third-party HPLC analysis. This compound is classified Research Use Only (RUO).`,
  productDetailsDescription: `Epithalon is a synthetic tetrapeptide with the amino acid sequence Ala-Glu-Asp-Gly (AEDG) and a molecular weight of 390.35 g/mol. Developed by Professor Vladimir Khavinson at the St. Petersburg Institute of Bioregulation and Gerontology as a synthetic analogue of Epithalamin. The primary biological context driving research interest is its reported interaction with telomere homeostasis — specifically its putative capacity to stimulate telomerase (hTERT) expression and activity in somatic cell models.`,
  researchFocusDescription: `The primary research applications center on cellular aging biology, telomere homeostasis research, and senescence pathway investigation. In vitro applications include hTERT gene expression assays, telomere length quantification assays, and senescence-associated beta-galactosidase staining studies. Comparative pharmacology studies contrasting Epithalon with other longevity-associated research peptides — such as SS-31 or MOTS-C — benefit from Epithalon's well-documented preclinical publication record.`,
  qualityPurityDescription: `Every batch undergoes independent third-party HPLC analysis prior to release. As a tetrapeptide, Epithalon is subject to specific synthesis quality considerations. Our ≥99% purity guarantee reflects the resolution of the complete chromatographic profile. All purity testing is conducted by certified third-party laboratories entirely independent of our production process.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Epithalon (Epitalon)?', answer: 'Epithalon is a synthetic tetrapeptide (Ala-Glu-Asp-Gly / AEDG, 390.35 g/mol) developed as a synthetic analogue of the pineal-derived polypeptide Epithalamin. It is studied for reported effects on telomerase expression and cellular aging biology. Classified Research Use Only.' },
    { question: 'What are telomeres?', answer: 'Telomeres are TTAGGG repeat sequences that protect chromosome ends and shorten with each cell division, driving replicative senescence. Epithalon is studied for reported effects on telomerase (hTERT) expression in cell culture models.' },
    { question: 'What are Epithalon research applications?', answer: 'Applications include hTERT gene expression assays, telomere length quantification, senescence-associated beta-galactosidase studies, oxidative stress and telomere attrition research, and pineal gland bioregulation studies.' },
    { question: 'How is Epithalon purity verified?', answer: 'Every batch undergoes independent third-party HPLC analysis guaranteeing minimum 99% purity, resolving the AEDG sequence from truncated byproducts and synthesis residues.' },
    { question: 'How should Epithalon be stored?', answer: 'Store lyophilized Epithalon at -20°C, dry and protected from light. Reconstitute in sterile water or PBS (pH 7.0-7.4). Once reconstituted, store at 4°C and use within 7 days.' },
    { question: 'Is Epithalon approved for human use?', answer: 'No. Epithalon is a Research Use Only (RUO) compound not approved by the FDA or any regulatory authority for human consumption or therapeutic use.' },
  ],
}

const glutathione: ProductDef = {
  name: 'Glutathione',
  slug: 'glutathione',
  seoTitle: 'Glutathione | Premium Laboratory-Grade Antioxidant | COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy research-grade reduced Glutathione compound with COA-verified 99%+ purity. HPLC-tested, batch-traceable, research use only.',
  price: 58,
  hasVariants: true,
  variants: [
    mkVariant('GLUT-600MG', 58, '600mg'),
    mkVariant('GLUT-1500MG', 78, '1500mg'),
  ],
  categoryNames: ['research use only'],
  description: `Glutathione is a naturally occurring tripeptide antioxidant studied extensively in laboratory research for its central role in cellular antioxidant defense, redox homeostasis, and oxidative stress regulation. Our research-grade Glutathione is manufactured in its reduced form, the biologically active state most relevant to redox biology investigations, with each batch verified for purity and molecular integrity before release. Investigators studying free radical scavenging, detoxification pathways, and cellular protection mechanisms rely on consistent, high-purity material to generate reproducible results. Every vial is lyophilized and sealed under conditions designed to preserve stability during storage and shipping. This compound is intended strictly for in-vitro and laboratory research use by qualified professionals.`,
  productDetailsDescription: `Research-grade Glutathione represents a benchmark in antioxidant compound purification. Each batch is purified via preparative HPLC to isolate the reduced form from oxidized glutathione and related synthesis byproducts, preserving the thiol group responsible for its antioxidant activity. Final identity and molecular weight are confirmed through Electrospray Ionization Mass Spectrometry (ESI-MS). The lyophilized powder offers superior shelf stability compared to liquid formulations.`,
  researchFocusDescription: `Glutathione research centers on its function as the primary intracellular antioxidant, with investigators examining how it neutralizes free radicals and supports redox balance across various cellular environments. Current literature points to its relevance in oxidative stress research, detoxification pathway studies, and cellular protection models. Researchers frequently study glutathione alongside other antioxidant compounds to evaluate comparative free-radical scavenging capacity and depletion-repletion dynamics under simulated oxidative load.`,
  qualityPurityDescription: `Every Glutathione batch is purified through preparative HPLC to isolate the reduced form and remove oxidized variants and synthesis byproducts. Final identity confirmation is performed via ESI-MS, verifying exact molecular weight. Each lot ships with a Certificate of Analysis documenting purity exceeding 99%.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Glutathione?', answer: 'Glutathione is a research-grade, reduced-form antioxidant compound studied for its central role in cellular antioxidant defense and redox balance. It is manufactured to strict purity standards and intended exclusively for scientific research.' },
    { question: 'What is Reduced Glutathione?', answer: 'Reduced glutathione is the biologically active form, distinguished by an intact thiol group that allows it to donate electrons and neutralize free radicals. It is the form most relevant to antioxidant and redox biology research.' },
    { question: 'How does Glutathione work?', answer: 'Research indicates glutathione functions as the body\'s primary intracellular antioxidant, neutralizing reactive oxygen species and supporting detoxification pathways by donating electrons through its thiol group.' },
    { question: 'What research applications does Glutathione have?', answer: 'Glutathione is studied in research contexts involving oxidative stress, free radical scavenging, cellular detoxification pathways, and redox homeostasis.' },
    { question: 'How should Glutathione be stored?', answer: 'Lyophilized glutathione should be stored at 2–8°C, protected from light and moisture, until reconstitution to preserve molecular stability and prevent premature oxidation.' },
    { question: 'Is Glutathione intended for human use?', answer: 'No. Glutathione is sold strictly for research and laboratory use only. It has not been evaluated or approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const ipamorelin: ProductDef = {
  name: 'Ipamorelin',
  slug: 'ipamorelin',
  seoTitle: 'Ipamorelin | Research-Grade Growth Hormone Secretagogue | COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy Ipamorelin research-grade growth hormone secretagogue peptide with COA-verified 99%+ purity. HPLC-tested, batch-traceable, research use only.',
  price: 49,
  hasVariants: true,
  variants: [
    mkVariant('IPA-5MG', 49, '5mg'),
    mkVariant('IPA-10MG', 68, '10mg'),
  ],
  categoryNames: ['research use only'],
  description: `Ipamorelin is a research peptide classified as a growth hormone secretagogue, studied for its selective interaction with ghrelin receptor pathways and downstream endocrine signaling. Our research-grade Ipamorelin is synthesized to exacting laboratory standards, with each batch verified for purity and structural integrity before release. Investigators studying growth hormone release mechanisms, receptor-specific binding kinetics, and recovery-linked signaling rely on consistent, high-purity material. Every vial is lyophilized and sealed under conditions designed to preserve molecular stability. This compound is intended strictly for in-vitro and laboratory research applications by qualified professionals.`,
  productDetailsDescription: `Research-grade Ipamorelin represents a benchmark in selective secretagogue peptide synthesis. Each batch is produced using SPPS and purified via preparative HPLC. Final identity and molecular weight are confirmed through ESI-MS. Laboratories examining receptor selectivity often compare Ipamorelin against other growth hormone-releasing peptides to isolate its distinct binding profile.`,
  researchFocusDescription: `Ipamorelin research centers on its proposed role as a selective ghrelin receptor agonist, with investigators examining how it stimulates growth hormone release without the broader cortisol or prolactin elevation associated with less selective secretagogues. Its comparatively clean receptor profile makes it a useful candidate for dose-response titration studies and comparative pharmacological mapping.`,
  qualityPurityDescription: qualityTemplate('Ipamorelin'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Ipamorelin?', answer: 'Ipamorelin is a research-grade peptide classified as a growth hormone secretagogue studied for its selective interaction with ghrelin receptor pathways. Manufactured to strict purity standards for research use only.' },
    { question: 'How does Ipamorelin work?', answer: 'Research indicates Ipamorelin acts as a selective ghrelin receptor agonist, stimulating growth hormone release through a targeted signaling mechanism without significantly affecting cortisol or prolactin levels.' },
    { question: 'What is a growth hormone secretagogue?', answer: 'A growth hormone secretagogue is a compound studied for its ability to stimulate growth hormone release from the pituitary gland by interacting with specific receptors such as the ghrelin receptor.' },
    { question: 'How should Ipamorelin be stored?', answer: 'Lyophilized Ipamorelin should be stored at 2–8°C, protected from light and moisture, until reconstitution.' },
    { question: 'Is Ipamorelin intended for human use?', answer: 'No. Ipamorelin is sold strictly for research and laboratory use only. Not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const motsC: ProductDef = {
  name: 'MOTS-C',
  slug: 'mots-c',
  seoTitle: 'MOTS-C | Research-Grade Mitochondrial Peptide | COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy research-grade MOTS-C with COA-verified 99%+ purity. HPLC-tested, US-based, lab-quality mitochondrial peptide for research use only.',
  price: 68,
  hasVariants: true,
  variants: [
    mkVariant('MOTSC-10MG', 68, '10mg'),
    mkVariant('MOTSC-40MG', 133, '40mg'),
  ],
  categoryNames: ['research use only'],
  description: `MOTS-C is a 16-amino-acid mitochondrial-derived peptide (MDP) encoded within the mitochondrial genome, positioning it at the center of modern bioenergetics and metabolic regulation research. Our research-grade MOTS-C is synthesized to exacting laboratory standards, with each batch verified for purity and structural integrity before release. Investigators studying cellular energy production, AMPK pathway activation, and exercise-linked metabolic adaptation rely on consistent, high-purity material. Every vial is lyophilized and sealed under conditions designed to preserve molecular stability. This compound is intended strictly for in-vitro and laboratory research applications by qualified professionals.`,
  productDetailsDescription: `Research-grade MOTS-C represents a benchmark in mitochondrial peptide synthesis. Each batch is produced using SPPS and purified via preparative HPLC. Final identity and molecular weight are confirmed through ESI-MS. Independent laboratories handling sensitive peptide-binding assays depend on this level of synthesis precision, particularly when comparing MOTS-C against other mitochondrial-derived peptides such as Humanin or SS-31.`,
  researchFocusDescription: `MOTS-C research centers on its proposed role as a mitochondrial-to-nuclear signaling molecule, with investigators examining how it interfaces with AMPK activation and downstream metabolic transcription factors. Current literature points to its relevance in cellular energy homeostasis, exercise physiology, and adaptive stress response models. Its comparatively rapid binding kinetics make it a useful candidate for dose-response titration studies and comparative pharmacological profiling.`,
  qualityPurityDescription: qualityTemplate('MOTS-C'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is MOTS-C?', answer: 'MOTS-C is a 16-amino-acid mitochondrial-derived peptide (MDP) encoded by mitochondrial DNA. It is studied for its proposed role in cellular energy regulation, metabolic signaling, and exercise-linked physiological adaptation.' },
    { question: 'How does MOTS-C work?', answer: 'Research suggests MOTS-C functions as a signaling peptide that travels from the mitochondria to the nucleus, where it may influence AMPK pathway activation and downstream metabolic gene expression.' },
    { question: 'What is a mitochondrial-derived peptide?', answer: 'A mitochondrial-derived peptide is a small protein fragment encoded within mitochondrial DNA. These peptides are believed to participate in cell-to-cell and organelle-to-nucleus signaling related to metabolism and stress response.' },
    { question: 'What are MOTS-C research applications?', answer: 'Applications include mitochondrial signaling studies, AMPK pathway investigation, skeletal muscle metabolism models, and longevity-focused cellular aging research.' },
    { question: 'How should MOTS-C be stored?', answer: 'Lyophilized MOTS-C should be stored at 2–8°C, protected from light and moisture, until reconstitution.' },
    { question: 'Is MOTS-C approved for human use?', answer: 'No. MOTS-C is sold strictly for research and laboratory use only. Not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const mt2: ProductDef = {
  name: 'Melanotan II',
  slug: 'melanotan-ii',
  seoTitle: 'MT-2 10mg | Research-Grade Melanocortin Peptide (Melanotan 2) | The Looksmaxxing Lab',
  seoDescription: 'MT-2 (Melanotan 2) — a high-purity, COA-verified melanocortin research peptide targeting MC1R and MC4R receptors. HPLC tested, lyophilized. Research use only.',
  price: 53,
  categoryNames: ['research use only'],
  description: `MT-2 10mg is a research-grade preparation of Melanotan 2, a synthetic cyclic heptapeptide analogue of alpha-melanocyte stimulating hormone (α-MSH). MT-2 is designed for laboratory investigation of melanocortin receptor signaling, pigmentation biology, and the downstream neuroendocrine effects of MC1R and MC4R receptor activation. Each vial contains 10mg of lyophilized MT-2 peptide, synthesized via SPPS and independently verified to ≥99% purity by third-party HPLC analysis. A Certificate of Analysis is included with every batch. This compound is classified Research Use Only (RUO).`,
  productDetailsDescription: `MT-2 (Melanotan 2) is a synthetic cyclic heptapeptide with the amino acid sequence Ac-Nle-c[Asp-His-D-Phe-Arg-Trp-Lys]-NH₂. With a molecular weight of approximately 1024.2 g/mol, it was developed as a metabolically stable analogue of α-MSH. MT-2 exhibits agonist activity at multiple melanocortin receptor subtypes (MCR), binding with high affinity to MC1R — the primary receptor mediating melanogenesis — and demonstrating significant activity at MC3R, MC4R, and MC5R.`,
  researchFocusDescription: `The primary research application is its role as a pharmacological probe for melanocortin receptor-mediated pigmentation pathways. MC1R is the canonical receptor governing eumelanin synthesis in melanocytes. Beyond pigmentation, MT-2's activity at MC4R has made it relevant in preclinical research examining hypothalamic energy homeostasis signaling. Researchers use MT-2 as a tool to probe receptor-dependent versus receptor-independent effects in comparative pharmacology designs.`,
  qualityPurityDescription: `Every batch of MT-2 undergoes independent third-party HPLC analysis prior to release. We guarantee a minimum purity of ≥99% for all MT-2 preparations. Third-party testing eliminates the confirmation bias inherent in manufacturer-performed testing and provides researchers with an independently defensible purity claim.`,
  complianceNoticeDescription: `MT-2 10mg (Melanotan 2) is manufactured and supplied exclusively for scientific research purposes under Research Use Only (RUO) classification. It is not approved for human consumption, veterinary treatment, cosmetic application, or therapeutic use of any kind. The Looksmaxxing Lab makes no therapeutic or cosmetic claims in connection with MT-2.`,
  faqs: [
    { question: 'What is MT-2 (Melanotan 2)?', answer: 'MT-2 is a synthetic cyclic heptapeptide analogue of alpha-melanocyte stimulating hormone (α-MSH) used in laboratory research to study melanocortin receptor signaling, pigmentation biology, and neuroendocrine pathways. Classified Research Use Only.' },
    { question: 'How does MT-2 work?', answer: 'MT-2 activates melanocortin receptors (MC1R, MC3R, MC4R, MC5R), triggering intracellular cAMP signaling cascades. MC1R activation in melanocytes initiates melanin production through MITF upregulation.' },
    { question: 'What receptors does MT-2 target?', answer: 'MT-2 targets MC1R (pigmentation), MC3R (energy balance), MC4R (hypothalamic neuroendocrine signaling), and MC5R (exocrine gland research). All are class A GPCRs that signal through cAMP.' },
    { question: 'What is the difference between MT-2 and Melanotan 1?', answer: 'MT-2 is a cyclic heptapeptide with broad MCR activity. Melanotan 1 (afamelanotide) is a linear tridecapeptide with greater MC1R selectivity and reduced MC4R activity.' },
    { question: 'How should MT-2 be stored?', answer: 'Lyophilized MT-2 should be stored at –20°C, protected from moisture and light. Once reconstituted, store at 4°C and use within 7 days.' },
    { question: 'Is MT-2 approved for human use?', answer: 'No. MT-2 is a Research Use Only compound not approved by the FDA or any regulatory authority for human consumption, cosmetic use, or therapeutic treatment.' },
  ],
}

const nadPlus: ProductDef = {
  name: 'NAD+',
  slug: 'nad-plus',
  seoTitle: 'NAD+ | Research-Grade Cellular Energy Compound | The Looksmaxxing Lab',
  seoDescription: 'NAD+ — high-purity, COA-verified Nicotinamide Adenine Dinucleotide for advanced cellular energy, mitochondrial function, and longevity research. Research use only.',
  price: 63,
  hasVariants: true,
  variants: [
    mkVariant('NAD-500MG', 63, '500mg'),
    mkVariant('NAD-1000MG', 103, '1000mg'),
  ],
  categoryNames: ['research use only'],
  description: `NAD+ is a high-purity research-grade preparation of Nicotinamide Adenine Dinucleotide — one of the most fundamentally important coenzymes in cellular biochemistry. Present in every living cell, NAD+ serves as an essential electron carrier in oxidative metabolism and a critical substrate for enzymes governing cellular repair, energy homeostasis, and longevity-associated signaling pathways. This preparation is synthesized to research-grade specifications and subjected to independent third-party HPLC analysis confirming ≥99% purity per batch. It is intended exclusively for in vitro and preclinical laboratory research.`,
  productDetailsDescription: `Nicotinamide Adenine Dinucleotide (NAD+) is a dinucleotide composed of adenine and nicotinamide nucleotides joined by a phosphoanhydride bridge. With a molecular weight of 663.43 g/mol, it exists in two interconvertible redox states: NAD+ (oxidized) and NADH (reduced). In research settings, NAD+ is valued for its role as both a coenzyme and a signaling molecule — driving redox chemistry while simultaneously acting as a substrate for regulatory enzymes including sirtuins, PARPs, and CD38.`,
  researchFocusDescription: `Research applications are broad across bioenergetics, mitochondrial biology, and metabolic science. Among the most studied research territories is its role as the obligatory substrate for sirtuin deacylase enzymes (SIRT1–7). PARP enzyme research represents a further application domain — PARP-1 and related family members are major consumers of cellular NAD+ recruited to sites of DNA damage. Researchers studying mitochondrial respiratory chain function use exogenous NAD+ as a substrate to probe electron transport efficiency.`,
  qualityPurityDescription: `Every batch of NAD+ is independently analyzed by third-party laboratories using HPLC prior to release. We guarantee a minimum purity of ≥99% on all NAD+ preparations. Third-party verification eliminates the confirmation bias inherent in in-house quality assurance and provides a defensible, documented purity claim.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is NAD+?', answer: 'NAD+ (Nicotinamide Adenine Dinucleotide) is a coenzyme found in every living cell, functioning as an electron carrier in cellular respiration and a substrate for regulatory enzymes including sirtuins and PARPs.' },
    { question: 'Why is NAD+ important in longevity research?', answer: 'NAD+ intracellular concentration declines with age, correlating with reduced sirtuin activity, impaired mitochondrial function, and diminished DNA repair capacity.' },
    { question: 'What are NAD+ research applications?', answer: 'Applications include cellular bioenergetics assays, mitochondrial respiration studies, sirtuin enzyme kinetics, PARP activity and DNA repair modeling, NAD+ pool quantification, and metabolic flux analysis.' },
    { question: 'What is the difference between NAD+ and NMN?', answer: 'NAD+ is the biologically active coenzyme directly involved in cellular redox reactions. NMN is a precursor molecule that cells convert to NAD+ via enzymatic synthesis. They are not interchangeable as research substrates.' },
    { question: 'How should NAD+ be stored?', answer: 'Store lyophilized NAD+ at –20°C, dry and protected from light. Once reconstituted in sterile water or PBS, use within 24–48 hours or store at 4°C.' },
    { question: 'Is NAD+ approved for human use?', answer: 'No. NAD+ from The Looksmaxxing Lab is a Research Use Only compound not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const selank: ProductDef = {
  name: 'Selank',
  slug: 'selank',
  seoTitle: 'Selank | Research-Grade Nootropic Neuropeptide, COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy 99%+ pure Selank research peptide, a synthetic tuftsin analog studied for neurotransmitter regulation, GABA-A modulation, and neural signaling research. Research use only.',
  price: 58,
  categoryNames: ['research use only'],
  description: `Selank is a synthetic heptapeptide derived from the immunomodulatory tetrapeptide tuftsin and one of the most extensively studied neuropeptides in neurotransmitter and cognitive neuroscience research. This high-purity sequence offers unparalleled stability and molecular integrity. Researchers investigating GABAergic signaling pathways, neurotransmitter metabolism, enkephalinase inhibition, and stress-response neurophysiology will find this compound an essential research asset. Each batch is synthesized using automated SPPS and purified by HPLC. The resulting lyophilized powder demonstrates exceptional solubility and reconstitution consistency across experimental protocols. This compound is intended strictly for in-vitro and laboratory research use.`,
  productDetailsDescription: `Selank 10mg is a research-grade nootropic neuropeptide formed by appending the tripeptide Pro-Gly-Pro to the C-terminus of tuftsin (Thr-Lys-Pro-Arg), producing a stable heptapeptide with markedly improved resistance to enzymatic degradation compared to its parent compound. Researchers studying GABAergic neurotransmitter regulation, enkephalinase inhibition, and CNS signaling consistently depend on its uniform reconstitution and batch-to-batch reproducibility.`,
  researchFocusDescription: `Selank's research applications center on GABAergic neurotransmission, enkephalinase inhibition, serotonin metabolism, and stress-axis neurophysiology within the central nervous system. As a tuftsin analog, Selank is studied for its proposed capacity to modulate the activity of enzymes responsible for breaking down endogenous opioid and regulatory neuropeptides. It is a widely used comparator in studies contrasting nootropic neuropeptides such as Semax and research compounds like Cerebrolysin.`,
  qualityPurityDescription: `Our peptides are synthesized using automated Solid-Phase Peptide Synthesis (SPPS) to yield an ultra-pure final product. Subsequent purification by preparative HPLC eliminates truncated sequences and deletion impurities. Final verification is achieved through ESI-MS, confirming the exact molecular mass. We guarantee 99%+ purity, documented in a batch-specific COA.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Selank?', answer: 'Selank is a synthetic heptapeptide derived from tuftsin, with a C-terminal Pro-Gly-Pro extension that enhances enzymatic stability. It is one of the most referenced neuropeptides in GABAergic signaling and neurotransmitter regulation research.' },
    { question: 'Is Selank a nootropic peptide?', answer: 'Selank is widely classified as a nootropic neuropeptide in research literature due to its studied interactions with GABAergic neurotransmission, enkephalinase inhibition, and serotonin metabolism.' },
    { question: 'How does Selank differ from Semax?', answer: 'Both are synthetic neuropeptides but originate from different parent compounds. Semax is derived from ACTH 4–7 and is studied for BDNF modulation. Selank is a tuftsin analog studied for GABAergic and enkephalinase pathways.' },
    { question: 'What purity standards does Selank meet?', answer: 'Every batch is guaranteed at ≥99% purity, verified by preparative HPLC and ESI-MS. A batch-specific Certificate of Analysis documents purity grade and molecular identity.' },
    { question: 'How should Selank be stored?', answer: 'Store lyophilized Selank sealed at -20°C, protected from moisture and light. Once reconstituted, refrigerate at 2–8°C.' },
    { question: 'Is Selank intended for human use?', answer: 'No. Selank is a research chemical for laboratory use only. Not approved for human consumption or therapeutic application.' },
  ],
}

const semax: ProductDef = {
  name: 'Semax',
  slug: 'semax',
  seoTitle: 'Semax | Research-Grade Nootropic Peptide, COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy 99%+ pure Semax research peptide, a synthetic ACTH analog studied for neurobiology and brain signaling research. HPLC/ESI-MS verified. Research use only.',
  price: 58,
  hasVariants: true,
  variants: [
    mkVariant('SEMAX-10MG', 58, '10mg'),
    mkVariant('SEMAX-30MG', 93, '30mg'),
  ],
  categoryNames: ['research use only'],
  description: `Semax is a synthetic heptapeptide derived from a fragment of adrenocorticotropic hormone (ACTH 4–7) and one of the most widely referenced neuropeptides in cognitive and neurobiology research. This high-purity sequence offers unparalleled stability and molecular integrity. Researchers investigating neural signaling pathways, BDNF upregulation, neuroprotection, and synaptic plasticity mechanisms will find this compound essential. Each batch is synthesized using automated SPPS and purified by HPLC. The resulting lyophilized powder demonstrates exceptional solubility and reconstitution consistency. This compound is intended strictly for in-vitro and laboratory research use.`,
  productDetailsDescription: `Semax is a research-grade nootropic peptide derived from the ACTH 4–7 Pro-Gly-Pro extension, valued for its stability against enzymatic degradation. Unlike its parent ACTH fragment, Semax is engineered for extended bioavailability in in-vitro models. Researchers studying neural signaling, brain-derived neurotrophic factor (BDNF) modulation, and neuroprotection consistently rely on its batch-to-batch uniformity.`,
  researchFocusDescription: `Semax's primary research applications center on central nervous system signaling, BDNF pathway modulation, neuroprotection, and cognitive neurophysiology. As a synthetic ACTH analog, Semax is studied for its capacity to interact with melanocortin receptors and influence downstream neurotrophin cascades, including the upregulation of BDNF in neuronal cell models. It is also a widely used comparator in studies contrasting neuropeptides such as Selank.`,
  qualityPurityDescription: `Our peptides are synthesized using SPPS to yield an ultra-pure final product. Subsequent purification by preparative HPLC eliminates truncated sequences and deletion impurities. Final verification is achieved through ESI-MS, confirming the exact molecular mass. We guarantee 99%+ purity, documented in a batch-specific COA.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Semax?', answer: 'Semax is a synthetic heptapeptide derived from ACTH 4–7 with a C-terminal Pro-Gly-Pro extension. It is one of the most widely studied neuropeptides in cognitive neuroscience research.' },
    { question: 'Is Semax a nootropic peptide?', answer: 'Semax is commonly classified as a nootropic peptide due to its documented interactions with brain-derived neurotrophic factor (BDNF) and central nervous system signaling in laboratory models.' },
    { question: 'How does Semax work in research models?', answer: 'In research models, Semax is studied for its capacity to interact with melanocortin receptors and modulate BDNF expression, synaptic plasticity, and neuroprotective pathways.' },
    { question: 'What purity standards does Semax meet?', answer: 'Every batch is guaranteed at ≥99% purity, verified by preparative HPLC and ESI-MS. A batch-specific Certificate of Analysis documents purity and molecular identity.' },
    { question: 'How should Semax be stored?', answer: 'Store lyophilized Semax sealed at -20°C, protected from moisture and light. Once reconstituted, refrigerate at 2–8°C.' },
    { question: 'Is Semax intended for human use?', answer: 'No. Semax is a research chemical for laboratory use only. Not approved for human consumption or therapeutic use.' },
  ],
}

const tesamorelin: ProductDef = {
  name: 'Tesamorelin',
  slug: 'tesamorelin',
  seoTitle: 'Tesamorelin | Research-Grade GHRH Analog Peptide, COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy 99%+ pure Tesamorelin research peptide, a Growth Hormone Releasing Hormone (GHRH) analog. HPLC/LC-MS verified, COA-backed. Research use only.',
  price: 93,
  hasVariants: true,
  variants: [
    mkVariant('TESA-10MG', 93, '10mg'),
    mkVariant('TESA-20MG', 153, '20mg'),
  ],
  categoryNames: ['research use only'],
  description: `Tesamorelin is a stabilized analog of Growth Hormone Releasing Hormone (GHRH) and a highly studied reference compound in endocrine and metabolic peptide research. This high-purity sequence is engineered for stability and precise molecular integrity across demanding laboratory settings. Researchers investigating pituitary signaling, growth hormone secretion, and body composition pathways will find this compound an indispensable asset. Each batch is synthesized using automated SPPS and purified by HPLC. The resulting lyophilized powder demonstrates exceptional solubility and reconstitution consistency. This compound is intended strictly for in-vitro and laboratory research use.`,
  productDetailsDescription: `Tesamorelin is a research-grade GHRH analog valued for sequence fidelity and structural purity. This stabilized 44-amino-acid peptide carries a trans-3-hexenoyl modification that improves resistance to enzymatic degradation, making it a robust reference standard for laboratory work. Researchers studying growth hormone signaling, endocrine regulation, and metabolic pathways rely on its consistent reconstitution and reproducible behavior across assays.`,
  researchFocusDescription: `This compound's research applications center on Growth Hormone Releasing Hormone pathways, pituitary signaling, systemic metabolic regulation, and localized tissue dynamics. As a GHRH analog, Tesamorelin is studied for its potential to modulate growth hormone secretion at the receptor level. It is also a common comparator in studies contrasting GHRH analogs such as Sermorelin and growth-hormone secretagogues like Ipamorelin.`,
  qualityPurityDescription: `Our peptides are synthesized using SPPS to yield an ultra-pure final product. Subsequent purification by preparative HPLC eliminates truncated sequences and deletion impurities. Final verification is achieved through ESI-MS, confirming the exact molecular mass. We guarantee 99%+ purity, documented in a batch-specific COA.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Tesamorelin?', answer: 'Tesamorelin is a stabilized synthetic analog of Growth Hormone Releasing Hormone (GHRH). It is a widely studied reference peptide in endocrine and metabolic research.' },
    { question: 'Is Tesamorelin a peptide?', answer: 'Yes. Tesamorelin is a 44-amino-acid synthetic peptide with a trans-3-hexenoyl group that improves its resistance to enzymatic breakdown.' },
    { question: 'How does Tesamorelin work as a GHRH analog?', answer: 'Tesamorelin is studied for binding GHRH receptors on pituitary cells and modulating growth hormone secretion. Researchers use it to examine endocrine signaling and downstream metabolic pathways in vitro.' },
    { question: 'Is Tesamorelin COA-verified?', answer: 'Yes. Each batch ships with a Certificate of Analysis from independent laboratory testing, confirming 99%+ purity.' },
    { question: 'How should Tesamorelin be stored?', answer: 'Store lyophilized Tesamorelin sealed at -20°C, protected from light and moisture. Once reconstituted, store at 2–8°C.' },
    { question: 'Is Tesamorelin intended for human use?', answer: 'No. Tesamorelin is a research chemical for laboratory use only. Not approved for human consumption or therapeutic application.' },
  ],
}

// ──────────────────────────────────────────────
// Products WITHOUT .md content (generated)
// ──────────────────────────────────────────────

const bacWater: ProductDef = {
  name: 'BAC Water',
  slug: 'bac-water',
  seoTitle: 'Bacteriostatic Water | Sterile Reconstitution Solvent | The Looksmaxxing Lab',
  seoDescription: 'Buy bacteriostatic water for peptide reconstitution. 0.9% benzyl alcohol preserved, sterile filtered. Essential laboratory supply for research use only.',
  price: 8,
  hasVariants: true,
  variants: [
    mkVariant('BAC-3ML', 8, '3mL'),
    mkVariant('BAC-10ML', 12, '10mL'),
  ],
  categoryNames: ['research use only'],
  description: `Bacteriostatic Water (BAC Water) is a sterile, non-pyrogenic preparation of water for injection containing 0.9% benzyl alcohol as a bacteriostatic preservative. It is the standard reconstitution solvent used in peptide research laboratories for dissolving lyophilized peptide compounds prior to experimental application. The benzyl alcohol preservative inhibits microbial growth, allowing multiple withdrawals from a single vial over a defined period under aseptic conditions. This product is manufactured under strict quality controls and is intended exclusively for laboratory research use.`,
  productDetailsDescription: `BAC Water is the industry-standard solvent for reconstituting lyophilized research peptides. Each vial contains sterile water with 0.9% benzyl alcohol (w/v) as a bacteriostatic agent. The formulation is filtered through 0.22-micron sterile filters and filled under aseptic conditions. Compatible with most research peptides, including growth hormone secretagogues, metabolic peptides, and neuropeptides used in in-vitro laboratory applications.`,
  researchFocusDescription: `Bacteriostatic water serves as an essential reagent in peptide research workflows. Its preservative properties allow researchers to reconstitute lyophilized peptides and perform multiple sample withdrawals over days without introducing microbial contamination. This is critical for longitudinal in-vitro assays where repeated dosing from the same reconstituted vial is required.`,
  qualityPurityDescription: `Each BAC Water vial is manufactured under strict aseptic conditions with sterile 0.22-micron filtration. Benzyl alcohol concentration is verified at 0.9% per USP standards. Endotoxin testing and sterility testing are performed on production lots.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Bacteriostatic Water?', answer: 'Bacteriostatic water is sterile water containing 0.9% benzyl alcohol as a preservative that inhibits microbial growth. It is the standard solvent for reconstituting lyophilized peptides in research settings.' },
    { question: 'How is BAC Water different from sterile water?', answer: 'BAC Water contains benzyl alcohol preservative allowing multiple withdrawals. Plain sterile water has no preservative and should be used in a single session to prevent contamination.' },
    { question: 'How should BAC Water be stored?', answer: 'Store at controlled room temperature (20-25°C), protected from light. Once opened, use within 28 days.' },
  ],
}

const bpc157: ProductDef = {
  name: 'BPC-157',
  slug: 'bpc-157',
  seoTitle: 'BPC-157 | Research-Grade Body Protection Compound Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy 99%+ pure BPC-157 research peptide, a pentadecapeptide derived from human gastric juice. HPLC verified, COA-backed. Research use only.',
  price: 46,
  hasVariants: true,
  variants: [
    mkVariant('BPC-5MG', 46, '5mg'),
    mkVariant('BPC-10MG', 56, '10mg'),
  ],
  categoryNames: ['research use only'],
  description: `BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide consisting of 15 amino acids, derived from a partial sequence of body protection compound found in human gastric juice. It is one of the most researched cytoprotective peptides in preclinical literature, with studies examining its effects on tissue repair, angiogenesis, and gastrointestinal mucosal integrity in animal models. Each batch is synthesized via SPPS and verified to ≥99% purity by independent HPLC analysis. This compound is classified Research Use Only.`,
  productDetailsDescription: `BPC-157 is a stable gastric pentadecapeptide (Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val) with a molecular weight of approximately 1419.5 g/mol. Unlike many bioactive peptides, BPC-157 demonstrates notable stability in gastric juice and does not require carrier proteins for experimental activity in published preclinical models. This stability profile makes it a practical research compound for both in-vitro and ex-vivo experimental designs.`,
  researchFocusDescription: `BPC-157 research centers on its proposed cytoprotective, angiogenic, and tissue-repair-associated properties observed in preclinical animal models. Published studies have examined its effects on tendon, ligament, muscle, and gastrointestinal tissue healing in rodent models. Researchers investigating growth factor modulation, nitric oxide system interactions, and wound healing biology use BPC-157 as a tool compound in controlled experimental systems.`,
  qualityPurityDescription: qualityTemplate('BPC-157'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is BPC-157?', answer: 'BPC-157 is a synthetic pentadecapeptide derived from a sequence found in human gastric juice. It is studied in preclinical models for its proposed cytoprotective and tissue-repair-associated properties. Research Use Only.' },
    { question: 'What are BPC-157 research applications?', answer: 'Applications include tissue repair models, angiogenesis studies, gastrointestinal mucosal integrity research, tendon and ligament biology, and nitric oxide pathway investigation.' },
    { question: 'How should BPC-157 be stored?', answer: 'Store lyophilized BPC-157 at -20°C, protected from moisture and light. Reconstitute in bacteriostatic water and use within 7 days when refrigerated.' },
    { question: 'Is BPC-157 approved for human use?', answer: 'No. BPC-157 is a Research Use Only compound not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const bpcTb500: ProductDef = {
  name: 'BPC-157 + TB-500',
  slug: 'bpc-tb-500',
  seoTitle: 'BPC-157 + TB-500 Blend | Research-Grade Peptide Combination | The Looksmaxxing Lab',
  seoDescription: 'BPC-157 + TB-500 blend — COA-verified dual peptide for tissue repair and regeneration research. HPLC tested, lyophilized. Research use only.',
  price: 83,
  hasVariants: true,
  variants: [
    mkVariant('BPC-TB-5-5', 83, '5mg/5mg'),
    mkVariant('BPC-TB-10-10', 103, '10mg/10mg'),
  ],
  categoryNames: ['research use only'],
  description: `BPC-157 + TB-500 is a research-grade dual peptide blend combining Body Protection Compound-157 and Thymosin Beta-4 fragment into a single lyophilized preparation. Both peptides are individually studied for tissue repair and regeneration research in preclinical models, and their combination enables investigators to study convergent healing pathways within a single experimental substrate. Each component is independently synthesized via SPPS and verified to ≥99% purity by third-party HPLC analysis before co-lyophilization. This compound is classified Research Use Only.`,
  productDetailsDescription: `This blend combines BPC-157, a gastric pentadecapeptide studied for cytoprotective properties, with TB-500, a synthetic fragment of Thymosin Beta-4 studied for cell migration and tissue remodeling. The combination allows researchers to probe mechanistic overlap between BPC-157's proposed angiogenic properties and TB-500's role in actin regulation and wound healing signaling.`,
  researchFocusDescription: `Research applications include comparative tissue repair pharmacology, dual-pathway wound healing models, tendon and connective tissue biology, and angiogenesis studies. The blend design allows researchers to study synergistic or additive effects between cytoprotective (BPC-157) and cytoskeletal remodeling (TB-500) mechanisms.`,
  qualityPurityDescription: `Each component is independently synthesized and analyzed by third-party HPLC before co-lyophilization. We guarantee ≥99% purity for each component individually. Full chromatograms are documented in the Certificate of Analysis.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is BPC-157 + TB-500?', answer: 'A dual peptide blend combining BPC-157 (gastric pentadecapeptide) and TB-500 (Thymosin Beta-4 fragment) for research into tissue repair, angiogenesis, and regeneration pathways. Research Use Only.' },
    { question: 'Why are BPC-157 and TB-500 studied together?', answer: 'They target complementary tissue repair mechanisms — BPC-157 for cytoprotective/angiogenic pathways and TB-500 for actin regulation and cell migration — enabling research into their combined effects.' },
    { question: 'Is this blend approved for human use?', answer: 'No. This is a Research Use Only compound not approved by the FDA for human consumption or therapeutic application.' },
  ],
}

const cjc1295NoDac: ProductDef = {
  name: 'CJC-1295 No DAC',
  slug: 'cjc-1295-no-dac',
  seoTitle: 'CJC-1295 No DAC | Research-Grade GHRH Analog | The Looksmaxxing Lab',
  seoDescription: 'CJC-1295 No DAC (Modified GRF 1-29) — COA-verified GHRH analog research peptide. HPLC tested, 99%+ purity. Research use only.',
  price: 73,
  categoryNames: ['research use only'],
  description: `CJC-1295 No DAC (also known as Modified GRF 1-29) is a synthetic analog of Growth Hormone Releasing Hormone comprising the first 29 amino acids of endogenous GHRH with amino acid substitutions to increase metabolic stability. Unlike the DAC-conjugated version, this preparation does not include the Drug Affinity Complex modification, resulting in a shorter biological half-life that more closely mimics endogenous GHRH pulsatility in research models. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `CJC-1295 No DAC is the non-DAC version of CJC-1295, representing Modified GRF (1-29) with four amino acid substitutions that provide DPP-IV resistance. Without the Drug Affinity Complex, this variant has a shorter plasma half-life, making it suitable for researchers studying pulsatile GH release patterns rather than sustained receptor activation.`,
  researchFocusDescription: `Research applications include GHRH receptor pharmacology, pulsatile growth hormone release studies, GH/IGF-1 axis investigation, and comparative GHRH analog pharmacology studies contrasting the DAC and non-DAC variants. Its shorter half-life profile enables pulse-specific experimental designs.`,
  qualityPurityDescription: qualityTemplate('CJC-1295 No DAC'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is CJC-1295 No DAC?', answer: 'CJC-1295 No DAC (Modified GRF 1-29) is a synthetic GHRH analog without the Drug Affinity Complex. It mimics pulsatile GHRH signaling with a shorter half-life than DAC-conjugated CJC-1295.' },
    { question: 'What is the difference between CJC-1295 with and without DAC?', answer: 'The DAC version binds to albumin for extended half-life (days). The No DAC version has a shorter half-life (minutes to hours), better suited for pulsatile GH research.' },
    { question: 'Is it approved for human use?', answer: 'No. This is a Research Use Only compound not approved by the FDA for human consumption.' },
  ],
}

const ghkCu: ProductDef = {
  name: 'GHK-CU',
  slug: 'ghk-cu',
  seoTitle: 'GHK-Cu | Research-Grade Copper Peptide | COA-Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy GHK-Cu research-grade copper peptide complex. COA-verified, HPLC tested. Studied for wound healing and tissue remodeling research. Research use only.',
  price: 46,
  hasVariants: true,
  variants: [
    mkVariant('GHK-50MG', 46, '50mg'),
    mkVariant('GHK-100MG', 63, '100mg'),
  ],
  categoryNames: ['research use only'],
  description: `GHK-Cu (Copper Peptide GHK-Cu) is a naturally occurring tripeptide-copper complex composed of glycyl-L-histidyl-L-lysine with a copper(II) ion. It is one of the most studied regenerative peptides in preclinical literature, with research examining its roles in wound healing, collagen synthesis, anti-inflammatory signaling, and extracellular matrix remodeling. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `GHK-Cu is a tripeptide (Gly-His-Lys) complexed with copper(II) ions. With a molecular weight of approximately 403.9 g/mol, it naturally occurs in human plasma, saliva, and urine. Its concentration in plasma decreases with age. The copper complex is critical for its biological activity in research models, distinguishing it from the uncomplexed GHK tripeptide.`,
  researchFocusDescription: `Research applications include wound healing studies, collagen and elastin synthesis assays, anti-inflammatory pathway research, stem cell biology, and extracellular matrix remodeling investigations. GHK-Cu has been studied for its interaction with multiple growth factor pathways including TGF-β, VEGF, and FGF in dermal fibroblast models.`,
  qualityPurityDescription: qualityTemplate('GHK-Cu'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is GHK-Cu?', answer: 'GHK-Cu is a naturally occurring tripeptide-copper complex (Gly-His-Lys + Cu²⁺) studied for wound healing, collagen synthesis, and tissue remodeling in preclinical research.' },
    { question: 'What makes GHK-Cu different from GHK?', answer: 'The copper(II) ion is critical for biological activity in research models. Uncomplexed GHK tripeptide does not demonstrate the same experimental profile.' },
    { question: 'Is GHK-Cu approved for human use?', answer: 'No. GHK-Cu from The Looksmaxxing Lab is a Research Use Only compound not approved for human or cosmetic use.' },
  ],
}

const kisspeptin: ProductDef = {
  name: 'Kisspeptin',
  slug: 'kisspeptin',
  seoTitle: 'Kisspeptin | Research-Grade Neuroendocrine Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy Kisspeptin 10mg research peptide. COA-verified, HPLC tested. Studied for reproductive endocrinology and GnRH signaling. Research use only.',
  price: 68,
  categoryNames: ['research use only'],
  description: `Kisspeptin is a neuropeptide encoded by the KISS1 gene that plays a central role in the regulation of reproductive hormone signaling. It acts as the primary upstream activator of gonadotropin-releasing hormone (GnRH) neurons in the hypothalamus, making it a critical tool compound in neuroendocrine and reproductive biology research. Each batch is synthesized via SPPS and verified to ≥99% purity by third-party HPLC analysis. Research Use Only.`,
  productDetailsDescription: `Kisspeptin 10mg is a research-grade preparation of the bioactive fragment Kisspeptin-10, the C-terminal decapeptide of the full-length kisspeptin-54 sequence. This fragment retains full agonist activity at the KISS1R (GPR54) receptor and is the most commonly used form in research applications. The lyophilized powder offers excellent stability for long-term laboratory storage.`,
  researchFocusDescription: `Research applications include GnRH neuron signaling studies, reproductive endocrinology, puberty onset investigation, hypothalamic-pituitary-gonadal axis research, and fertility biology. Kisspeptin is used as a pharmacological tool to probe the upstream regulation of LH and FSH secretion in preclinical models.`,
  qualityPurityDescription: qualityTemplate('Kisspeptin'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Kisspeptin?', answer: 'Kisspeptin is a neuropeptide encoded by the KISS1 gene that activates GnRH neurons. It is a critical tool compound in reproductive endocrinology and neuroendocrine research.' },
    { question: 'What are Kisspeptin research applications?', answer: 'Applications include GnRH signaling studies, reproductive hormone regulation, puberty onset research, and hypothalamic-pituitary-gonadal axis investigation.' },
    { question: 'Is Kisspeptin approved for human use?', answer: 'No. This is a Research Use Only compound not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const klowBlend: ProductDef = {
  name: 'KLOW Blend',
  slug: 'klow-blend',
  seoTitle: 'KLOW Blend | Premium Research-Grade Peptide Blend | COA Verified | The Looksmaxxing Lab',
  seoDescription: 'Buy KLOW Blend, a laboratory-grade regenerative peptide blend with COA-verified purity. HPLC-tested, batch-traceable, research use only.',
  price: 128,
  categoryNames: ['research use only'],
  description: `KLOW Blend is a premium, multi-peptide research blend formulated for laboratories studying tissue regeneration, collagen remodeling, and cellular recovery pathways. Each component peptide is synthesized to research-grade standards and combined to support investigation into synergistic signaling effects rarely captured by single-molecule compounds. Researchers studying recovery-linked cellular mechanisms rely on consistent, high-purity blends to generate reproducible data across repeated trials. Every batch is meticulously synthesized using solid-phase techniques and screened via HPLC to isolate the target peptides from truncated or deletion sequences, then lyophilized to preserve structural integrity during storage and shipping. This blend is intended strictly for laboratory and in-vitro research use by qualified professionals.`,
  productDetailsDescription: `KLOW Blend combines multiple research peptides selected for their proposed roles in tissue repair, collagen signaling, and regenerative cellular communication. Each constituent peptide is independently synthesized via Solid-Phase Peptide Synthesis and purified using preparative HPLC before being formulated together, ensuring the final blend reflects precise, documented ratios rather than approximate mixing. Final identity and molecular weight of each component are confirmed through Electrospray Ionization Mass Spectrometry (ESI-MS). The lyophilized powder format supports extended shelf stability, which matters when researchers are running longitudinal recovery-pathway studies or comparing this formulation against single-peptide controls.`,
  researchFocusDescription: `KLOW's primary research relevance centers on tissue regeneration, collagen remodeling, and extracellular matrix support, with investigators examining how its component peptides may influence fibroblast activity and localized recovery signaling. Current literature on regenerative peptide research points to potential modulation of inflammatory response pathways alongside structural matrix support, making this blend useful in comparative dermal and connective-tissue models. Laboratories frequently evaluate KLOW alongside single-peptide controls to isolate synergistic versus independent effects.`,
  qualityPurityDescription: `Every KLOW batch is synthesized using Solid-Phase Peptide Synthesis and purified through preparative HPLC to remove truncated sequences and deletion impurities from each component peptide. Final verification is performed via Electrospray Ionization Mass Spectrometry (ESI-MS), confirming exact molecular weight for every peptide in the blend. Each lot ships with a Certificate of Analysis. We guarantee >99% purity.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is KLOW Blend?', answer: 'KLOW Blend is a laboratory-grade research peptide blend combining multiple peptides selected for their proposed roles in tissue regeneration, collagen signaling, and cellular recovery. It is manufactured to strict purity standards and intended exclusively for scientific and laboratory research applications.' },
    { question: 'What makes KLOW different from other peptide blends?', answer: 'KLOW is formulated with documented, batch-verified ratios rather than approximate mixing, with each component peptide independently synthesized and HPLC-purified before formulation. This precision allows researchers to study synergistic signaling effects with greater confidence in reproducibility.' },
    { question: 'How is KLOW tested for purity?', answer: 'KLOW undergoes preparative HPLC purification to remove truncated and deletion sequences, followed by Electrospray Ionization Mass Spectrometry (ESI-MS) to confirm the exact molecular weight of each component peptide before a batch is released.' },
    { question: 'What research applications is KLOW studied for?', answer: 'KLOW is studied in research contexts involving tissue repair, collagen remodeling, extracellular matrix support, and inflammatory response modulation, often in comparative fibroblast and connective-tissue cell models alongside single-peptide controls.' },
    { question: 'How should KLOW be stored?', answer: 'Lyophilized KLOW should be stored at 2–8°C, protected from light and moisture, until reconstitution. Standard peptide-handling protocols should be followed to preserve the structural integrity of each component peptide in the blend.' },
    { question: 'Is KLOW intended for human use?', answer: 'No. KLOW is sold strictly for research and laboratory use only. It has not been evaluated or approved by the FDA or any other regulatory body for human consumption, veterinary application, or therapeutic use of any kind.' },
    { question: 'Why is third-party testing important for peptide blends?', answer: 'Third-party or independent verification confirms that purity and identity claims are accurate and not self-reported, which is especially important for blends where multiple peptides must each meet purity thresholds for the formulation to be considered research-grade.' },
  ],
}

const kpv: ProductDef = {
  name: 'KPV',
  slug: 'kpv',
  seoTitle: 'KPV | Research-Grade Anti-Inflammatory Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy KPV 10mg research peptide — alpha-MSH C-terminal tripeptide studied for anti-inflammatory signaling. COA-verified, HPLC tested. Research use only.',
  price: 63,
  categoryNames: ['research use only'],
  description: `KPV is a naturally occurring tripeptide (Lys-Pro-Val) representing the C-terminal fragment of alpha-melanocyte stimulating hormone (α-MSH). It is studied in preclinical research for its proposed anti-inflammatory properties, with investigations examining its effects on NF-κB signaling, inflammatory cytokine modulation, and mucosal barrier integrity in cell culture and animal models. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `KPV is a tripeptide (Lys-Pro-Val) with a molecular weight of approximately 342.4 g/mol. As the C-terminal fragment of α-MSH, KPV retains anti-inflammatory signaling properties without the melanocortin receptor-mediated pigmentation effects of the full-length parent hormone. This selectivity makes it a useful tool compound for researchers studying inflammation independently of melanogenesis.`,
  researchFocusDescription: `Research applications include NF-κB signaling pathway studies, inflammatory bowel disease models, mucosal barrier integrity research, cytokine modulation assays, and comparative melanocortin pharmacology. KPV's lack of significant MC1R agonism distinguishes it from MT-2 and α-MSH in inflammation-specific research designs.`,
  qualityPurityDescription: qualityTemplate('KPV'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is KPV?', answer: 'KPV (Lys-Pro-Val) is a tripeptide fragment of alpha-MSH studied for anti-inflammatory properties including NF-κB modulation and cytokine regulation. Research Use Only.' },
    { question: 'How is KPV different from MT-2?', answer: 'KPV retains anti-inflammatory activity without significant melanocortin receptor-mediated pigmentation effects, making it specific to inflammation research.' },
    { question: 'Is KPV approved for human use?', answer: 'No. KPV is a Research Use Only compound not approved by the FDA for human consumption or therapeutic use.' },
  ],
}

const ll37: ProductDef = {
  name: 'LL-37',
  slug: 'll-37',
  seoTitle: 'LL-37 | Research-Grade Antimicrobial Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy LL-37 research peptide — human cathelicidin antimicrobial peptide. COA-verified, HPLC tested, 99%+ purity. Research use only.',
  price: 63,
  categoryNames: ['research use only'],
  description: `LL-37 is the only human cathelicidin antimicrobial peptide, a 37-amino-acid peptide derived from the C-terminal domain of human cathelicidin precursor protein hCAP18. It is one of the most studied host defense peptides in innate immunity research, with published studies examining its antimicrobial, immunomodulatory, and wound healing properties. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `LL-37 is a 37-amino-acid alpha-helical peptide with a molecular weight of approximately 4493.3 g/mol. It is expressed by neutrophils, macrophages, and epithelial cells and represents the active antimicrobial domain of human cathelicidin. Its amphipathic structure enables membrane disruption of microbial targets while also mediating immunomodulatory functions through host cell receptor interactions.`,
  researchFocusDescription: `Research applications include antimicrobial activity assays, innate immunity studies, wound healing biology, biofilm disruption research, and immunomodulatory signaling investigations. LL-37 is used in comparative studies against other antimicrobial peptides and as a reference standard in host defense peptide pharmacology.`,
  qualityPurityDescription: qualityTemplate('LL-37'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is LL-37?', answer: 'LL-37 is the only human cathelicidin antimicrobial peptide — a 37-amino-acid host defense peptide studied for antimicrobial, immunomodulatory, and wound healing properties.' },
    { question: 'What are LL-37 research applications?', answer: 'Applications include antimicrobial assays, innate immunity research, biofilm disruption studies, wound healing models, and host defense peptide pharmacology.' },
    { question: 'Is LL-37 approved for human use?', answer: 'No. LL-37 is a Research Use Only compound not approved for human consumption or therapeutic application.' },
  ],
}

const lipoC: ProductDef = {
  name: 'Lipo-C',
  slug: 'lipo-c',
  seoTitle: 'Lipo-C | Research-Grade Lipotropic Compound | The Looksmaxxing Lab',
  seoDescription: 'Lipo-C research-grade lipotropic compound for laboratory investigation of lipid metabolism pathways. Contact for pricing. Research use only.',
  price: 0,
  status: 'draft',
  categoryNames: ['research use only'],
  description: `Lipo-C is a research-grade lipotropic compound formulated for laboratory investigation of lipid metabolism, fat oxidation pathways, and cellular energy utilization. This preparation combines lipotropic agents studied for their roles in hepatic lipid processing and methyl donor metabolism in preclinical research models. This compound is classified Research Use Only. Contact us for current pricing and availability.`,
  productDetailsDescription: `Lipo-C is a lipotropic research formulation combining agents studied for their roles in hepatic lipid metabolism, methyl donation pathways, and cellular energy processing. The lyophilized preparation ensures stability during storage and transport.`,
  researchFocusDescription: `Research applications include lipid metabolism studies, hepatic fat processing research, methyl donor pathway investigation, and comparative lipotropic pharmacology in cell culture and preclinical models.`,
  qualityPurityDescription: `Each batch is manufactured under strict quality controls and tested for purity and identity before release. A Certificate of Analysis is provided with every lot.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Lipo-C?', answer: 'Lipo-C is a research-grade lipotropic compound for laboratory investigation of lipid metabolism. Research Use Only.' },
    { question: 'Is Lipo-C approved for human use?', answer: 'No. Lipo-C is a Research Use Only compound not approved for human consumption.' },
  ],
}

const melanotanI: ProductDef = {
  name: 'Melanotan I',
  slug: 'melanotan-i',
  seoTitle: 'Melanotan I | Research-Grade MC1R-Selective Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy Melanotan I (Afamelanotide) 10mg research peptide. MC1R-selective melanocortin agonist. COA-verified, HPLC tested. Research use only.',
  price: 53,
  categoryNames: ['research use only'],
  description: `Melanotan I (also known as Afamelanotide) is a synthetic linear tridecapeptide analog of alpha-melanocyte stimulating hormone (α-MSH) with greater selectivity for the MC1R melanocortin receptor compared to MT-2. It is studied in preclinical research for MC1R-specific pigmentation biology and melanogenesis pathway investigation. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `Melanotan I is a linear 13-amino-acid peptide analog of α-MSH with preferential MC1R binding affinity. Unlike the cyclic MT-2 (Melanotan 2), Melanotan I demonstrates reduced activity at MC3R, MC4R, and MC5R subtypes, making it the preferred research tool for MC1R-selective studies in melanocyte biology.`,
  researchFocusDescription: `Research applications include MC1R-selective pigmentation studies, melanocyte biology, comparative melanocortin pharmacology (Melanotan I vs MT-2 vs α-MSH), eumelanin synthesis pathway research, and photoprotection biology in cell culture models.`,
  qualityPurityDescription: qualityTemplate('Melanotan I'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Melanotan I?', answer: 'Melanotan I (Afamelanotide) is a linear tridecapeptide α-MSH analog with preferential MC1R selectivity, studied for melanocyte biology and pigmentation pathway research.' },
    { question: 'How is Melanotan I different from MT-2?', answer: 'Melanotan I is MC1R-selective with reduced MC4R activity. MT-2 has broader melanocortin receptor activity across MC1R, MC3R, MC4R, and MC5R.' },
    { question: 'Is Melanotan I approved for human use?', answer: 'No. This is a Research Use Only compound not approved for human consumption or cosmetic application.' },
  ],
}

const oxytocin: ProductDef = {
  name: 'Oxytocin',
  slug: 'oxytocin',
  seoTitle: 'Oxytocin | Research-Grade Neuropeptide | The Looksmaxxing Lab',
  seoDescription: 'Buy Oxytocin 10mg research-grade neuropeptide. COA-verified, HPLC tested, 99%+ purity. Studied for social behavior and neuroendocrine research. Research use only.',
  price: 63,
  categoryNames: ['research use only'],
  description: `Oxytocin is a cyclic nonapeptide (Cys-Tyr-Ile-Gln-Asn-Cys-Pro-Leu-Gly-NH₂) produced endogenously in the hypothalamus and one of the most studied neuropeptides in behavioral neuroscience and neuroendocrine research. It is studied for its roles in social bonding, stress response regulation, and reproductive biology in preclinical models. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `Oxytocin is a 9-amino-acid cyclic peptide with a molecular weight of 1007.2 g/mol and a disulfide bond between Cys1 and Cys6 that is critical for biological activity. The lyophilized powder maintains structural integrity including the disulfide bridge essential for receptor binding in research applications.`,
  researchFocusDescription: `Research applications include social behavior neuroscience, stress response and HPA axis studies, reproductive biology, uterine contraction pharmacology, and comparative neuropeptide research. Oxytocin is used as a tool compound in receptor binding assays and behavioral pharmacology studies.`,
  qualityPurityDescription: qualityTemplate('Oxytocin'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Oxytocin?', answer: 'Oxytocin is a cyclic nonapeptide neuropeptide studied for its roles in social bonding, stress response regulation, and reproductive biology in preclinical research.' },
    { question: 'What are Oxytocin research applications?', answer: 'Applications include behavioral neuroscience, HPA axis studies, reproductive biology, uterine pharmacology, and neuropeptide receptor binding assays.' },
    { question: 'Is Oxytocin approved for human use?', answer: 'No. Oxytocin from The Looksmaxxing Lab is a Research Use Only compound not approved for human consumption.' },
  ],
}

const semaglutide: ProductDef = {
  name: 'Semaglutide',
  slug: 'semaglutide',
  seoTitle: 'Semaglutide | Research-Grade GLP-1 Receptor Agonist | The Looksmaxxing Lab',
  seoDescription: 'Buy Semaglutide research peptide — high-purity GLP-1 receptor agonist. COA-verified, HPLC tested. Multiple dosages available. Research use only.',
  price: 48,
  hasVariants: true,
  variants: [
    mkVariant('SEMA-5MG', 48, '5mg'),
    mkVariant('SEMA-10MG', 65, '10mg'),
    mkVariant('SEMA-20MG', 99, '20mg'),
    mkVariant('SEMA-30MG', 130, '30mg'),
  ],
  categoryNames: ['research use only'],
  description: `Semaglutide is a synthetic GLP-1 (glucagon-like peptide-1) receptor agonist and one of the most extensively researched incretin mimetic peptides in metabolic biology. This long-acting GLP-1 analog incorporates structural modifications including a C18 fatty acid chain and amino acid substitutions that confer DPP-IV resistance and albumin binding, extending its biological half-life in research models. Each batch is synthesized via SPPS and verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `Semaglutide is a 31-amino-acid peptide analog of human GLP-1(7-37) with a molecular weight of approximately 4113.6 g/mol. Key structural modifications include an Aib substitution at position 8 (DPP-IV resistance), a C18 fatty diacid chain via a linker at Lys26 (albumin binding), and an Arg34 substitution. These modifications collectively produce a compound with extended pharmacokinetic stability in in-vitro and preclinical models.`,
  researchFocusDescription: `Research applications include GLP-1 receptor pharmacology, incretin biology, glucose homeostasis studies, insulin secretion pathway research, appetite signaling investigation, and comparative agonist pharmacology (Semaglutide vs Tirzepatide vs Liraglutide). Its single-receptor GLP-1 profile makes it a key comparator against dual and triple agonists in metabolic research.`,
  qualityPurityDescription: qualityTemplate('Semaglutide'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Semaglutide?', answer: 'Semaglutide is a synthetic GLP-1 receptor agonist peptide with structural modifications for extended half-life. It is one of the most studied incretin mimetic peptides in metabolic biology research.' },
    { question: 'How is Semaglutide different from Tirzepatide?', answer: 'Semaglutide is a single GLP-1 receptor agonist. Tirzepatide is a dual GIP/GLP-1 agonist. Researchers compare them to study single vs. dual receptor activation in metabolic models.' },
    { question: 'What are Semaglutide research applications?', answer: 'Applications include GLP-1 receptor pharmacology, incretin biology, glucose homeostasis, insulin secretion pathway research, and comparative agonist studies.' },
    { question: 'How should Semaglutide be stored?', answer: 'Store lyophilized Semaglutide at -20°C, protected from moisture and light. Once reconstituted, store at 4°C and use within 7 days.' },
    { question: 'Is Semaglutide approved for human use?', answer: 'No. Semaglutide from The Looksmaxxing Lab is a Research Use Only compound not approved by the FDA for human consumption.' },
  ],
}

const semaxSelank: ProductDef = {
  name: 'Semax / Selank',
  slug: 'semax-selank',
  seoTitle: 'Semax + Selank Blend | Research-Grade Nootropic Peptide Combination | The Looksmaxxing Lab',
  seoDescription: 'Semax + Selank 10/10mg blend — dual nootropic neuropeptide research compound. COA-verified, HPLC tested. Research use only.',
  price: 78,
  categoryNames: ['research use only'],
  description: `Semax / Selank is a research-grade dual nootropic neuropeptide blend combining two of the most studied neuropeptides in cognitive neuroscience research. Semax (ACTH 4-7 analog) and Selank (tuftsin analog) target distinct but complementary neural signaling pathways — BDNF modulation and GABAergic neurotransmission respectively. Each component is independently synthesized and verified to ≥99% purity by third-party HPLC before co-lyophilization. Research Use Only.`,
  productDetailsDescription: `This blend combines Semax, a synthetic ACTH 4-7 analog studied for BDNF pathway modulation and melanocortin receptor interactions, with Selank, a synthetic tuftsin analog studied for GABAergic neurotransmission and enkephalinase inhibition. The combination enables researchers to study complementary neuropeptide mechanisms within a single experimental substrate.`,
  researchFocusDescription: `Research applications include dual-pathway neuropeptide pharmacology, comparative BDNF vs GABAergic signaling studies, cognitive neuroscience research, and nootropic peptide combination pharmacology. The blend enables researchers to study mechanistic overlap between melanocortin-mediated and tuftsin-mediated neural signaling.`,
  qualityPurityDescription: `Each component is independently synthesized via SPPS and analyzed by third-party HPLC before co-lyophilization. We guarantee ≥99% purity for each component individually.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is the Semax/Selank blend?', answer: 'A dual nootropic neuropeptide blend combining Semax (ACTH 4-7 analog) and Selank (tuftsin analog) for research into complementary neural signaling pathways. Research Use Only.' },
    { question: 'Why are Semax and Selank studied together?', answer: 'They target complementary pathways — Semax for BDNF/melanocortin signaling and Selank for GABAergic/enkephalinase pathways — enabling dual-mechanism neuropeptide research.' },
    { question: 'Is this blend approved for human use?', answer: 'No. This is a Research Use Only compound not approved for human consumption or therapeutic application.' },
  ],
}

const sermorelin: ProductDef = {
  name: 'Sermorelin',
  slug: 'sermorelin',
  seoTitle: 'Sermorelin | Research-Grade GHRH Analog Peptide | The Looksmaxxing Lab',
  seoDescription: 'Buy Sermorelin research peptide — GHRH(1-29) analog for growth hormone research. COA-verified, HPLC tested, 99%+ purity. Research use only.',
  price: 73,
  hasVariants: true,
  variants: [
    mkVariant('SERM-10MG', 73, '10mg'),
    mkVariant('SERM-20MG', 118, '20mg'),
  ],
  categoryNames: ['research use only'],
  description: `Sermorelin is a synthetic peptide corresponding to the first 29 amino acids of endogenous Growth Hormone Releasing Hormone (GHRH 1-29). It is the biologically active fragment of the full 44-amino-acid GHRH sequence and acts at pituitary GHRH receptors (GHRHR) to stimulate growth hormone secretion. Sermorelin is one of the most established GHRH analogs in endocrine research literature. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `Sermorelin is GHRH(1-29)NH₂, the minimal biologically active fragment of human growth hormone releasing hormone. Unlike CJC-1295, Sermorelin does not contain DPP-IV-resistant amino acid substitutions, resulting in a shorter half-life that mirrors native GHRH kinetics. This makes it the reference standard for researchers studying physiological GHRH signaling.`,
  researchFocusDescription: `Research applications include GHRH receptor pharmacology, growth hormone pulse physiology, GH/IGF-1 axis studies, comparative GHRH analog research (Sermorelin vs CJC-1295), and pituitary somatotroph biology. Sermorelin's native-like kinetics make it the standard comparator in GHRH analog studies.`,
  qualityPurityDescription: qualityTemplate('Sermorelin'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is Sermorelin?', answer: 'Sermorelin is a synthetic GHRH(1-29) peptide — the biologically active fragment of human growth hormone releasing hormone. It is the reference standard for GHRH research.' },
    { question: 'What is the difference between Sermorelin and CJC-1295?', answer: 'Sermorelin is unmodified GHRH(1-29) with native-like kinetics. CJC-1295 has DPP-IV-resistant modifications for extended half-life. Sermorelin mirrors physiological GHRH signaling.' },
    { question: 'Is Sermorelin approved for human use?', answer: 'No. Sermorelin from The Looksmaxxing Lab is a Research Use Only compound.' },
  ],
}

const tb500: ProductDef = {
  name: 'TB-500',
  slug: 'tb-500',
  seoTitle: 'TB-500 | Research-Grade Thymosin Beta-4 Fragment | The Looksmaxxing Lab',
  seoDescription: 'Buy TB-500 research peptide — Thymosin Beta-4 active fragment. COA-verified, HPLC tested, 99%+ purity. Research use only.',
  price: 68,
  hasVariants: true,
  variants: [
    mkVariant('TB500-5MG', 68, '5mg'),
    mkVariant('TB500-10MG', 88, '10mg'),
  ],
  categoryNames: ['research use only'],
  description: `TB-500 is a synthetic peptide fragment of Thymosin Beta-4 (Tβ4), a naturally occurring 43-amino-acid protein involved in cell migration, angiogenesis, and tissue repair signaling. TB-500 represents the active region of Tβ4 responsible for actin-binding and cell motility properties studied in preclinical research. Each batch is verified to ≥99% purity by third-party HPLC. Research Use Only.`,
  productDetailsDescription: `TB-500 is a synthetic fragment of Thymosin Beta-4 containing the actin-binding domain (amino acids 17-23: LKKTETQ) that is central to Tβ4's proposed role in cell migration and tissue remodeling. Thymosin Beta-4 is one of the most abundant actin-sequestering proteins, and TB-500 replicates its experimentally relevant bioactive region.`,
  researchFocusDescription: `Research applications include cell migration assays, wound healing biology, angiogenesis studies, cardiac tissue remodeling research, and comparative Thymosin Beta-4 pharmacology. TB-500 is used alongside BPC-157 in dual-peptide tissue repair research designs.`,
  qualityPurityDescription: qualityTemplate('TB-500'),
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is TB-500?', answer: 'TB-500 is a synthetic fragment of Thymosin Beta-4 containing the active actin-binding domain. It is studied for cell migration, angiogenesis, and tissue repair in preclinical models.' },
    { question: 'What is the difference between TB-500 and Thymosin Beta-4?', answer: 'TB-500 is the synthetic active fragment of the full 43-amino-acid Thymosin Beta-4 protein, containing the key actin-binding domain (LKKTETQ).' },
    { question: 'Is TB-500 approved for human use?', answer: 'No. TB-500 is a Research Use Only compound not approved for human consumption or therapeutic use.' },
  ],
}

const tesaIpa: ProductDef = {
  name: 'Tesamorelin / Ipamorelin',
  slug: 'tesa-ipa',
  seoTitle: 'Tesamorelin + Ipamorelin Blend | Research-Grade GHS Combination | The Looksmaxxing Lab',
  seoDescription: 'Tesamorelin + Ipamorelin blend — dual GHRH/GHSR research peptide combination. COA-verified, HPLC tested. Research use only.',
  price: 88,
  hasVariants: true,
  variants: [
    mkVariant('TESA-IPA-6-3', 88, '6mg/3mg'),
    mkVariant('TESA-IPA-13-3', 148, '13mg/3mg'),
  ],
  categoryNames: ['research use only'],
  description: `Tesamorelin / Ipamorelin is a research-grade dual growth hormone secretagogue blend combining a GHRH analog (Tesamorelin) with a selective GHSR-1a agonist (Ipamorelin) into a single lyophilized preparation. This combination targets the somatotropic axis through two complementary receptor pathways, enabling research into dual-mechanism GH secretion. Each component is independently verified to ≥99% purity by third-party HPLC before co-lyophilization. Research Use Only.`,
  productDetailsDescription: `This blend combines Tesamorelin, a stabilized 44-amino-acid GHRH analog with a trans-3-hexenoyl modification, with Ipamorelin, a selective pentapeptide GHSR-1a agonist. Tesamorelin signals via GHRHR/Gs/cAMP, while Ipamorelin signals via GHSR-1a/Gq/Ca2+, providing dual-pathway coverage of the somatotropic axis.`,
  researchFocusDescription: `Research applications include dual-mechanism GH secretagogue pharmacology, GHRHR vs GHSR-1a synergy studies, GH/IGF-1 axis research, and comparative GHRH analog combination studies. The Tesamorelin + Ipamorelin combination is studied as an alternative to CJC-1295 + Ipamorelin blends with different GHRH receptor kinetics.`,
  qualityPurityDescription: `Each component is independently synthesized via SPPS and analyzed by third-party HPLC before co-lyophilization. We guarantee ≥99% purity for each component individually.`,
  complianceNoticeDescription: COMPLIANCE,
  faqs: [
    { question: 'What is the Tesamorelin/Ipamorelin blend?', answer: 'A dual peptide blend combining Tesamorelin (GHRH analog) and Ipamorelin (GHSR agonist) for research into dual-mechanism growth hormone secretion. Research Use Only.' },
    { question: 'How does it differ from CJC-1295/Ipamorelin?', answer: 'Tesamorelin is a longer 44-amino-acid GHRH analog with a trans-3-hexenoyl modification, providing different receptor kinetics than the modified GRF(1-29) in CJC-1295.' },
    { question: 'Is this blend approved for human use?', answer: 'No. This is a Research Use Only compound not approved for human consumption or therapeutic use.' },
  ],
}

// ──────────────────────────────────────────────
// Export all products
// ──────────────────────────────────────────────

export const products: ProductDef[] = [
  tirzepatide,
  retatrutide,
  semaglutide,
  glowBlend,
  klowBlend,
  cjcIpamorelin,
  epithalon,
  glutathione,
  ipamorelin,
  motsC,
  mt2,
  nadPlus,
  selank,
  semax,
  tesamorelin,
  bacWater,
  bpc157,
  bpcTb500,
  cjc1295NoDac,
  ghkCu,
  kisspeptin,
  kpv,
  ll37,
  lipoC,
  melanotanI,
  oxytocin,
  semaxSelank,
  sermorelin,
  tb500,
  tesaIpa,
]
