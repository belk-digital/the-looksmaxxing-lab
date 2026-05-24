import type { CollectionAfterChangeHook } from 'payload'
import slugify from 'slugify'

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const afterAffiliateApplicationChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only proceed if status was changed to 'approved' and it wasn't approved before
  if (
    operation === 'update' &&
    doc.status === 'approved' &&
    previousDoc.status !== 'approved' &&
    !doc.linkedAffiliate
  ) {
    try {
      const displayName = doc.displayName || 'affiliate'
      
      // 1. Generate unique Coupon Code
      const baseCode = (displayName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() + '10').substring(0, 15)
      let finalCode = baseCode
      
      // Ensure code is unique (simple retry logic)
      let isUnique = false
      let attempts = 0
      while (!isUnique && attempts < 5) {
        const existingCoupon = await req.payload.find({
          collection: 'coupons',
          where: { code: { equals: finalCode } },
          limit: 1,
        })
        if (existingCoupon.docs.length === 0) {
          isUnique = true
        } else {
          finalCode = `${baseCode}${generateRandomString(3)}`
          attempts++
        }
      }

      // Create the coupon
      const newCoupon = await req.payload.create({
        collection: 'coupons',
        data: {
          code: finalCode,
          type: 'percentage',
          value: 10,
          appliesTo: 'all',
          freeShipping: false,
          stackable: false,
          excludeSaleItems: false,
          autoApply: false,
        } as any,
        req,
      })

      // 2. Generate Referral Slug
      const baseSlug = slugify(displayName, { lower: true, strict: true })
      let finalSlug = baseSlug
      let slugUnique = false
      let slugAttempts = 0
      
      while (!slugUnique && slugAttempts < 5) {
        const existingAffiliate = await req.payload.find({
          collection: 'affiliates',
          where: { referralSlug: { equals: finalSlug } },
          limit: 1,
        })
        if (existingAffiliate.docs.length === 0) {
          slugUnique = true
        } else {
          finalSlug = `${baseSlug}-${Math.floor(Math.random() * 1000)}`
          slugAttempts++
        }
      }

      // 3. Create Affiliate Profile
      const newAffiliate = await req.payload.create({
        collection: 'affiliates',
        data: {
          user: typeof doc.user === 'object' && doc.user !== null ? doc.user.id : doc.user,
          status: 'approved',
          applicationDate: doc.createdAt,
          approvedAt: new Date().toISOString(),
          approvedBy: req.user ? req.user.id : undefined,
          displayName: doc.displayName,
          websiteUrl: doc.websiteUrl,
          socialLinks: doc.socialLinks,
          referralSlug: finalSlug,
          couponCode: finalCode,
          coupon: newCoupon.id,
          cookieDurationDays: 30,
          commissionRate: 10,
          commissionType: 'percentage',
          customerDiscount: 10,
          pendingPeriodDays: 30,
          commissionOn: 'subtotal_after_coupon',
          tier: 'standard',
          minimumPayoutThreshold: 5000,
          payoutCurrency: 'USD',
        } as any,
        req,
      })

      // 4. Update the Application to link the Affiliate
      await req.payload.update({
        collection: 'affiliate-applications',
        id: doc.id,
        data: {
          linkedAffiliate: newAffiliate.id,
        } as any,
        // use internal API context to avoid triggering loops
        req: { ...req, context: { ...req.context, disableHooks: true } } as any,
      })

      req.payload.logger.info(`Successfully approved application and created affiliate for user ${doc.user}`)
      
      // Update the current doc memory so it returns the latest state to the admin
      return {
        ...doc,
        linkedAffiliate: newAffiliate.id,
      }

    } catch (err) {
      req.payload.logger.error({ err }, 'Error generating affiliate on application approval')
    }
  }

  return doc
}
