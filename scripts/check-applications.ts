import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  
  const apps = await payload.find({
    collection: 'affiliate-applications',
    overrideAccess: true,
  })
  
  console.log(`Found ${apps.docs.length} applications.`)
  console.log(apps.docs)
  
  const users = await payload.find({
    collection: 'users',
    overrideAccess: true,
  })
  console.log(`Found ${users.docs.length} users.`)
  
  process.exit(0)
}

run()
