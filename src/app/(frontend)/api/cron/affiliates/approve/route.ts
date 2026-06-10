import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

// Optional: Add a secret token check here if you want to secure the cron endpoint
// e.g. if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) ...

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Calculate the date 15 days ago
    const fifteenDaysAgo = new Date()
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15)

    // Find all pending conversions older than 15 days
    const pendingConversions = await payload.find({
      collection: 'affiliate-conversions',
      where: {
        status: { equals: 'pending' },
        createdAt: { less_than_equal: fifteenDaysAgo.toISOString() },
      },
      limit: 1000, // Process in batches if necessary
      overrideAccess: true,
    })

    let approvedCount = 0

    for (const conversion of pendingConversions.docs) {
      // Update status to approved
      await payload.update({
        collection: 'affiliate-conversions',
        id: conversion.id,
        data: {
          status: 'approved',
          approvedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      approvedCount++
    }

    return NextResponse.json({
      success: true,
      message: `Successfully auto-approved ${approvedCount} pending conversions.`,
      processedAt: new Date().toISOString()
    })
    
  } catch (error: any) {
    console.error('Error in auto-approve cron:', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
