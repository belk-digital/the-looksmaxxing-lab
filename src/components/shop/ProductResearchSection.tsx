import React from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/container'
import { getProductResearchContent } from '@/data/product-research-content'

/**
 * Renders the citation-anchored research section for a product page, if one is defined for
 * the slug in product-research-content.ts. Server-rendered and intentionally not a client
 * component, so the copy ships in the HTML and stays out of the client bundle.
 *
 * Returns null for any slug without an entry, so product pages are unchanged by default.
 */
export function ProductResearchSection({ slug }: { slug?: string | null }) {
  const content = getProductResearchContent(slug)
  if (!content) return null

  const refIndex = new Map(content.references.map((r, i) => [r.id, i + 1]))

  return (
    <section
      className="w-full border-t border-blue-100/50 bg-white py-24"
      aria-labelledby="product-research-heading"
    >
      <Container size="wide">
        <div className="max-w-4xl">
          <span className="text-label-sm mb-4 block font-bold uppercase tracking-[0.2em] text-[#5984c4]">
            Published Research
          </span>
          <h2
            id="product-research-heading"
            className="mb-8 text-3xl font-semibold tracking-tight text-ink sm:text-4xl"
          >
            {content.heading}
          </h2>

          <p className="mb-12 text-lg leading-relaxed text-ink/80">{content.lead}</p>

          {content.sections.map((section) => (
            <div key={section.heading} className="mb-12">
              <h3 className="mb-4 text-xl font-semibold text-ink">{section.heading}</h3>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mb-4 leading-relaxed text-ink/70 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Research summary table */}
        <div className="mb-12">
          <h3 className="mb-2 text-xl font-semibold text-ink">{content.tableHeading}</h3>
          <p className="mb-6 max-w-4xl text-sm text-ink/60">{content.tableCaption}</p>

          <div className="overflow-x-auto rounded-2xl border border-blue-100/70">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <caption className="sr-only">{content.tableCaption}</caption>
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th scope="col" className="px-5 py-4 font-bold text-ink">
                    Research topic
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold text-ink">
                    Study model
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold text-ink">
                    Main finding
                  </th>
                  <th scope="col" className="px-5 py-4 font-bold text-ink">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody>
                {content.studies.map((row) => (
                  <tr key={row.topic} className="border-t border-blue-100/70 align-top">
                    <th scope="row" className="px-5 py-4 text-left font-semibold text-ink">
                      {row.topic}
                    </th>
                    <td className="px-5 py-4 text-ink/70">{row.model}</td>
                    <td className="px-5 py-4 text-ink/70">{row.finding}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-ink/70">
                      {row.sourceLabel}
                      {refIndex.has(row.sourceRef) ? ` [${refIndex.get(row.sourceRef)}]` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="max-w-4xl">
          {content.sectionsAfterTable.map((section) => (
            <div key={section.heading} className="mb-12">
              <h3 className="mb-4 text-xl font-semibold text-ink">{section.heading}</h3>
              {section.paragraphs.map((p, i) => (
                <p key={i} className="mb-4 leading-relaxed text-ink/70 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ))}

          <div className="mb-12">
            <h3 className="mb-6 text-xl font-semibold text-ink">{content.faqHeading}</h3>
            <dl>
              {content.faqs.map((faq) => (
                <div key={faq.question} className="mb-6 last:mb-0">
                  <dt className="mb-2 font-semibold text-ink">{faq.question}</dt>
                  <dd className="leading-relaxed text-ink/70">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-blue-100/50 bg-[#f8fafc] p-6 sm:p-8">
            <h3 className="mb-4 text-xl font-semibold text-ink">{content.referencesHeading}</h3>
            <ol className="list-none space-y-4 text-sm">
              {content.references.map((ref, i) => (
                <li key={ref.id} className="flex gap-3 text-ink/70">
                  <span className="shrink-0 font-semibold text-ink">[{i + 1}]</span>
                  <span>
                    {ref.citation} {ref.title}{' '}
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${ref.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5984c4] underline hover:text-ink"
                    >
                      PMID {ref.pmid}
                    </a>
                    {' · '}
                    <a
                      href={`https://doi.org/${ref.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#5984c4] underline hover:text-ink"
                    >
                      doi:{ref.doi}
                    </a>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-xs text-ink/50">
              Evidence base last reviewed against PubMed on {content.evidenceReviewed}. Citations
              are provided so readers can check the primary sources directly. Longevia Research is
              not affiliated with the authors or journals listed.{' '}
              <Link
                href="/journal/why-peptide-purity-matters-in-scientific-research"
                className="text-[#5984c4] underline hover:text-ink"
              >
                How to read a certificate of analysis
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  )
}
