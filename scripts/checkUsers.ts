import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config: configPromise })
  const users = await payload.find({
    collection: 'users',
    overrideAccess: true,
  })
  
  console.log('Total users:', users.totalDocs)
  users.docs.forEach(u => {
    console.log(`User: ${u.email}, Clerk ID: ${u.clerkUserId}, ID: ${u.id}`)
  })
  
  const wishlists = await payload.find({
    collection: 'wishlists',
    overrideAccess: true,
  })
  console.log('Total wishlists:', wishlists.totalDocs)
  wishlists.docs.forEach(w => {
    console.log(`Wishlist ID: ${w.id}, User ID: ${typeof w.user === 'object' ? w.user?.id : w.user}, Items count: ${w.items?.length || 0}`)
  })
  
  process.exit(0)
}

run().catch(console.error)
