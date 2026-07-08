import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import 'dotenv/config'

const productCategoryMap: Record<string, string[]> = {
  'Tirzepatide': ['Metabolic Research Peptides', 'Receptor Agonist Research Peptides'],
  'Retatrutide': ['Metabolic Research Peptides', 'Receptor Agonist Research Peptides'],
  'Semaglutide': ['Metabolic Research Peptides', 'Receptor Agonist Research Peptides'],
  'MOTS-C': ['Metabolic Research Peptides', 'Cellular Health Research'],
  
  'BPC-157': ['Recovery Research Peptides'],
  'TB-500': ['Recovery Research Peptides'],
  'BPC-157/TB-500': ['Recovery Research Peptides'],
  'KPV': ['Recovery Research Peptides', 'Cellular Health Research'],
  'LL-37': ['Recovery Research Peptides', 'Cellular Health Research'],
  'GHK-CU': ['Recovery Research Peptides', 'Cellular Health Research'],
  
  'Tesamorelin': ['Growth Factor Research Peptides'],
  'Ipamorelin': ['Growth Factor Research Peptides'],
  'CJC-1295 No DAC': ['Growth Factor Research Peptides'],
  'Sermorelin': ['Growth Factor Research Peptides'],
  'CJC-1295 / Ipamorelin': ['Growth Factor Research Peptides'],
  'Tesamorelin / Ipamorelin': ['Growth Factor Research Peptides'],

  'Semax': ['Cognitive Function Studies'],
  'Selank': ['Cognitive Function Studies'],
  'Semax / Selank': ['Cognitive Function Studies'],

  'Melanotan I': ['Receptor Agonist Research Peptides'],
  'Melanotan II': ['Receptor Agonist Research Peptides'],
  'Kisspeptin': ['Receptor Agonist Research Peptides', 'Bioregulators'],
  'Oxytocin': ['Receptor Agonist Research Peptides', 'Bioregulators'],

  'Epithalon': ['Cellular Health Research', 'Bioregulators'],
  'Glutathione': ['Cellular Health Research', 'Essentials'],
  'NAD+': ['Cellular Health Research', 'Essentials'],
  'Lipo-C': ['Essentials', 'Metabolic Research Peptides'],
  'BAC Water': ['Essentials'],
  
  'Glow Blend': ['Recovery Research Peptides', 'Essentials'],
  'KLOW Blend': ['Recovery Research Peptides', 'Essentials'],
}

async function mapProducts() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 100,
  })

  const categoryIdMap = new Map<string, number>()
  for (const cat of categories.docs) {
    categoryIdMap.set((cat.name as string).toLowerCase(), cat.id as number)
  }

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 1000,
  })

  for (const p of products.docs) {
    const targetCats = productCategoryMap[p.name as string]
    
    if (targetCats) {
      const resolvedIds: number[] = []
      for (const catName of targetCats) {
        const id = categoryIdMap.get(catName.toLowerCase())
        if (id) resolvedIds.push(id)
      }
      
      if (resolvedIds.length > 0) {
        await payload.update({
          collection: 'products',
          id: p.id,
          data: { categories: resolvedIds as any },
          overrideAccess: true,
        })
        console.log(`Updated ${p.name} with categories: ${targetCats.join(', ')}`)
      } else {
        console.log(`Could not find DB IDs for categories of ${p.name}: ${targetCats.join(', ')}`)
      }
    } else {
      console.log(`No manual mapping found for ${p.name}`)
    }
  }

  console.log('Mapping complete!')
  process.exit(0)
}

mapProducts().catch(console.error)
