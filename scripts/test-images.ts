import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'

async function run() {
  const payload = await getPayload({ config })
  const products = await payload.find({ collection: 'products', depth: 1, limit: 1 })
  const imgObj = products.docs[0].images?.[0]?.image
  console.log("Image Object:", JSON.stringify(imgObj, null, 2))
  process.exit(0)
}

run()
