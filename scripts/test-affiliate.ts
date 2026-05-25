import { getPayload } from 'payload'
import config from '../src/payload.config'
import 'dotenv/config'

async function run() {
  const payload = await getPayload({ config })
  
  // 1. Get user or create dummy user
  const user = await payload.find({ collection: 'users', where: { email: { equals: 'dummy@test.com' } }, limit: 1 })
  let userId = user.docs.length > 0 ? user.docs[0].id : null

  if (!userId) {
    const newUser = await payload.create({
      collection: 'users',
      data: { email: 'dummy@test.com', password: 'password123', role: 'customer' }
    })
    userId = newUser.id
  }

  // 2. Create an affiliate application
  const app = await payload.create({
    collection: 'affiliate-applications',
    data: {
      user: userId,
      status: 'pending',
      displayName: 'Alex Smith',
      promotionMethods: 'Instagram stories and TikTok',
      agreedToTerms: true,
      websiteUrl: 'https://alexsmith.com',
      socialLinks: [{ platform: 'instagram', url: 'https://instagram.com/alexsmith' }],
    } as any,
  })
  console.log(`Created pending application for Alex Smith (ID: ${app.id})`)

  // 3. Update the application to approved (This should trigger the hook!)
  console.log('Admin is approving the application...')
  const updatedApp = await payload.update({
    collection: 'affiliate-applications',
    id: app.id,
    data: {
      status: 'approved',
    } as any,
  })

  // 4. Check if affiliate profile was created and linked
  if (updatedApp.linkedAffiliate) {
    console.log(`SUCCESS! Affiliate linked to application. Affiliate ID: ${typeof updatedApp.linkedAffiliate === 'object' ? updatedApp.linkedAffiliate.id : updatedApp.linkedAffiliate}`)
    
    // Fetch affiliate to see coupon and slug
    const affiliate = await payload.findByID({
      collection: 'affiliates',
      id: typeof updatedApp.linkedAffiliate === 'object' ? (updatedApp.linkedAffiliate as any).id : updatedApp.linkedAffiliate,
    })
    
    console.log(`Affiliate Details:
    - Display Name: ${affiliate.displayName}
    - Referral Slug: ${affiliate.referralSlug}
    - Coupon Code: ${affiliate.couponCode}
    `)
  } else {
    console.error('FAILED! The hook did not link the affiliate to the application.')
  }

  process.exit(0)
}

run().catch(console.error)
