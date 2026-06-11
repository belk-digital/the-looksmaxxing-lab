import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const fees = await payload.find({
    collection: 'processing-fees',
    depth: 0
  })
  console.log(JSON.stringify(fees.docs, null, 2))
  process.exit(0)
}

run()
