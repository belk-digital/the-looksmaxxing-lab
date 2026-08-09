import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'

const searchTerms = [
  { search: /The Looksmaxxing Lab/g, replace: 'Longevia Research' },
  { search: /thelooksmaxxinglab\.com/g, replace: 'longeviaresearch.com' },
  { search: /thelooksmaxxinglab/g, replace: 'longeviaresearch' },
  { search: /Looksmaxxing Lab/g, replace: 'Longevia Research' },
  { search: /looksmaxxing/gi, replace: 'longevia' },
]

function replaceText(text: string | null | undefined): string | null | undefined {
  if (!text) return text
  let modified = text
  let changed = false
  for (const { search, replace } of searchTerms) {
    if (search.test(modified)) {
      modified = modified.replace(search, replace)
      changed = true
    }
  }
  return changed ? modified : null
}

async function run() {
  const payload = await getPayload({ config })
  console.log('Connected to Payload')

  // 1. Update Products
  const products = await payload.find({ collection: 'products', limit: 1000 })
  let productUpdates = 0
  for (const doc of products.docs) {
    const updates: any = {}
    const newName = replaceText(doc.name)
    if (newName) updates.name = newName

    const newSeoTitle = replaceText(doc.meta?.title)
    const newSeoDesc = replaceText(doc.meta?.description)
    if (newSeoTitle || newSeoDesc) {
      updates.meta = { ...doc.meta }
      if (newSeoTitle) updates.meta.title = newSeoTitle
      if (newSeoDesc) updates.meta.description = newSeoDesc
    }

    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'products',
        id: doc.id,
        data: updates,
      })
      productUpdates++
      console.log(`Updated product: ${doc.name}`)
    }
  }
  console.log(`Updated ${productUpdates} products.`)

  // 2. Update Categories
  const categories = await payload.find({ collection: 'categories', limit: 1000 })
  let categoryUpdates = 0
  for (const doc of categories.docs) {
    const updates: any = {}
    const newTitle = replaceText(doc.title)
    if (newTitle) updates.title = newTitle

    const newSeoTitle = replaceText(doc.meta?.title)
    const newSeoDesc = replaceText(doc.meta?.description)
    if (newSeoTitle || newSeoDesc) {
      updates.meta = { ...doc.meta }
      if (newSeoTitle) updates.meta.title = newSeoTitle
      if (newSeoDesc) updates.meta.description = newSeoDesc
    }

    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'categories',
        id: doc.id,
        data: updates,
      })
      categoryUpdates++
      console.log(`Updated category: ${doc.title}`)
    }
  }
  console.log(`Updated ${categoryUpdates} categories.`)

  // 3. Update Pages
  const pages = await payload.find({ collection: 'pages', limit: 1000 })
  let pageUpdates = 0
  for (const doc of pages.docs) {
    const updates: any = {}
    const newTitle = replaceText(doc.title)
    if (newTitle) updates.title = newTitle

    const newSeoTitle = replaceText(doc.meta?.title)
    const newSeoDesc = replaceText(doc.meta?.description)
    if (newSeoTitle || newSeoDesc) {
      updates.meta = { ...doc.meta }
      if (newSeoTitle) updates.meta.title = newSeoTitle
      if (newSeoDesc) updates.meta.description = newSeoDesc
    }

    if (Object.keys(updates).length > 0) {
      await payload.update({
        collection: 'pages',
        id: doc.id,
        data: updates,
      })
      pageUpdates++
      console.log(`Updated page: ${doc.title}`)
    }
  }
  console.log(`Updated ${pageUpdates} pages.`)

  process.exit(0)
}

run().catch(console.error)
