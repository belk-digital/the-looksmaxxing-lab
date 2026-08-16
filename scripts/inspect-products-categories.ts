import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function inspect() {
  const { getPayload } = await import('payload')
  const config = (await import('../src/payload.config')).default
  const payload = await getPayload({ config })

  console.log('--- FETCHING CATEGORIES ---')
  const categoriesRes = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
    overrideAccess: true,
  })

  console.log(`Total Categories: ${categoriesRes.docs.length}`)
  const categoryMap: { [id: string]: string } = {}
  categoriesRes.docs.forEach((cat: any) => {
    categoryMap[cat.id] = cat.name
    console.log(`ID: ${cat.id} | Slug: ${cat.slug} | Name: "${cat.name}" | isVisible: ${cat.isVisible}`)
  })

  console.log('\n--- FETCHING PRODUCTS ---')
  const productsRes = await payload.find({
    collection: 'products',
    limit: 200,
    sort: 'name',
    overrideAccess: true,
  })

  console.log(`Total Products: ${productsRes.docs.length}`)
  productsRes.docs.forEach((p: any) => {
    const currentCatNames = (p.categories || []).map((c: any) => {
      if (typeof c === 'object' && c !== null) return c.name || categoryMap[c.id] || c.id
      return categoryMap[c] || c
    })
    console.log(`ID: ${p.id} | Slug: ${p.slug} | Name: "${p.name}" | Current Categories: [${currentCatNames.join(', ')}]`)
  })

  process.exit(0)
}

inspect().catch(err => {
  console.error(err)
  process.exit(1)
})
