import { getPayload } from 'payload'
import configPromise from '@payload-config'

async function checkConversions() {
  const payload = await getPayload({ config: configPromise })
  
  const orders = await payload.find({ collection: 'orders', limit: 5, sort: '-createdAt' })
  console.log("Recent Orders:")
  for (const o of orders.docs) {
    console.log(`- ID: ${o.id}, Subtotal: ${o.subtotal}, Coupon: ${o.couponCode}, Payment: ${o.paymentStatus}`)
  }

  const conversions = await payload.find({ collection: 'affiliate-conversions', limit: 5, sort: '-createdAt' })
  console.log("\nRecent Conversions:")
  for (const c of conversions.docs) {
    console.log(`- ID: ${c.id}, Affiliate: ${typeof c.affiliate === 'object' ? c.affiliate?.id : c.affiliate}, Order: ${typeof c.order === 'object' ? c.order?.id : c.order}, Source: ${c.attributionSource}, Status: ${c.status}`)
  }
}

checkConversions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
