import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { updateAffiliateStats } from './stats'

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
    overrideAccess: true,
  })

  console.log(`Found ${pendingToApprove.length} pending commissions to approve.`)

  let successCount = 0
  const updatedAffiliates = new Set<string>()

  for (const conversion of pendingToApprove) {
    try {
      await payload.update({
        collection: 'affiliate-conversions',
        id: conversion.id,
        data: {
          status: 'approved',
        },
        overrideAccess: true,
      })
      
      const affiliateId = typeof conversion.affiliate === 'object' ? conversion.affiliate.id : conversion.affiliate
      if (affiliateId) {
        updatedAffiliates.add(String(affiliateId))
      }
      
      successCount++
    } catch (error) {
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
    failed: pendingToApprove.length - successCount,
  }
}
