import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { updateAffiliateStats } from './stats'

/**
 * Approves affiliate conversions whose pending period has elapsed.
 * A conversion is only approved when:
 *  - it hasn't been flagged for manual fraud review, and
 *  - its order has actually been paid and not cancelled/refunded since
 *    (manual orders such as Zelle are attributed when placed, long before they're paid).
 */
export async function processPendingCommissions() {
  const payload = await getPayload({ config: configPromise })

  const now = new Date().toISOString()

  // Find all pending conversions where pendingUntil is in the past
  const { docs: pendingToApprove } = await payload.find({
    collection: 'affiliate-conversions',
    where: {
      and: [
        { status: { equals: 'pending' } },
        { pendingUntil: { less_than_equal: now } }
      ]
    },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
  })

  console.log(`Found ${pendingToApprove.length} pending commissions past their pending period.`)

  let successCount = 0
  let skippedCount = 0
  let failedCount = 0
  const updatedAffiliates = new Set<string>()

  for (const conversion of pendingToApprove) {
    try {
      if ((conversion as any).flaggedForReview) {
        skippedCount++
        continue
      }

      const orderId = typeof conversion.order === 'object' && conversion.order !== null ? conversion.order.id : conversion.order
      const order: any = orderId
        ? await payload.findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true }).catch(() => null)
        : null

      if (!order || order.paymentStatus !== 'captured' || ['cancelled', 'refunded'].includes(order.status)) {
        skippedCount++
        continue
      }

      await payload.update({
        collection: 'affiliate-conversions',
        id: conversion.id,
        data: {
          status: 'approved',
          approvedAt: now,
        },
        overrideAccess: true,
      })

      const affiliateId = typeof conversion.affiliate === 'object' ? conversion.affiliate.id : conversion.affiliate
      if (affiliateId) {
        updatedAffiliates.add(String(affiliateId))
      }

      successCount++
    } catch (error) {
      failedCount++
      console.error(`Failed to approve commission ${conversion.id}:`, error)
    }
  }

  // Update stats for all affected affiliates
  for (const affiliateId of updatedAffiliates) {
    try {
      await updateAffiliateStats(affiliateId, payload)
    } catch (error) {
      console.error(`Failed to update stats for affiliate ${affiliateId}:`, error)
    }
  }

  return {
    processed: pendingToApprove.length,
    success: successCount,
    skipped: skippedCount,
    failed: failedCount,
  }
}
