'use server'

import { getPayloadUser } from '@/lib/auth/getPayloadUser'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function submitAffiliateApplication(formData: FormData) {
  try {
    const user = await getPayloadUser()
    if (!user) {
      return { success: false, error: 'Unauthorized. Please log in to apply.' }
    }

    const payload = await getPayload({ config })

    // Check if user already has an application
    const existingApplication = await payload.find({
      collection: 'affiliate-applications',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingApplication.docs.length > 0) {
      return { success: false, error: 'You have already submitted an application.' }
    }

    // Check if user is already an affiliate
    const existingAffiliate = await payload.find({
      collection: 'affiliates',
      where: { user: { equals: user.id } },
      limit: 1,
      overrideAccess: true,
    })

    if (existingAffiliate.docs.length > 0) {
      return { success: false, error: 'You are already an affiliate.' }
    }

    // Extract form data
    const displayName = formData.get('displayName') as string
    const websiteUrl = formData.get('websiteUrl') as string
    const platform = formData.get('platform') as string
    const socialUrl = formData.get('socialUrl') as string
    const estimatedMonthlyReach = formData.get('reach') as string
    const niche = formData.get('niche') as string
    const promotionMethods = formData.get('methods') as string
    const agreedToTerms = formData.get('terms') === 'on' || formData.get('terms') === 'true'

    if (!displayName || !platform || !socialUrl || !estimatedMonthlyReach || !promotionMethods || !agreedToTerms) {
      return { success: false, error: 'Please fill in all required fields.' }
    }

    // Create the application
    await payload.create({
      collection: 'affiliate-applications',
      data: {
        user: user.id,
        status: 'approved',
        displayName,
        websiteUrl,
        socialLinks: [
          {
            platform: platform as any,
            url: socialUrl,
          }
        ],
        estimatedMonthlyReach: estimatedMonthlyReach as any,
        niche,
        promotionMethods,
        agreedToTerms,
      },
      overrideAccess: true,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error submitting affiliate application:', error)
    return { success: false, error: error.message || 'An unexpected error occurred.' }
  }
}
