import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const payload = await getPayload({ config })
  const { slug } = await params

  // Look up affiliate by slug
  const result = await payload.find({
    collection: 'affiliates',
    where: { referralSlug: { equals: slug } },
    limit: 1,
  })

  const affiliate = result.docs[0]

  if (!affiliate || affiliate.status !== 'approved') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Generate anonymous click ID and IP hash
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const ipHash = crypto.createHash('sha256').update(ip).digest('hex')
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const referrer = request.headers.get('referer') || ''
  
  // Create an AffiliateClick record
  const click = await payload.create({
    collection: 'affiliate-clicks',
    data: {
      affiliate: affiliate.id,
      source: 'referral_link',
      ipHash,
      userAgent,
      referrer,
      landingPage: '/',
      clickedAt: new Date().toISOString(),
      // fraud velocity check could be added here
    }
  })

  // Set cookies
  const response = NextResponse.redirect(new URL('/', request.url))
  const maxAge = (affiliate.cookieDurationDays || 30) * 24 * 60 * 60 // seconds

  response.cookies.set('affiliate_ref', String(affiliate.id), {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  response.cookies.set('affiliate_click_id', String(click.id), {
    maxAge,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  if (affiliate.couponCode) {
    // We do NOT use httpOnly here because we want the client-side cart logic to read and clear this cookie
    response.cookies.set('affiliate_auto_coupon', affiliate.couponCode, {
      maxAge: 60 * 60, // 1 hour is plenty of time to apply it
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }

  return response
}
