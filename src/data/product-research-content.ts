/**
 * Code-level research context for selected product pages.
 *
 * Why this exists: product copy, FAQs and tab content all come from Payload. This module adds
 * a citation-anchored evidence section without touching CMS records, keyed by product slug.
 * A slug with no entry here renders nothing, so other product pages are unaffected.
 *
 * Content rules for anything added to this file:
 *  - Product-page prose must not use the term "peptide" (see descriptionOverrides.ts conventions).
 *    Verbatim third-party publication titles in `references` are exempt: altering a published
 *    title would misstate the citation.
 *  - Every claim must trace to a verified primary source listed in `references`. No invented
 *    PMIDs, DOIs, study models or findings.
 *  - No purity percentages, certifications or batch-specific COA claims for a given product.
 *  - No therapeutic, dosing, administration or self-experimentation guidance.
 */

export interface ResearchStudyRow {
  /** Specific question investigated */
  topic: string
  /** Cell, animal or human, as applicable */
  model: string
  /** Accurate, qualified summary of the main finding */
  finding: string
  /** Short source label, e.g. "Lee et al., 2015" */
  sourceLabel: string
  /** Reference id matching a ProductResearchReference.id */
  sourceRef: string
}

export interface ResearchFaqItem {
  question: string
  answer: string
}

export interface ProductResearchReference {
  id: string
  /** Verbatim publication title */
  title: string
  /** Authors, journal, year, volume/issue/pages */
  citation: string
  pmid: string
  doi: string
}

export interface ProductResearchSectionBlock {
  heading: string
  paragraphs: string[]
}

export interface ProductResearchContent {
  heading: string
  /** Concise, factual introductory answer. Kept first for answer-engine extraction. */
  lead: string
  sections: ProductResearchSectionBlock[]
  /** Sections rendered after the research summary table. */
  sectionsAfterTable: ProductResearchSectionBlock[]
  tableHeading: string
  tableCaption: string
  studies: ResearchStudyRow[]
  faqHeading: string
  faqs: ResearchFaqItem[]
  referencesHeading: string
  references: ProductResearchReference[]
  /** Evidence base last checked against PubMed on this date (ISO). */
  evidenceReviewed: string
}

export const PRODUCT_RESEARCH_CONTENT: Record<string, ProductResearchContent> = {
  'mots-c': {
    heading: 'MOTS-C Research Evidence',
    lead:
      'MOTS-C is a 16-amino-acid compound encoded by a short open reading frame within the mitochondrial 12S rRNA gene, first described in 2015. Research attention centres on mitochondria-to-nucleus signalling and the AMPK energy-sensing pathway. The summary below separates established background from findings observed only in cell or animal models, and states plainly where human evidence is absent. Supplied for laboratory research use only.',
    sections: [
      {
        heading: 'Established background',
        paragraphs: [
          'MOTS-C is encoded within mitochondrial DNA rather than the nuclear genome. It belongs to a small class of mitochondria-encoded signalling molecules, the first characterised member of which was humanin. Its identification followed the search for additional short open reading frames in mitochondrial DNA, and the name records its origin: mitochondrial open reading frame of the 12S rRNA-c.',
          'The compound is detectable in human skeletal muscle and in circulation, and exercise raises endogenous levels in humans. These are measurement observations about a naturally occurring molecule. They are separate from any claim about what administering the compound does, and they should not be read as one.',
        ],
      },
      {
        heading: 'Mechanism as reported in cell and animal models',
        paragraphs: [
          'In cultured cell lines and in mice, MOTS-C inhibits the folate cycle and the de novo purine biosynthesis tethered to it, and AMPK activation follows. Skeletal muscle appeared to be the primary target organ in the original characterisation. This is a proposed mechanism established in non-human systems, not a demonstrated mechanism in people.',
          'Under glucose restriction in human cell lines, MOTS-C has been reported to translocate to the nucleus and regulate nuclear gene expression in an AMPK-dependent manner, including genes carrying antioxidant response elements, through interaction with stress-responsive transcription factors such as NFE2L2 (NRF2). This work is cited as evidence that mitochondrial and nuclear genomes cross-regulate one another.',
        ],
      },
    ],
    sectionsAfterTable: [
      {
        heading: 'What human studies do and do not show',
        paragraphs: [
          'Every human study published to date measures the concentration already present in muscle or blood. No published human study has administered MOTS-C, so the literature supports no conclusion about efficacy or safety in people, and none is offered here.',
          'In a small observational comparison, plasma concentration did not differ between lean and obese participants, while correlating with insulin-sensitivity indices mainly within the lean group. In a secondary analysis of an exercise trial in breast cancer survivors, sixteen weeks of aerobic and resistance training raised plasma concentration in non-Hispanic White participants but not in Hispanic participants, a difference the authors attribute to mitochondrial DNA variation. Taken together, the human work describes a molecule that responds to metabolic and exercise state. It does not describe an intervention with demonstrated human effects.',
        ],
      },
      {
        heading: 'Limitations and open questions',
        paragraphs: [
          'The gap between models and human evidence is the central limitation. Rodent studies use exposures that have no established human equivalent, and metabolic phenotypes in inbred mice on controlled diets do not transfer to people. Human cohorts so far are small.',
          'Measurement is a further constraint. Studies have used different immunoassays, including commercially available competitive ELISA kits, so absolute concentrations reported in separate papers are not directly comparable. Whether a change in circulating concentration is a cause or a consequence of metabolic state remains unresolved, as does the extent to which mitochondrial DNA background shapes the response seen in the exercise trial.',
          'Because the evidence base is preclinical and observational, this page gives no therapeutic, dosing, administration or handling guidance, and the compound is supplied strictly as a research material.',
        ],
      },
      {
        heading: 'Research quality and documentation',
        paragraphs: [
          'Solid-phase synthesis of a 16-amino-acid sequence can leave truncated and deletion variants alongside the intended product. Identity confirmation and purity analysis therefore determine whether an experimental result reflects the target compound or a synthesis byproduct, which matters most when a study reports a modest effect.',
          'Batch-level documentation serves reproducibility: it lets a laboratory repeat an experiment with comparable material, and lets a discrepant result be traced to the lot used. Researchers evaluating any supplier should read the analytical documentation for the specific lot they receive rather than relying on a general statement about testing.',
        ],
      },
    ],
    tableHeading: 'Research summary',
    tableCaption:
      'Published findings by study model. Animal and cell findings are not evidence of effect in humans.',
    studies: [
      {
        topic: 'Identification, AMPK activation and metabolic effects',
        model: 'Cell lines and mice',
        finding:
          'Identified a 16-amino-acid compound encoded in the mitochondrial 12S rRNA. Cellular actions inhibited the folate cycle and de novo purine biosynthesis, leading to AMPK activation. In mice, treatment prevented age-dependent and high-fat-diet-induced insulin resistance and diet-induced obesity.',
        sourceLabel: 'Lee et al., 2015',
        sourceRef: 'lee-2015',
      },
      {
        topic: 'Nuclear translocation and gene regulation',
        model: 'Human cell lines (glucose restriction)',
        finding:
          'Translocated to the nucleus and regulated nuclear gene expression in an AMPK-dependent manner, including genes with antioxidant response elements, interacting with transcription factors such as NFE2L2 (NRF2).',
        sourceLabel: 'Kim et al., 2018',
        sourceRef: 'kim-2018',
      },
      {
        topic: 'Physical capacity, ageing, and exercise response',
        model: 'Mice, plus human exercise observation',
        finding:
          'Enhanced physical performance in young, middle-aged and old mice; late-life intermittent treatment increased physical capacity and healthspan in mice. Separately, in humans, exercise induced endogenous expression in skeletal muscle and in circulation.',
        sourceLabel: 'Reynolds et al., 2021',
        sourceRef: 'reynolds-2021',
      },
      {
        topic: 'Adipose tissue and metabolic dysfunction after ovariectomy',
        model: 'Ovariectomised mice',
        finding:
          'Treatment prevented ovariectomy-induced weight gain and insulin resistance, reduced fat accumulation, and sustained brown adipose activity; effects were attenuated by an AMPK pathway blocker.',
        sourceLabel: 'Lu et al., 2019',
        sourceRef: 'lu-2019',
      },
      {
        topic: 'Circulating levels and insulin sensitivity',
        model: 'Humans, observational (n=10 lean, n=10 obese)',
        finding:
          'Plasma concentration did not differ between lean and obese participants. It correlated with HOMA and Matsuda insulin-sensitivity indices, and those associations persisted only in the lean group. Sample size was small.',
        sourceLabel: 'Cataldo et al., 2018',
        sourceRef: 'cataldo-2018',
      },
      {
        topic: 'Response to a structured exercise intervention',
        model: 'Humans, randomised trial secondary analysis (n=49)',
        finding:
          'After 16 weeks of aerobic and resistance exercise, plasma concentration rose in non-Hispanic White breast cancer survivors but not in Hispanic survivors. The authors relate this difference to variation in mitochondrial DNA.',
        sourceLabel: 'Dieli-Conwright et al., 2021',
        sourceRef: 'dieli-conwright-2021',
      },
    ],
    faqHeading: 'Research questions',
    faqs: [
      {
        question: 'What is MOTS-C in scientific research?',
        answer:
          'A 16-amino-acid compound encoded by a short open reading frame in the mitochondrial 12S rRNA gene. It is studied as a signalling molecule produced by mitochondria rather than from nuclear DNA, and it is used as a research material only.',
      },
      {
        question: 'What biological processes have researchers investigated?',
        answer:
          'Chiefly AMPK activation by way of the folate cycle and de novo purine biosynthesis, mitochondria-to-nucleus signalling with regulation of nuclear gene expression, and metabolic phenotypes in rodent models such as diet-induced insulin resistance and adiposity.',
      },
      {
        question: 'What types of experimental models have been studied?',
        answer:
          'Cultured cell lines and mice carry nearly all of the mechanistic and interventional work. Human studies published to date measure endogenous concentrations in muscle or blood; they do not administer the compound.',
      },
      {
        question: 'What limitations exist in the published evidence?',
        answer:
          'No published human study has administered MOTS-C, so no human efficacy or safety conclusions can be drawn. Rodent findings do not transfer to humans. Human sample sizes are small, measurement relies on differing immunoassays, so absolute values are not directly comparable between papers, and whether changes in circulating levels are a cause or a consequence of metabolic state is unresolved.',
      },
      {
        question: 'Why is analytical documentation important for research materials?',
        answer:
          'Solid-phase synthesis can leave truncated or deletion sequences alongside the target sequence. Identity and purity testing establishes which compound is actually in the vial, and batch-level records let an experiment be repeated or a discrepant result be traced back. Without that documentation, a result cannot be attributed to the intended compound with confidence.',
      },
    ],
    referencesHeading: 'References',
    references: [
      {
        id: 'lee-2015',
        title:
          'The mitochondrial-derived peptide MOTS-c promotes metabolic homeostasis and reduces obesity and insulin resistance.',
        citation: 'Lee C, Zeng J, Drew BG, et al. Cell Metab. 2015;21(3):443-454.',
        pmid: '25738459',
        doi: '10.1016/j.cmet.2015.02.009',
      },
      {
        id: 'kim-2018',
        title:
          'The Mitochondrial-Encoded Peptide MOTS-c Translocates to the Nucleus to Regulate Nuclear Gene Expression in Response to Metabolic Stress.',
        citation: 'Kim KH, Son JM, Benayoun BA, Lee C. Cell Metab. 2018;28(3):516-524.e7.',
        pmid: '29983246',
        doi: '10.1016/j.cmet.2018.06.008',
      },
      {
        id: 'reynolds-2021',
        title:
          'MOTS-c is an exercise-induced mitochondrial-encoded regulator of age-dependent physical decline and muscle homeostasis.',
        citation: 'Reynolds JC, Lai RW, Woodhead JST, et al. Nat Commun. 2021;12(1):470.',
        pmid: '33473109',
        doi: '10.1038/s41467-020-20790-0',
      },
      {
        id: 'lu-2019',
        title: 'MOTS-c peptide regulates adipose homeostasis to prevent ovariectomy-induced metabolic dysfunction.',
        citation: 'Lu H, Wei M, Zhai Y, et al. J Mol Med (Berl). 2019;97(4):473-485.',
        pmid: '30725119',
        doi: '10.1007/s00109-018-01738-w',
      },
      {
        id: 'cataldo-2018',
        title: 'Plasma MOTS-c levels are associated with insulin sensitivity in lean but not in obese individuals.',
        citation:
          'Cataldo LR, Fernandez-Verdejo R, Santos JL, Galgani JE. J Investig Med. 2018;66(6):1019-1022.',
        pmid: '29593067',
        doi: '10.1136/jim-2017-000681',
      },
      {
        id: 'dieli-conwright-2021',
        title:
          'Effect of aerobic and resistance exercise on the mitochondrial peptide MOTS-c in Hispanic and Non-Hispanic White breast cancer survivors.',
        citation: 'Dieli-Conwright CM, Sami N, Norris MK, et al. Sci Rep. 2021;11(1):16916.',
        pmid: '34413391',
        doi: '10.1038/s41598-021-96419-z',
      },
    ],
    evidenceReviewed: '2026-10-25',
  },
}

export function getProductResearchContent(slug: string | undefined | null) {
  if (!slug) return undefined
  return PRODUCT_RESEARCH_CONTENT[slug]
}
