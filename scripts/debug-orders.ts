import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function checkOrders() {
  const payload = await getPayload({ config: configPromise })
  const orders = await payload.find({
    collection: 'orders',
    overrideAccess: true,
  })
  
  console.log('Orders found:', orders.docs.length)
  orders.docs.forEach(o => {
    console.log(`ID: ${o.id}, GuestEmail: ${o.guestEmail}, Owner: ${typeof o.owner === 'object' ? o.owner?.id : o.owner}`)
  })

  const users = await payload.find({
    collection: 'users',
    overrideAccess: true,
  })
  console.log('Users found:', users.docs.length)
  users.docs.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}`)
  })
}

checkOrders().catch(console.error).then(() => process.exit(0))
