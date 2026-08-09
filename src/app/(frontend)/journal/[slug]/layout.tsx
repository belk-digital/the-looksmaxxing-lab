import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Article | Research Journal',
  description: 'Read research articles, peptide science guides, and laboratory insights from Longevia Research.',
  robots: { index: true, follow: true },
}

export default function JournalArticleLayout({ children }: { children: React.ReactNode }) {
  return children
}
