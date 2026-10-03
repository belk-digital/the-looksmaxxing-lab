export interface FaqItem {
  q: string
  /** Plain text with optional inline internal links written as [anchor text](/path). */
  a: string
}

export interface FaqCategory {
  title: string
  items: FaqItem[]
}

/**
 * Single source of truth for the FAQ page: the visible accordion and the FAQPage JSON-LD
 * are both built from this, so the schema always matches what visitors can read.
 * Facts (shipping, payment, refund window, cutoff) mirror the live Terms, Refund, Contact
 * and checkout configuration — update them here if those change.
 */
export const FAQ_DATA: FaqCategory[] = [
  {
    title: 'About Longevia Research',
    items: [
      {
        q: 'What is Longevia Research?',
        a: `Longevia Research is a US-based supplier of research-grade peptides and laboratory compounds for qualified researchers. Every product is sold for research use only and is backed by an independent Certificate of Analysis, so you can check a batch's purity before you rely on it. Browse the full catalog in our [research peptide shop](/shop) or read more [about us](/about).`,
      },
      {
        q: `Why can't I find Longevia Research online — is it spelled “longevity”?`,
        a: `We're spelled Longevia, with an “a”, and our website is longeviaresearch.com. It's easy to mistype as “longevity”, and some search engines auto-correct it. If that happens, search for “Longevia Research peptides” in quotes, or type longeviaresearch.com straight into your browser. We're a supplier of research-use-only peptides, not a longevity clinic or a health-advice service. You can see exactly what we sell in the [shop](/shop).`,
      },
      {
        q: 'Who can buy from Longevia Research?',
        a: `Orders are for adults (18, or the age of majority where you live) who are buying for laboratory research. You confirm you're a qualified researcher when you enter the site and again when you order, and you accept responsibility for safe handling, storage and disposal of every compound. The full conditions are in our [Terms & Conditions](/terms).`,
      },
      {
        q: 'What makes Longevia Research different from other peptide suppliers?',
        a: `Transparency you can check for yourself. Our peptides are US-synthesized, and every batch is tested by an independent laboratory for HPLC purity and LC-MS identity. The results are published batch by batch in our [COA library](/certificates), so you're never relying on a marketing claim alone. A batch that doesn't meet our ≥99% purity standard isn't sold.`,
      },
    ],
  },
  {
    title: 'Products & Catalog',
    items: [
      {
        q: 'What is a research peptide?',
        a: `A research peptide is a short chain of amino acids made for laboratory study, for example to investigate receptor signaling, cellular pathways or analytical methods. Research peptides are sold as laboratory reagents, not as drugs or supplements. If you're new to the field, our [beginner's guide to peptide research](/journal/what-is-peptide-research-beginners-guide) is a good place to start, and you can see real batch documentation in the [COA library](/certificates).`,
      },
      {
        q: 'What research peptides does Longevia Research sell?',
        a: `We offer more than 30 research compounds, supplied as vials, spray formats and blends, across eight research categories: Metabolic Research, Recovery & Tissue Repair, Growth Hormone Secretagogues, Cognitive & Nootropic, Hormonal Health, Immune Regulation, Mitochondrial & Cellular Energy and Longevity Research. Examples include [BPC-157](/products/bpc-157), [TB-500](/products/tb-500), [GHK-Cu](/products/ghk-cu), [NAD+](/products/nad-plus) and [Epithalon](/products/epithalon). Browse everything in the [shop](/shop).`,
      },
      {
        q: 'How do I find the right compound for my research?',
        a: `Start in the [shop](/shop) and filter by research category, or search by compound name. Each product page lists the available strengths and formats, and batch results are in our [COA library](/certificates) so you can compare before you order. If you're not sure where to begin, our [research journal](/journal) explains the science behind many of the compounds, or [ask our team](/contact) and we'll point you in the right direction.`,
      },
      {
        q: `What's the difference between the vial and spray versions of a compound?`,
        a: `Many compounds are listed in more than one format, and each product page states which one you're looking at. Vial listings are supplied as lyophilized powder in the strengths shown, for example [BPC-157](/products/bpc-157) in 5mg and 10mg vials. Spray listings are separate products, labeled with their content and number of sprays, such as the [BPC-157 spray](/products/bpc-157-spray) at 45 sprays each. Check the format, strength and price on the page before you order, and [contact us](/contact) if you're unsure which suits your work.`,
      },
      {
        q: 'What is in your GLOW and KLOW blends?',
        a: `Both are multi-peptide research blends. [GLOW](/products/glow-blend) is a 70mg blend of GHK-Cu (50mg), BPC-157 (10mg) and TB-500 (10mg). [KLOW](/products/klow-blend) is an 80mg four-component blend of GHK-Cu, BPC-157, TB-500 and KPV. Batch testing results for each lot are published in the [COA library](/certificates).`,
      },
      {
        q: 'Are your Semaglutide, Tirzepatide and GLP-3 products the same as prescription medicines?',
        a: `No. [Semaglutide](/products/semaglutide), [Tirzepatide](/products/tirzepatide) and [GLP-3 (Rt)](/products/glp-3) are sold only as research-use-only laboratory compounds. They are not prescription medicines, compounded drugs or supplements, and none has been evaluated by the FDA for human or veterinary use. To see how these compounds compare in the research literature, read our [head-to-head research comparison](/journal/semaglutide-vs-tirzepatide-vs-glp-3-comparison).`,
      },
    ],
  },
  {
    title: 'Purity, HPLC & Certificates of Analysis',
    items: [
      {
        q: 'How do I know your peptides are really ≥99% pure?',
        a: `Read the Certificate of Analysis (COA) for your batch. Each COA comes from an independent lab and reports HPLC purity and LC-MS identity for that specific lot number, so you can match it to the label on your vial. You'll find it in our [COA library](/certificates) and with your shipment. If you're new to reading them, our [guide to reading a peptide COA](/journal/peptide-coa-hplc-purity-testing-guide) walks through a real chromatogram.`,
      },
      {
        q: 'Where do I find the COA for my batch?',
        a: `There are three ways. A COA is included with every shipment, you can download past COAs from your Order History once you're logged in, and the public [COA library](/certificates) lists them by product. Can't find yours? Send your lot number to [our support team](/contact) and we'll retrieve the document for you.`,
      },
      {
        q: 'What is a Certificate of Analysis (COA)?',
        a: `A Certificate of Analysis is a laboratory document that reports the test results for one specific production batch, identified by its lot number. For research peptides it typically includes HPLC purity and LC-MS identity results, so you can check that the product in your vial matches its specification. Open examples in our [COA library](/certificates), or see [how to read a peptide COA](/journal/peptide-coa-hplc-purity-testing-guide) step by step.`,
      },
      {
        q: 'What does “≥99% HPLC purity” actually mean?',
        a: `HPLC separates a sample so the target peptide can be measured against everything else in the vial. A result of ≥99% means at least 99% of the measured signal belongs to the intended peptide. It's a chromatographic purity figure: it doesn't by itself tell you the water, salt or counterion content of the powder, which is measured separately as net peptide content. See [why peptide purity matters](/journal/why-peptide-purity-matters-in-scientific-research) for the full picture.`,
      },
      {
        q: `What's the difference between HPLC and LC-MS on a COA?`,
        a: `HPLC tells you how pure a sample is; LC-MS confirms what it is by measuring molecular mass. You want both, because a sample can be 99% one compound and still be the wrong compound. A complete COA lists both results next to the batch or lot number. Our [sourcing and COA checklist](/journal/sourcing-nad-research-compound-coa-purity-checks) shows what to look for before you trust any supplier's paperwork.`,
      },
      {
        q: 'Which tests do you run on each batch?',
        a: `Our testing program covers HPLC purity, LC-MS identity confirmation, endotoxin, sterility, content quantification and a physical appearance check. The COA for your lot shows the results reported for that batch alongside its lot number. You can open real examples for any product in the [COA library](/certificates) before you order.`,
      },
      {
        q: 'Why does my vial look almost empty?',
        a: `A small white cake, a thin film, or even a barely visible layer is normal. Peptides are freeze-dried into a very light powder, so a few milligrams take up almost no space, and some can spread onto the vial wall during shipping. Vials are labeled by mass (mg), not by how full they look. If you're still concerned, contact [support](/contact) within 48 hours of delivery with a photo and your order number.`,
      },
      {
        q: 'What does “lyophilized” mean?',
        a: `Lyophilized means freeze-dried: water is removed under vacuum at low temperature, leaving a dry, stable powder that stays intact far longer than a liquid solution. That's why most research peptides, including the compounds in our [shop](/shop), ship as powder rather than as a liquid.`,
      },
    ],
  },
  {
    title: 'Ordering, Payment & Shipping',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: `You can pay with any of the payment methods presented at checkout, and all prices are listed in USD unless stated otherwise. Payment details are processed securely by a third-party payment provider, and we don't store full card numbers on our servers. Your order is processed once your payment has been successfully authorized. More detail is in our [Terms & Conditions](/terms) and [Privacy Policy](/privacy).`,
      },
      {
        q: 'When will my order ship, and how long does delivery take?',
        a: `Your order is processed once your payment has been successfully authorized, and it ships from our US-based facilities. Delivery timeframes are estimates: carrier logistics and customs processing can change them, and both are outside our control. If your order looks overdue, [contact our team](/contact) with your order number. The shipping conditions are set out in our [Terms](/terms).`,
      },
      {
        q: 'Do you ship internationally?',
        a: `We ship from our US-based facilities to approved domestic and international destinations. Because these are research-use compounds, each country's import regulations apply, and it's your responsibility to make sure your order can legally enter your destination. If you're not sure your location is approved, [contact us](/contact) before you order.`,
      },
      {
        q: `Where is my order, and what if it hasn't arrived?`,
        a: `Order updates go to the email address on your order, and your order history is available in your account. Delivery times are estimates and can shift with carrier and customs delays. If you can't find your shipping details, or your order is well past its estimate, email support@longeviaresearch.com through our [contact page](/contact) with your order number. If your order arrived with a problem, see the answer below about damaged or incorrect orders, because issues must be reported within 48 hours of delivery.`,
      },
      {
        q: 'Can I change or cancel my order after placing it?',
        a: `You can request a modification or cancellation before your order ships, and each request is subject to review. Contact [support](/contact) as soon as you can with your order number. Once an order has shipped, all sales are final under our [refund and returns policy](/refund).`,
      },
      {
        q: 'Why was my order cancelled?',
        a: `An order can only be processed once its payment has been successfully authorized. Orders can also be cancelled, and accounts suspended, if our [Terms & Conditions](/terms) are breached, for example by using products for an illegal purpose, reselling or redistributing them, or applying them for any non-laboratory purpose. If you believe a cancellation was a mistake, [contact us](/contact) with your order number.`,
      },
      {
        q: 'What personal information do you collect when I order?',
        a: `To process and ship your order we collect your name, email address, phone number, and billing and shipping addresses, plus your order history if you have an account. We don't sell your personal data. It's shared only with service providers who handle payment, shipping and technical infrastructure, or when the law requires it. You can ask to access, correct or delete your data by emailing support@longeviaresearch.com. Read our [Privacy Policy](/privacy).`,
      },
      {
        q: 'Do you offer wholesale or bulk pricing?',
        a: `Yes, we offer special pricing tiers for bulk purchases by licensed laboratories and academic institutions. Choose “Wholesale” in the department menu on our [contact form](/contact), or email support@longeviaresearch.com directly, and tell us which compounds and quantities you need.`,
      },
    ],
  },
  {
    title: 'Order & Account Help',
    items: [
      {
        q: 'My order arrived damaged or incorrect. What should I do?',
        a: `Contact us within 48 hours of delivery through the [contact page](/contact) or at support@longeviaresearch.com. Include your order number and photos of the product, the vial label and the outer packaging as you received them. We replace an order at no additional cost if it arrived visibly damaged or with a broken seal, if it was the wrong product or quantity, or if it doesn't match the batch specification on its Certificate of Analysis. Our team reviews each report and responds within 3–5 business days. Full details are in our [refund and returns policy](/refund).`,
      },
      {
        q: 'Can I return a product or get a refund?',
        a: `All sales are final. Once an order ships, we can't offer refunds, exchanges or returns for any reason, including change of mind, unused product or an unopened vial, because once a vial leaves our facility we can no longer verify how it was stored or handled. The exceptions are the replacement cases above, and those are replaced rather than refunded, with no cash or store-credit refunds. Opened or used vials, and issues reported after 48 hours, aren't covered. Read the [full policy](/refund).`,
      },
      {
        q: 'How do I reset my password?',
        a: `Open the [password reset page](/forgot-password), enter the email address on your account, and follow the reset link we email you. If it doesn't arrive within a few minutes, check your spam folder, then [contact support](/contact) and we'll help you get back into your account. Please keep your login details private, and tell us straight away if you suspect anyone else has used your account.`,
      },
      {
        q: 'How do I contact customer support?',
        a: `Use the [contact form](/contact) or email support@longeviaresearch.com. For the fastest help, include your order number, and for anything about a specific batch, the lot number from your vial label. For damaged or incorrect orders, please write within 48 hours of delivery so we can review your report.`,
      },
    ],
  },
  {
    title: 'Storage & Handling',
    items: [
      {
        q: 'How should I store lyophilized peptides when they arrive?',
        a: `Move the sealed vial to a freezer at −20°C or below for long-term storage, and keep it away from light and moisture. Avoid repeated freeze-thaw cycles, which can damage the peptide over time. Your batch's [Certificate of Analysis](/certificates) and product documentation are your reference for that specific lot.`,
      },
      {
        q: 'What is bacteriostatic water?',
        a: `Bacteriostatic water is sterile water with 0.9% benzyl alcohol added as a preservative. Laboratories use it as a solvent for lyophilized peptides in analytical work. We offer it as a [laboratory reconstitution solution](/products/reconstitution-solution) and, like everything we sell, it isn't for human or veterinary use.`,
      },
    ],
  },
  {
    title: 'Research Use Only & Compliance',
    items: [
      {
        q: 'What does “research use only” (RUO) mean?',
        a: `“Research use only” means a product is intended solely for laboratory research, such as in-vitro or analytical work by qualified researchers. RUO products are not drugs, supplements or food, and they aren't approved to diagnose, treat or prevent any condition. Every Longevia Research product is labeled this way, and buyers confirm research use when they order. Read the [full disclaimer](/disclaimer).`,
      },
      {
        q: 'Can I use Longevia Research peptides on myself or animals?',
        a: `No. Everything we sell is a laboratory reagent, not a medicine, supplement or food, and none of it has been evaluated by the FDA for human or veterinary use. We can't give personal health or usage advice. If you have a health question, please talk to a licensed healthcare professional. More detail is in our [medical and research-use disclaimer](/disclaimer).`,
      },
      {
        q: 'Are research peptides legal to buy?',
        a: `Rules vary by country and by state, and “research use only” is a labeling and intended-use category, not a legal exemption. We can't give legal advice, so please check the regulations that apply to you before ordering. What we can say is that every product here is sold only as a laboratory reagent to buyers who confirm research use. See our [Terms](/terms) and [disclaimer](/disclaimer).`,
      },
      {
        q: 'Can I earn commission by referring other researchers?',
        a: `Yes. Our [affiliate program](/affiliates) pays 15% commission on referred sales, with real-time tracking and payouts once approved commissions reach $30. It's designed for people who present products as research-use-only, without medical or performance claims.`,
      },
      {
        q: 'Where can I learn more about the compounds you sell?',
        a: `Our [research journal](/journal) publishes referenced articles on the compounds and the testing behind them. Good starting points are [what peptide research is](/journal/what-is-peptide-research-beginners-guide) and [the research peptides to know about in 2026](/journal/best-research-peptides-to-know-about-2026). To see what's available, browse compounds such as [BPC-157](/products/bpc-157), [GHK-Cu](/products/ghk-cu) and [NAD+](/products/nad-plus) in the [shop](/shop).`,
      },
    ],
  },
]

const LINK_RE = /\[([^\]]+)\]\((\/[^)\s]*)\)/g

/** Removes the inline link markup, leaving plain text (used for JSON-LD and search). */
export function stripLinks(text: string): string {
  return text.replace(LINK_RE, '$1')
}

/** Splits an answer into text and internal-link parts for rendering. */
export function parseAnswer(text: string): Array<{ type: 'text'; value: string } | { type: 'link'; label: string; href: string }> {
  const parts: Array<{ type: 'text'; value: string } | { type: 'link'; label: string; href: string }> = []
  let last = 0
  for (const match of text.matchAll(LINK_RE)) {
    const index = match.index ?? 0
    if (index > last) parts.push({ type: 'text', value: text.slice(last, index) })
    parts.push({ type: 'link', label: match[1], href: match[2] })
    last = index + match[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

export function faqAnchor(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
