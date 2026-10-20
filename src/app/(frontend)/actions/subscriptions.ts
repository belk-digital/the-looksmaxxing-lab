'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getSubscriptionSettings, allowedPaymentMethods } from '@/lib/subscriptions/settings'

/**
 * Public, read-only: which subscription plans are on offer right now. Read live (not baked into the statically
 * generated product pages) so switching subscriptions on/off in the admin takes effect immediately.
 */
export async function getSubscriptionPlanOptions() {
  try {
    const payload = await getPayload({ config: configPromise })
    const s = await getSubscriptionSettings(payload)
    return {
      enabled: s.enabled,
      plans: s.plans
        .filter((p) => p.isActive)
        .sort((a, b) => a.months - b.months)
        .map((p) => ({ months: p.months, label: p.label, discountPercent: p.discountPercent, badge: p.badge ?? null })),
      allowedMethods: allowedPaymentMethods(s) as string[],
      termsText: s.termsText,
    }
  } catch {
    return { enabled: false, plans: [], allowedMethods: [] as string[], termsText: '' }
  }
}
