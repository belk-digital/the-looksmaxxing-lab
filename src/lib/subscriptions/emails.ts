import type { Payload, PayloadRequest } from 'payload'
import { payUrl, serverUrl } from './invoices'
import { everyLabel, orderLabel } from './labels'

/**
 * Customer emails for subscriptions. Every one is clearly labelled "SUBSCRIPTION" with the order number so
 * customers (and staff reading BCC copies) can tell them apart from one-time orders at a glance.
 */

type Id = string | number

const SUPPORT_EMAIL = 'support@longeviaresearch.com'
const ZELLE_QR = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/longevia-zelle-qr.jpeg'

export const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)

const longDate = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''

export const orderTitle = (order: { cycleNumber?: number | null }) => orderLabel(order.cycleNumber)

const idOf = (v: any): Id | null => (v && typeof v === 'object' ? v.id : v ?? null)

const whyLine = (intervalMonths?: number | null) =>
  `You subscribed to have an order delivered ${intervalMonths ? everyLabel(intervalMonths) : 'on a regular schedule'} from Longevia Research. Whenever an order is due we email an invoice like this one - you pay it yourself and your order ships. We never charge your card automatically.`

// ------------------------------------------------------------------------------------------------
// Layout
// ------------------------------------------------------------------------------------------------

interface LayoutOptions {
  badge: string
  title: string
  intro: string
  /** Pre-escaped HTML blocks placed between the intro and the button. */
  blocks?: string[]
  cta?: { label: string; url: string }
  manageUrl?: string
  tone?: 'normal' | 'warning'
  /** Plain-words reason the customer is receiving this email (shown in the footer). */
  why?: string
}

export function renderLayout(o: LayoutOptions): string {
  const accent = o.tone === 'warning' ? '#92400E' : '#111827'
  const blocks = (o.blocks || []).map((b) => `<tr><td style="padding: 0 40px 20px 40px;">${b}</td></tr>`).join('')
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9fafb;padding:40px 20px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
  <tr><td style="padding:36px 40px 20px 40px;text-align:center;border-bottom:1px solid #f3f4f6;">
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#000;letter-spacing:-1px;">Longevia Research</h1>
    <p style="margin:14px 0 0 0;"><span style="display:inline-block;background:#111827;color:#fff;font-size:11px;font-weight:700;letter-spacing:1.5px;padding:5px 12px;border-radius:999px;text-transform:uppercase;">${esc(o.badge)}</span></p>
  </td></tr>
  <tr><td style="padding:28px 40px 12px 40px;">
    <h2 style="margin:0 0 10px 0;font-size:20px;color:${accent};">${esc(o.title)}</h2>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5563;">${o.intro}</p>
  </td></tr>
  ${blocks}
  ${
    o.cta
      ? `<tr><td style="padding:4px 40px 28px 40px;text-align:center;"><a href="${esc(o.cta.url)}" style="display:inline-block;padding:14px 32px;background-color:#000;color:#fff;text-decoration:none;font-size:15px;font-weight:700;border-radius:8px;">${esc(o.cta.label)}</a></td></tr>`
      : ''
  }
  ${
    o.manageUrl
      ? `<tr><td style="padding:0 40px 24px 40px;text-align:center;"><p style="margin:0;font-size:13px;color:#6b7280;">Need to change something? You can <a href="${esc(o.manageUrl)}" style="color:#111827;font-weight:600;">skip a delivery, pause, or update your address</a> anytime from your account.</p></td></tr>`
      : ''
  }
  <tr><td style="padding:24px 40px;background-color:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;">
    ${o.why ? `<p style="margin:0 0 10px 0;font-size:12px;line-height:1.5;color:#6b7280;"><strong>Why am I getting this?</strong> ${o.why}</p>` : ''}
    <p style="margin:0;font-size:12px;color:#9ca3af;">Questions? Just reply to this email or write to ${SUPPORT_EMAIL}.</p>
    <p style="margin:10px 0 0 0;font-size:12px;color:#d1d5db;">&copy; ${new Date().getFullYear()} Longevia Research. For research use only.</p>
  </td></tr>
</table></td></tr></table></body></html>`
}

function itemsBlock(order: any): string {
  const rows = (order.items || [])
    .map((item: any) => {
      const name = item.productSnapshot?.name || 'Product'
      const variant = item.variant && item.variant !== 'DEFAULT' ? ` - ${item.variant}` : ''
      return `<tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;"><strong>${esc(name)}${esc(variant)}</strong><br><span style="font-size:13px;color:#6b7280;">Qty ${esc(item.quantity)}</span></td><td align="right" style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:14px;color:#111827;">${money(item.price * item.quantity)}</td></tr>`
    })
    .join('')
  const fee = (order.feeTotal || 0) / 100
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:${bold ? 16 : 14}px;color:${bold ? '#111827' : '#6b7280'};${bold ? 'font-weight:700;border-top:1px solid #e5e7eb;' : ''}">${label}</td><td align="right" style="padding:6px 0;font-size:${bold ? 18 : 14}px;color:#111827;${bold ? 'font-weight:800;border-top:1px solid #e5e7eb;' : ''}">${value}</td></tr>`
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0">${rows}
    ${line('Subtotal (' + (order.subscriptionDiscountPercent || 0) + '% plan discount applied)', money(order.subtotal))}
    ${order.discountTotal > 0 ? line('Coupon' + (order.couponCode ? ' (' + esc(order.couponCode) + ')' : ''), '-' + money(order.discountTotal)) : ''}
    ${line('Shipping', order.shippingTotal ? money(order.shippingTotal) : 'Free')}
    ${fee > 0 ? line('Processing fees', money(fee)) : ''}
    ${line('Total', money(order.total), true)}</table>`
}

function amountDueBlock(order: any): string {
  return `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:18px;text-align:center;">
    <p style="margin:0;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#9ca3af;font-weight:600;">${esc(orderTitle(order))} &middot; Order #${esc(order.orderNumber || order.id)}</p>
    <p style="margin:6px 0 0 0;font-size:30px;font-weight:800;color:#111827;">${money(order.total)}</p>
    ${order.invoiceDueDate ? `<p style="margin:6px 0 0 0;font-size:14px;color:#4b5563;">Due by <strong>${esc(longDate(order.invoiceDueDate))}</strong></p>` : ''}
    <p style="margin:6px 0 0 0;font-size:13px;color:#6b7280;">Your order ships as soon as this payment is received.</p>
  </div>`
}

function zelleBlock(order: any, cardUrl?: string): string {
  return `<div style="background-color:#FEF3C7;border:1px solid #FDE68A;padding:20px;border-radius:10px;text-align:center;">
    <h3 style="margin:0 0 10px 0;color:#92400E;font-size:16px;">Pay with Zelle</h3>
    <p style="margin:0 0 14px 0;color:#92400E;font-size:14px;line-height:1.5;">Please send <strong>${money(order.total)}</strong> via Zelle to:</p>
    <img src="${ZELLE_QR}" alt="Zelle QR Code" style="width:180px;height:180px;border-radius:8px;border:2px solid #FDE68A;" />
    <div style="margin:14px 0;"><span style="background:#fff;padding:10px 14px;border-radius:6px;border:1px solid #FDE68A;font-size:16px;font-weight:700;color:#111827;display:inline-block;">${SUPPORT_EMAIL}</span></div>
    <p style="margin:0;color:#92400E;font-size:13px;"><strong>Important:</strong> include your order number (<strong>#${esc(order.orderNumber || order.id)}</strong>) in the payment note.</p>
    ${cardUrl ? `<p style="margin:14px 0 0 0;font-size:13px;color:#92400E;">Prefer a card? <a href="${esc(cardUrl)}" style="color:#92400E;font-weight:700;">Pay by card instead</a>.</p>` : ''}
  </div>`
}

// ------------------------------------------------------------------------------------------------
// Builders (pure - easy to test)
// ------------------------------------------------------------------------------------------------

export type InvoiceEmailReason = 'scheduled' | 'early' | 'resume' | 'reactivate'

export function buildInvoiceEmail(args: { order: any; subscriptionId: Id; reason: InvoiceEmailReason; intervalMonths?: number | null }): { subject: string; html: string } {
  const { order, subscriptionId, reason, intervalMonths } = args
  const n = order.orderNumber || order.id
  const pay = payUrl(order.id, order.invoiceToken)
  const name = esc(order.customerFirstName || 'there')
  const intro =
    reason === 'early'
      ? `Hi ${name}, here is the invoice for your next order, as requested.`
      : reason === 'resume'
        ? `Hi ${name}, welcome back! Your subscription is active again. Here is the invoice for your next order.`
        : reason === 'reactivate'
          ? `Hi ${name}, here is a fresh invoice to reactivate your subscription. Once it is paid, your subscription continues as normal.`
          : `Hi ${name}, your next order is ready. Please pay the invoice below so we can ship it.`

  const isCard = order.paymentMethod === 'authnet_bridge'
  const blocks = [amountDueBlock(order), isCard ? '' : zelleBlock(order, pay), itemsBlock(order)].filter(Boolean)

  return {
    subject: `Subscription invoice #${n} - ${orderTitle(order)}${order.invoiceDueDate ? ` (due ${longDate(order.invoiceDueDate)})` : ''}`,
    html: renderLayout({
      badge: `Subscription · ${orderTitle(order)}`,
      title: 'Your invoice',
      intro,
      blocks,
      cta: isCard ? { label: `Pay ${money(order.total)} by card`, url: pay } : { label: 'View invoice', url: pay },
      manageUrl: `${serverUrl()}/account/subscriptions/${subscriptionId}`,
      why: whyLine(intervalMonths),
    }),
  }
}

export function buildReminderEmail(args: { order: any; subscriptionId: Id; stage: 1 | 2; intervalMonths?: number | null }): { subject: string; html: string } {
  const { order, subscriptionId, stage, intervalMonths } = args
  const n = order.orderNumber || order.id
  const pay = payUrl(order.id, order.invoiceToken)
  const isCard = order.paymentMethod === 'authnet_bridge'
  const final = stage === 2
  return {
    subject: final ? `Final notice: subscription invoice #${n} is still unpaid` : `Reminder: subscription invoice #${n} is due`,
    html: renderLayout({
      badge: `Subscription · ${orderTitle(order)}`,
      title: final ? 'Final notice' : 'Your invoice is due',
      intro: final
        ? `Your invoice has not been paid yet. If it is still unpaid in a few days your subscription will be put on hold - you can reactivate it anytime. If you would rather not receive this delivery, you can skip it or pause your subscription.`
        : `This is a friendly reminder that your invoice is due. You can pay now, or skip this delivery or pause your subscription from your account.`,
      blocks: [amountDueBlock(order), isCard ? '' : zelleBlock(order, pay)].filter(Boolean),
      cta: isCard ? { label: `Pay ${money(order.total)} by card`, url: pay } : { label: 'View invoice', url: pay },
      manageUrl: `${serverUrl()}/account/subscriptions/${subscriptionId}`,
      tone: final ? 'warning' : 'normal',
      why: whyLine(intervalMonths),
    }),
  }
}

export function buildLapseEmail(args: { order: any; subscriptionId: Id; intervalMonths?: number | null }): { subject: string; html: string } {
  const { order, subscriptionId, intervalMonths } = args
  const n = order.orderNumber || order.id
  return {
    subject: `Your subscription is on hold - invoice #${n} was not paid`,
    html: renderLayout({
      badge: 'Subscription · On hold',
      title: 'Your subscription is on hold',
      intro: `We did not receive payment for ${esc(orderTitle(order))} (order #${esc(n)}), so we have cancelled that invoice and put your subscription on hold. Nothing else will be charged. You can continue anytime - just reactivate from your account and pay a fresh invoice.`,
      cta: { label: 'Reactivate my subscription', url: `${serverUrl()}/account/subscriptions/${subscriptionId}` },
      tone: 'warning',
      why: whyLine(intervalMonths),
    }),
  }
}

export function buildPaymentReceivedEmail(args: { order: any; subscriptionId: Id | null; nextDueDate?: string | Date | null; intervalMonths?: number | null }): { subject: string; html: string } {
  const { order, subscriptionId, nextDueDate, intervalMonths } = args
  const n = order.orderNumber || order.id
  return {
    subject: `Payment received - Subscription order #${n} (${orderTitle(order)})`,
    html: renderLayout({
      badge: `Subscription · ${orderTitle(order)}`,
      title: 'Payment received - thank you!',
      intro: `We received your payment of <strong>${money(order.total)}</strong> for ${esc(orderTitle(order))}. Your order is being prepared and you will get tracking details once it ships.${
        nextDueDate ? ` Your next invoice will be emailed before <strong>${esc(longDate(nextDueDate))}</strong>.` : ''
      }`,
      blocks: [itemsBlock(order)],
      cta: subscriptionId ? { label: 'View my subscription', url: `${serverUrl()}/account/subscriptions/${subscriptionId}` } : undefined,
      why: whyLine(intervalMonths),
    }),
  }
}

// ------------------------------------------------------------------------------------------------
// Senders
// ------------------------------------------------------------------------------------------------

/** The subscription's interval in months (1, 3 or 6), for the "why am I getting this" line. */
async function intervalOf(payload: Payload, order: any): Promise<number | null> {
  const subId = idOf(order?.subscription)
  if (!subId) return null
  const sub: any = await payload.findByID({ collection: 'subscriptions' as any, id: subId, depth: 0, overrideAccess: true }).catch(() => null)
  return sub ? Number(sub.planMonths) || null : null
}

async function loadOrder(payload: Payload, orderId: Id, req?: PayloadRequest): Promise<any | null> {
  return (await payload
    .findByID({ collection: 'orders', id: orderId, depth: 0, overrideAccess: true, ...(req ? { req } : {}) })
    .catch(() => null)) as any
}

export async function sendInvoiceEmail(payload: Payload, orderId: Id, reason: InvoiceEmailReason): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order?.guestEmail || !order.invoiceToken) return
  const { subject, html } = buildInvoiceEmail({ order, subscriptionId: idOf(order.subscription)!, reason, intervalMonths: await intervalOf(payload, order) })
  await payload.sendEmail({ to: order.guestEmail, subject, html })
}

export async function sendReminderEmail(payload: Payload, orderId: Id, stage: 1 | 2): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order?.guestEmail || !order.invoiceToken) return
  const { subject, html } = buildReminderEmail({ order, subscriptionId: idOf(order.subscription)!, stage, intervalMonths: await intervalOf(payload, order) })
  await payload.sendEmail({ to: order.guestEmail, subject, html })
}

export async function sendLapseEmail(payload: Payload, orderId: Id): Promise<void> {
  const order = await loadOrder(payload, orderId)
  if (!order?.guestEmail) return
  const { subject, html } = buildLapseEmail({ order, subscriptionId: idOf(order.subscription)!, intervalMonths: await intervalOf(payload, order) })
  await payload.sendEmail({ to: order.guestEmail, subject, html })
}

export async function sendPaymentReceivedEmail(payload: Payload, order: any, req?: PayloadRequest): Promise<void> {
  const full = (await loadOrder(payload, order.id, req)) || order
  const to = full.guestEmail
  if (!to) return
  const subId = idOf(full.subscription)
  const sub: any = subId
    ? await payload.findByID({ collection: 'subscriptions' as any, id: subId, depth: 0, overrideAccess: true, ...(req ? { req } : {}) }).catch(() => null)
    : null
  const { subject, html } = buildPaymentReceivedEmail({ order: full, subscriptionId: subId, nextDueDate: sub?.nextDueDate, intervalMonths: Number(sub?.planMonths) || null })
  // BCC support, like normal order confirmations, so staff know a paid order is ready to ship.
  await payload.sendEmail({ to, bcc: SUPPORT_EMAIL, subject, html })
}
