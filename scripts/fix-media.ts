import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function fixMedia() {
  const payload = await getPayload({ config: configPromise })
  
  const { docs: mediaFiles } = await payload.find({
    collection: 'media',
    limit: 1000,
  })

  let fixed = 0;
  for (const doc of mediaFiles) {
    let filename = doc.filename
    if (!filename) continue;

    // Check if filename has -1.webp or -1-something.webp
    // A regex to replace -1 before the extension
    if (filename.includes('-1.')) {
      const newFilename = filename.replace('-1.', '.')
      console.log(`Fixing ${filename} -> ${newFilename}`)
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {
          filename: newFilename,
        }
      })
      fixed++
    }
    
    // Also check the sizes object
    if (doc.sizes) {
      const updatedSizes: any = { ...doc.sizes }
      let sizesChanged = false
      for (const key of Object.keys(updatedSizes)) {
        if (updatedSizes[key] && updatedSizes[key].filename && updatedSizes[key].filename.includes('-1.')) {
          updatedSizes[key].filename = updatedSizes[key].filename.replace('-1.', '.')
          sizesChanged = true
        }
      }
      
      if (sizesChanged) {
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: {
            sizes: updatedSizes,
          }
        })
        console.log(`Fixed sizes for ${filename}`)
        fixed++
      }
    }
  }

  console.log(`Finished fixing ${fixed} media records.`)
  process.exit(0)
}

fixMedia().catch(console.error)
