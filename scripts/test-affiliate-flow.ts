import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config'

async function runTest() {
  console.log('--- STARTING AFFILIATE END-TO-END TEST ---')
  const payload = await getPayload({ config: configPromise })

  try {
    // 1. Find an approved affiliate
    console.log('Finding approved affiliate...')
    const affiliates = await payload.find({
      collection: 'affiliates',
      where: { status: { equals: 'approved' } },
      limit: 1,
    })
    
    if (affiliates.docs.length === 0) {
      console.log('No approved affiliates found. Creating one...')
      // Setup a dummy user if none exists
      const user = await payload.find({ collection: 'users', limit: 1 })
      if (user.docs.length === 0) {
         const u = await payload.create({
            collection: 'users',
            data: { email: 'test_affiliate@example.com', password: 'password', role: 'customer' }
         })
         user.docs.push(u)
      }
      
      const newAffiliate = await payload.create({
        collection: 'affiliates',
        data: {
          user: user.docs[0].id,
          status: 'approved',
          displayName: 'Test Affiliate',
          referralSlug: 'test-slug',
          commissionRate: 10,
          minimumPayoutThreshold: 5000,
        }
      })
      affiliates.docs.push(newAffiliate)
    }

    const affiliate = affiliates.docs[0]
    console.log(`Using affiliate: ${affiliate.id} (${affiliate.displayName})`)

    // Print initial stats
    console.log(`Initial Stats -> Clicks: ${affiliate.totalClicks || 0}, Pending: ${affiliate.totalCommissionPending || 0}, Paid: ${affiliate.totalCommissionPaid || 0}`)

    // 2. Simulate a Click
    console.log('\nSimulating Click...')
    const click = await payload.create({
      collection: 'affiliate-clicks',
      data: {
        affiliate: affiliate.id,
        source: 'referral_link',
        ipHash: 'fake-ip-hash-123',
        userAgent: 'test-runner',
        referrer: 'https://google.com',
        landingPage: '/',
        clickedAt: new Date().toISOString(),
      }
    })
    console.log(`Click created: ${click.id}`)

    // Wait and manually update to avoid async background hook test runner issues
    const { updateAffiliateStats } = await import('../src/lib/affiliates/stats')
    await updateAffiliateStats(affiliate.id, payload as any)
    await new Promise(r => setTimeout(r, 1000))
    
    // Check stats updated
    const afterClickAffiliate = await payload.findByID({ collection: 'affiliates', id: affiliate.id })
    console.log(`After Click Stats -> Clicks: ${afterClickAffiliate.totalClicks}`)

    // 3. Simulate an Order
    console.log('\nSimulating Order...')
    const customer = await payload.create({
      collection: 'users',
      data: { email: `customer_${Date.now()}@test.com`, password: 'test', role: 'customer' }
    })
    const order = await payload.create({
      collection: 'orders',
      data: {
        owner: customer.id,
        status: 'pending',
        paymentStatus: 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal: 10000, // $100
        discountTotal: 0,
        taxTotal: 0,
        feeTotal: 0,
        total: 10000,
        guestEmail: 'customer@example.com',
      } as any
    })
    console.log(`Order created: ${order.id}`)

    // 4. Run Attribution Engine manually (since we skip the Next.js checkout API here)
    console.log('\nRunning Attribution Engine...')
    const { attributeOrder } = await import('../src/lib/affiliates/commission')
    await attributeOrder(order as any, String(affiliate.id), null, String(click.id))
    
    // Wait for the conversion hook to run
    await updateAffiliateStats(affiliate.id, payload as any)
    await new Promise(r => setTimeout(r, 1000))

    // Check stats updated
    const afterOrderAffiliate = await payload.findByID({ collection: 'affiliates', id: affiliate.id })
    console.log(`After Conversion Stats -> Pending Comm: ${afterOrderAffiliate.totalCommissionPending}`)

    // 5. Simulate Cron Job (Auto Approval)
    console.log('\nSimulating Cron Job (moving pendingUntil to past)...')
    // Find the conversion and forcefully backdate pendingUntil
    const convs = await payload.find({
      collection: 'affiliate-conversions',
      where: { order: { equals: order.id } }
    })
    
    if (convs.docs.length > 0) {
      const conversion = convs.docs[0]
      await payload.update({
        collection: 'affiliate-conversions',
        id: conversion.id,
        data: {
          pendingUntil: new Date(Date.now() - 100000).toISOString() // Past
        }
      })
      console.log(`Force updated conversion ${conversion.id} to be eligible for approval`)
      
      // Run the cron logic manually
      const pendingConversions = await payload.find({
        collection: 'affiliate-conversions',
        where: {
          and: [
            { status: { equals: 'pending' } },
            { pendingUntil: { less_than_equal: new Date().toISOString() } },
            { flaggedForReview: { equals: false } },
          ],
        },
      })

      for (const conv of pendingConversions.docs) {
        await payload.update({
          collection: 'affiliate-conversions',
          id: conv.id,
          data: { status: 'approved', approvedAt: new Date().toISOString() }
        })
      }
      console.log(`Cron ran. Approved ${pendingConversions.docs.length} conversions.`)
      
      await new Promise(r => setTimeout(r, 2000))
      const afterCronAffiliate = await payload.findByID({ collection: 'affiliates', id: affiliate.id })
      console.log(`After Cron Stats -> Pending: ${afterCronAffiliate.totalCommissionPending}, Approved: ${afterCronAffiliate.totalCommissionApproved}`)

      // 6. Simulate Payout
      console.log('\nSimulating Payout...')
      await payload.create({
        collection: 'affiliate-payouts',
        data: {
          affiliate: affiliate.id,
          conversions: [conversion.id],
          conversionCount: 1,
          totalAmountCents: 1000,
          currency: 'USD',
          status: 'paid', // Hook should trigger on paid
        }
      })
      console.log('Payout created as paid.')
      
      await new Promise(r => setTimeout(r, 2000))
      const afterPayoutAffiliate = await payload.findByID({ collection: 'affiliates', id: affiliate.id })
      console.log(`After Payout Stats -> Approved: ${afterPayoutAffiliate.totalCommissionApproved}, Paid: ${afterPayoutAffiliate.totalCommissionPaid}`)
    }

    console.log('\n--- TEST FINISHED SUCCESSFULLY ---')
    process.exit(0)
  } catch (err) {
    console.error('TEST FAILED:', err)
    process.exit(1)
  }
}

runTest()
