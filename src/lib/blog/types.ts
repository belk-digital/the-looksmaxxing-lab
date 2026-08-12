// Unified shape used to merge Payload CMS blog-posts with the hardcoded
// JOURNAL_POSTS array so both render side by side on /journal listing +
// card components without those components needing to know the source.
export type UnifiedJournalPost = {
  slug: string
  title: string
  category: string
  date: string // display string, e.g. "August 12, 2026"
  sortDate: string // ISO string, used for sorting only
  readTime: string
  excerpt: string
  heroImage: string
  source: 'static' | 'cms'
}
