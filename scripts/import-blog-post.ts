// Imports a blog post into the blog-posts collection. Usage:
//   pnpm run import:blog -- blog-drafts/<slug>.json [blog-drafts/<slug>.webp]
// The JSON path's sibling image (same basename, .webp/.jpg/.jpeg/.png/.avif)
// is used automatically if a second argument isn't given.

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import { parseContentMarkdown, extractLinks, extractLinkPlaceholders } from '../src/lib/blog/markdownToLexical'

type Draft = {
  title: string
  slug?: string
  category: 'Emerging' | 'Guidelines' | 'Studies' | 'Guides'
  excerpt: string
  featuredImageAlt: string
  content: string
  readTime?: string
  keyTakeaways?: string[]
  faqs?: { question: string; answer: string }[]
  focusKeyphrase?: string
  keywords?: string
  metaTitle?: string
  metaDescription?: string
  relatedProducts?: string[]
  references?: { citationText: string; url: string }[]
  status?: 'draft' | 'published'
  publishedAt?: string
}

const MIME_BY_EXT: Record<string, string> = {
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.avif': 'image/avif',
}

function findImageFile(jsonPath: string, explicitImagePath?: string): string | null {
  if (explicitImagePath) return explicitImagePath
  const dir = path.dirname(jsonPath)
  const base = path.basename(jsonPath, '.json')
  for (const ext of ['.webp', '.jpg', '.jpeg', '.png', '.avif']) {
    const candidate = path.join(dir, base + ext)
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

// Real routes that aren't blog-posts/pages documents, so the link checker
// doesn't false-flag them. Keep in sync with the site's static route list.
const STATIC_ROUTES = new Set([
  '', 'shop', 'journal', 'cart', 'checkout', 'account', 'wishlist', 'affiliates', 'coa',
  'about', 'contact', 'faq', 'certificates', 'disclaimer', 'terms', 'privacy', 'refund',
  'peptide-calculator', 'login', 'register',
])

async function verifyInternalLinks(payload: any, content: string, warnings: string[]): Promise<void> {
  const links = extractLinks(content)
  const productSlugs = new Set<string>()
  const postSlugs = new Set<string>()

  for (const link of links) {
    const m = link.url.match(/^\/product\/([^/]+)$/)
    if (m) productSlugs.add(m[1])
    else if (/^\/journal\/([^/]+)$/.test(link.url)) postSlugs.add(link.url.replace(/^\/journal\//, ''))
    else if (/^\/[^/]+$/.test(link.url) && !STATIC_ROUTES.has(link.url.slice(1))) postSlugs.add(link.url.slice(1))
  }

  if (productSlugs.size > 0) {
    const { docs } = await payload.find({ collection: 'products', where: { slug: { in: Array.from(productSlugs) } }, limit: productSlugs.size, depth: 0 })
    const found = new Set(docs.map((d: any) => d.slug))
    for (const slug of productSlugs) if (!found.has(slug)) warnings.push(`Broken product link /product/${slug} — no matching product, left in place for manual review.`)
  }

  if (postSlugs.size > 0) {
    const [{ docs: posts }, { docs: pages }] = await Promise.all([
      payload.find({ collection: 'blog-posts', where: { slug: { in: Array.from(postSlugs) } }, limit: postSlugs.size, depth: 0 }),
      payload.find({ collection: 'pages', where: { slug: { in: Array.from(postSlugs) } }, limit: postSlugs.size, depth: 0 }).catch(() => ({ docs: [] })),
    ])
    const found = new Set([...posts.map((d: any) => d.slug), ...pages.map((d: any) => d.slug)])
    for (const slug of postSlugs) if (!found.has(slug)) warnings.push(`Broken internal link /journal/${slug} — no matching post or page, left in place for manual review. (Note: hardcoded journal-posts.tsx slugs aren't in Payload and will always warn here — check that file manually.)`)
  }

  for (const p of extractLinkPlaceholders(content)) warnings.push(`Unresolved link placeholder: <!-- LINK: ${p} --> — left as-is, needs a real slug.`)
}

async function resolveRelatedProducts(payload: any, names: string[], warnings: string[]): Promise<(number | string)[]> {
  const ids: (number | string)[] = []
  for (const name of names) {
    const { docs } = await payload.find({ collection: 'products', where: { name: { like: name } }, limit: 10, depth: 0 })
    if (docs.length === 0) { warnings.push(`Could not resolve relatedProducts entry "${name}" to a product — skipped.`); continue }
    // "like" is a substring match and doesn't rank exact matches first (e.g. "BPC-157"
    // would otherwise resolve to "BPC-157 Spray"), so prefer an exact case-insensitive
    // name match over the first substring hit.
    const exact = docs.find((d: any) => d.name?.toLowerCase() === name.toLowerCase())
    ids.push((exact || docs[0]).id)
  }
  return ids
}

async function run() {
  const [, , jsonArg, imageArg] = process.argv
  if (!jsonArg) { console.error('Usage: pnpm run import:blog -- <path-to-draft.json> [path-to-image]'); process.exit(1) }

  const jsonPath = path.resolve(process.cwd(), jsonArg)
  const draft: Draft = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const warnings: string[] = []
  const payload = await getPayload({ config: configPromise })

  const slug = draft.slug || draft.title.toLowerCase().replace(/\s+/g, '-')
  const { docs: existingPostDocs } = await payload.find({ collection: 'blog-posts', where: { slug: { equals: slug } }, limit: 1 })
  const existingPost = existingPostDocs[0]
  const existingImageId = existingPost?.featuredImage
    ? (typeof existingPost.featuredImage === 'object' ? existingPost.featuredImage.id : existingPost.featuredImage)
    : null

  // Replace the existing upload in place on re-import instead of creating a new
  // blog-media doc each time (which would otherwise pile up as filename-1, -2, ...).
  const imagePath = findImageFile(jsonPath, imageArg ? path.resolve(process.cwd(), imageArg) : undefined)
  if (!imagePath) { console.error(`No featured image found next to ${jsonPath} ... and none passed as second argument.`); process.exit(1) }
  const imageData = fs.readFileSync(imagePath)
  const imageFile = { data: imageData, mimetype: MIME_BY_EXT[path.extname(imagePath).toLowerCase()] || 'image/webp', name: path.basename(imagePath), size: imageData.length }
  const featuredImage = existingImageId
    ? await payload.update({ collection: 'blog-media', id: existingImageId, data: { alt: draft.featuredImageAlt }, file: imageFile })
    : await payload.create({ collection: 'blog-media', data: { alt: draft.featuredImageAlt }, file: imageFile })

  await verifyInternalLinks(payload, draft.content, warnings)
  const content = parseContentMarkdown(draft.content)
  const relatedProductIds = draft.relatedProducts?.length ? await resolveRelatedProducts(payload, draft.relatedProducts, warnings) : []

  // Fixed single author — resolve to the first admin account.
  const { docs: admins } = await payload.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })
  if (admins.length === 0) { console.error('No admin user found — create/designate the author account before importing.'); process.exit(1) }
  const authorUser = admins[0]

  const postData: any = {
    title: draft.title, slug, author: authorUser.id, featuredImage: featuredImage.id,
    excerpt: draft.excerpt, content,
    publishedAt: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : new Date().toISOString(),
    status: draft.status === 'published' ? 'published' : 'draft',
    category: draft.category, relatedProducts: relatedProductIds,
    readTime: draft.readTime || '',
    keyTakeaways: (draft.keyTakeaways || []).map((text) => ({ text })),
    faqs: draft.faqs || [], references: draft.references || [],
    focusKeyphrase: draft.focusKeyphrase || '', keywords: draft.keywords || '',
    metaTitle: draft.metaTitle || '', metaDescription: draft.metaDescription || '',
  }

  if (existingPost) {
    await payload.update({ collection: 'blog-posts', id: existingPost.id, data: postData })
    console.log(`Updated existing blog post: ${slug}`)
  } else {
    await payload.create({ collection: 'blog-posts', data: postData })
    console.log(`Created blog post: ${slug}`)
  }

  if (warnings.length > 0) { console.log('\nWarnings (review before publishing):'); for (const w of warnings) console.log(`  - ${w}`) }
  console.log(`\nStatus: ${postData.status}. View it at: /journal/${slug}`)
  process.exit(0)
}

run().catch((err) => { console.error(err); process.exit(1) })
