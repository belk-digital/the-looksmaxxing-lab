import { getPayload } from 'payload'
import config from '@payload-config'
import type { Order, Affiliate, AffiliateClick } from '@/payload-types'

export async function computeCommission(order: Order, affiliateId: string | number): Promise<number> {
  const payload = await getPayload({ config })
  const affiliate = await payload.findByID({
    collection: 'affiliates',
    id: affiliateId,
  }) as Affiliate

  // The affiliate coupon discount (they gave away X% so don't earn on the discount amount)
  const affiliateCouponDiscount = order.couponCode === affiliate.couponCode ? (order.discountTotal ?? 0) : 0

  const eligibleSubtotal = affiliate.commissionOn === 'subtotal_after_coupon'
    ? (order.subtotal || 0) - affiliateCouponDiscount
    : (order.subtotal || 0)

  // Floor to avoid floating point issues (everything in cents)
  return Math.floor((eligibleSubtotal * (affiliate.commissionRate || 10)) / 100)
}

export async function attributeOrder(
  order: Order,
  cookieAffiliateId: string | null,
  couponCode: string | null,
  cookieClickId: string | null
): Promise<void> {
  const payload = await getPayload({ config })
  
  let couponAffiliate: Affiliate | null = null
  if (couponCode) {
    const res = await payload.find({
      collection: 'affiliates',
      where: { couponCode: { equals: couponCode } },
      limit: 1,
    })
    couponAffiliate = res.docs[0] as unknown as Affiliate || null
  }

  let cookieAffiliate: Affiliate | null = null
  if (cookieAffiliateId) {
    cookieAffiliate = await payload.findByID({
      collection: 'affiliates',
      id: cookieAffiliateId,
    }) as Affiliate
  }

  const affiliate = couponAffiliate ?? cookieAffiliate
  if (!affiliate) return

  const source = (couponAffiliate && cookieAffiliate && couponAffiliate.id === cookieAffiliate.id)
    ? 'both'
    : couponAffiliate ? 'coupon_code' : 'referral_link'

  const commissionAmount = await computeCommission(order, affiliate.id)

  // Basic fraud checks
  const customerEmail = (typeof order.guestEmail === 'string' ? order.guestEmail : '') || (typeof order.user === 'object' && order.user !== null && 'email' in order.user ? String(order.user.email) : '')
  let isSelfReferral = false
  
  // Check if affiliate's user email matches customer email
  if (typeof affiliate.user === 'object' && affiliate.user !== null && 'email' in affiliate.user) {
     if (String(affiliate.user.email).toLowerCase() === customerEmail.toLowerCase()) {
       isSelfReferral = true
     }
  }

  const isVoid = isSelfReferral
  const status = isVoid ? 'voided' : 'pending'
  const fraudNotes = isSelfReferral ? 'self_referral' : ''
  
  const pendingPeriodDays = affiliate.pendingPeriodDays || 30
  const pendingUntil = new Date()
  pendingUntil.setDate(pendingUntil.getDate() + pendingPeriodDays)

  await payload.create({
    collection: 'affiliate-conversions',
    data: {
      affiliate: affiliate.id,
      order: order.id,
      customerEmail,
      attributionSource: source,
      attributionClick: cookieClickId || undefined,
      cookieAgeDays: 0, // Should be computed based on click date
      couponCodeUsed: couponCode || '',
      orderSubtotal: order.subtotal,
      orderDiscount: order.discountTotal,
      eligibleSubtotal: order.subtotal, // simplified
      commissionRate: affiliate.commissionRate,
      commissionAmount: isVoid ? 0 : commissionAmount,
      status,
      pendingUntil: pendingUntil.toISOString(),
      selfReferralDetected: isSelfReferral,
      fraudScore: isSelfReferral ? 100 : 0,
      flaggedForReview: isSelfReferral,
      fraudNotes,
    } as any, // Typecast due to dynamically generated types possibly missing fields
  })
}
