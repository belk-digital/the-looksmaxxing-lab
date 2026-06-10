import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config: configPromise })
    
    // Auth check
    const cookieStore = cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.PAYLOAD_SECRET as string) as any
    if (!decoded || !decoded.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = decoded.id
    
    // Get affiliate profile
    const affiliates = await payload.find({
      collection: 'affiliates',
      where: { user: { equals: userId } },
      limit: 1,
    })
    
    const affiliate = affiliates.docs[0]
    if (!affiliate) {
      return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 })
    }

    const body = await request.json()
    const { amount, method, details } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const requestedCents = Math.round(amount * 100)
    
    // Validate balance
    const approved = affiliate.totalCommissionApproved || 0
    const requested = affiliate.totalCommissionRequested || 0
    const available = approved - requested
    
    if (requestedCents > available) {
      return NextResponse.json({ error: 'Amount exceeds available balance' }, { status: 400 })
    }

    // Create the request
    await payload.create({
      collection: 'payout-requests',
      data: {
        affiliate: affiliate.id,
        amountCents: requestedCents,
        payoutMethod: method,
        payoutDetails: details,
        status: 'pending',
      },
      overrideAccess: true, // Internal creation
    })

    // This will trigger the afterChange hook and update the affiliate's requested total.

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Payout Request Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
