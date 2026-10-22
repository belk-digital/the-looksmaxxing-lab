import { EveryLabel } from './labels'
import type { Payload } from 'payload'

export type SubscriptionPaymentMethod = 'authnet_bridge' | 'zelle'

export interface SubscriptionPlan {
  months: number
  label: string
  discountPercent: number
  badge?: string
  isActive: boolean
}

export interface SubscriptionSettings {
  /** Master switch for NEW subscriptions. Existing subscriptions keep billing when this is off. */
  enabled: boolean
  plans: SubscriptionPlan[]
  invoiceLeadDays: number
  finalNoticeAfterDays: number
  lapseAfterDays: number
  firstPaymentExpiryDays: number
  allowCard: boolean
  allowZelle: boolean
  minDaysBetweenEarlyOrders: number
  termsText: string
}

export const DEFAULT_TERMS_TEXT =
  'I understand this is a recurring subscription: I will receive an invoice by email before each delivery, on the schedule of the plan I chose (every month, every 3 months or every 6 months), and the order ships after that invoice is paid. It continues until I pause it. I can pause, skip a delivery or resume anytime from my account. Prices follow the current store price at the time of each invoice. For research use only.'

export const DEFAULT_SUBSCRIPTION_SETTINGS: SubscriptionSettings = {
  enabled: false,
  plans: [
    { months: 1, label: 'Every month', discountPercent: 25, isActive: true },
    { months: 3, label: 'Every 3 months', discountPercent: 20, isActive: true },
    { months: 6, label: 'Every 6 months', discountPercent: 15, isActive: true },
  ],
  invoiceLeadDays: 7,
  finalNoticeAfterDays: 7,
  lapseAfterDays: 14,
  firstPaymentExpiryDays: 14,
  allowCard: true,
  allowZelle: true,
  minDaysBetweenEarlyOrders: 0,
  termsText: DEFAULT_TERMS_TEXT,
}

const num = (v: unknown, fallback: number, min = 0) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min ? v : fallback

/**
 * Reads the admin-managed settings and fills any gap with safe defaults.
 * Never throws: if the settings table is missing (e.g. code deployed before the database
 * migration was run) it returns the defaults, which have subscriptions switched OFF.
 */
export async function getSubscriptionSettings(payload: Payload): Promise<SubscriptionSettings> {
  let doc: any = null
  try {
    doc = await payload.findGlobal({ slug: 'subscription-settings' as any, depth: 0 })
  } catch (err) {
    console.warn('getSubscriptionSettings: using defaults (settings unavailable)', (err as Error)?.message)
    return DEFAULT_SUBSCRIPTION_SETTINGS
  }
  if (!doc) return DEFAULT_SUBSCRIPTION_SETTINGS

  const d = DEFAULT_SUBSCRIPTION_SETTINGS
  const plans: SubscriptionPlan[] =
    Array.isArray(doc.plans) && doc.plans.length > 0
      ? doc.plans
          .filter((p: any) => p && Number(p.months) > 0)
          .map((p: any) => ({
            months: Number(p.months),
            label: String(p.label || EveryLabel(Number(p.months))),
            discountPercent: Math.min(100, Math.max(0, Number(p.discountPercent) || 0)),
            badge: p.badge || undefined,
            isActive: p.isActive !== false,
          }))
      : d.plans

  return {
    enabled: doc.enabled === true,
    plans,
    invoiceLeadDays: num(doc.invoiceLeadDays, d.invoiceLeadDays, 1),
    finalNoticeAfterDays: num(doc.finalNoticeAfterDays, d.finalNoticeAfterDays, 1),
    lapseAfterDays: num(doc.lapseAfterDays, d.lapseAfterDays, 2),
    firstPaymentExpiryDays: num(doc.firstPaymentExpiryDays, d.firstPaymentExpiryDays, 1),
    allowCard: doc.allowCard !== false,
    allowZelle: doc.allowZelle !== false,
    minDaysBetweenEarlyOrders: num(doc.minDaysBetweenEarlyOrders, d.minDaysBetweenEarlyOrders, 0),
    termsText: doc.termsText || d.termsText,
  }
}

export function findActivePlan(settings: SubscriptionSettings, months: number): SubscriptionPlan | undefined {
  return settings.plans.find((p) => p.months === months && p.isActive)
}

export function allowedPaymentMethods(settings: SubscriptionSettings): SubscriptionPaymentMethod[] {
  const out: SubscriptionPaymentMethod[] = []
  if (settings.allowCard) out.push('authnet_bridge')
  if (settings.allowZelle) out.push('zelle')
  return out
}
