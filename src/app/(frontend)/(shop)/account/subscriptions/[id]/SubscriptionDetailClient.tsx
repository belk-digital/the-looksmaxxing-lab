'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, CreditCard, Loader2, Pause, Play, FastForward, ShoppingBag, RotateCcw } from 'lucide-react'
import { Space_Grotesk } from 'next/font/google'
import type { SubscriptionView, ScheduleRow } from '@/lib/subscriptions/view'
import {
  pauseSubscriptionAction,
  resumeSubscriptionAction,
  skipMonthAction,
  orderNextMonthAction,
  reactivateSubscriptionAction,
  updateAddressAction,
  setPaymentMethodAction,
} from '../actions'
import { TONES } from '../SubscriptionsClient'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '700'] })

export interface SubscriptionDetailModel {
  id: string
  reference: string
  status: string
  planMonths: number
  discountPercent: number
  paymentMethod: string
  /** A coupon that is taken off every monthly invoice (set when the customer subscribed with an "every monthly payment" coupon). */
  recurringCouponCode: string | null
  allowedPaymentMethods: string[]
  items: { name: string; variant: string; quantity: number }[]
  address: { firstName: string; lastName: string; phone: string; line1: string; line2: string; city: string; state: string; postalCode: string }
  view: SubscriptionView
  skipFrom: string
  skipTo: string
  firstOrderPath: string | null
}

const METHOD_LABEL: Record<string, string> = { authnet_bridge: 'Credit / debit card', zelle: 'Zelle' }
const money = (n?: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const day = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''

const ROW_TONE: Record<ScheduleRow['state'], string> = {
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  shipped: 'bg-blue-50 text-blue-700 border-blue-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  awaiting_payment: 'bg-amber-50 text-amber-700 border-amber-200',
  upcoming: 'bg-gray-50 text-gray-600 border-gray-200',
  skipped_hold: 'bg-blue-50 text-blue-700 border-blue-200',
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[11px] font-bold uppercase tracking-[0.15em] transition disabled:opacity-50'
const btnDark = `${btn} bg-black text-white hover:bg-black/85`
const btnLight = `${btn} bg-white text-black border border-gray-200 hover:border-black`

/** A button with an info icon beside it explaining exactly what it does. */
function Action({ tip, label, children }: { tip: string; label: string; children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1">
      {children}
      <InfoTip label={label} align="center">
        {tip}
      </InfoTip>
    </div>
  )
}

export function SubscriptionDetailClient({ model }: { model: SubscriptionDetailModel }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [busy, setBusy] = useState<string | null>(null)
  const [addr, setAddr] = useState(model.address)
  const [method, setMethod] = useState(model.paymentMethod)
  const { view } = model
  const has = (a: SubscriptionView['actions'][number]) => view.actions.includes(a)

  // Runs a server action, shows the outcome, and follows the payment link when one is returned.
  const run = (key: string, fn: () => Promise<any>, successMsg?: string) => {
    setBusy(key)
    startTransition(async () => {
      try {
        const res = await fn()
        if (!res?.ok) {
          toast.error(res?.error || 'Something went wrong. Please try again.')
        } else {
          const message = res.message || successMsg
          if (message) toast.success(message)
          if (res.payPath) {
            // Full-page navigation on purpose: the server action also refreshes THIS page's data, and a soft
            // router.push could be overridden by that refresh, bouncing the customer back from their invoice.
            window.location.assign(res.payPath)
            return
          }
          router.refresh()
        }
      } catch {
        toast.error('Something went wrong. Please try again.')
      } finally {
        setBusy(null)
      }
    })
  }

  const working = pending || busy !== null

  return (
    <div className="flex flex-col w-full gap-8">
      <Link href="/account/subscriptions" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black w-fit">
        <ArrowLeft size={14} /> All subscriptions
      </Link>

      {/* ---------- summary ---------- */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {model.reference} &middot; {model.planMonths}-month plan &middot; {model.discountPercent}% off
              <InfoTip label="What is the plan discount?">{HELP.planDiscount}</InfoTip>
            </span>
            <h1 className={`text-3xl font-bold tracking-tighter text-black mt-1 ${spaceGrotesk.className}`}>
              {model.items.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ''}${i.quantity > 1 ? ` x${i.quantity}` : ''}`).join(', ')}
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full border w-fit ${TONES[view.statusTone]}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]">{view.statusLabel}</span>
            </div>
            <InfoTip label="What does this status mean?" align="right">
              {HELP.status[model.status] || view.statusHelp}
            </InfoTip>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="inline-flex items-center gap-1.5">
              <span>
                <strong className="text-black">{view.monthsPaid}</strong> of {view.monthsTotal} months paid
              </span>
              <InfoTip label="What counts as a paid month?">{HELP.monthsPaid}</InfoTip>
            </span>
            {view.nextInvoiceDate && view.actions.includes('order_next_month') && <span>Next invoice: {day(view.nextInvoiceDate)}</span>}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-black rounded-full transition-all" style={{ width: `${Math.min(100, (view.monthsPaid / Math.max(1, view.monthsTotal)) * 100)}%` }} />
          </div>
          <p className="text-sm text-gray-600 mt-4">{view.statusHelp}</p>
          {model.recurringCouponCode && (
            <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5" data-testid="recurring-coupon-note">
              <span>{`Coupon ${model.recurringCouponCode} is applied to every monthly invoice.`}</span>
              <InfoTip label="How does my coupon work?">{HELP.couponEveryMonth}</InfoTip>
            </p>
          )}
        </div>

        {/* ---------- actions ---------- */}
        <div className="mt-6 flex flex-wrap gap-3">
          {model.status === 'pending_payment' && model.firstOrderPath && (
            <Link href={model.firstOrderPath} className={btnDark}>
              View my first payment
            </Link>
          )}

          {has('pay_now') && view.openInvoice && (
            <Action label="What does Pay now do?" tip={HELP.actions.payNow}>
              <Link href={view.openInvoice.payPath} className={btnDark}>
                <CreditCard size={14} /> Pay {money(view.openInvoice.total)} now
              </Link>
            </Action>
          )}

          {has('order_next_month') && (
            <Action label="What does Order next month now do?" tip={HELP.actions.orderNextMonth}>
            <button
              className={btnDark}
              disabled={working}
              onClick={() => {
                if (window.confirm('Order next month now? An invoice for your next monthly order is created right away so you can pay it today.')) {
                  run('order', () => orderNextMonthAction(model.id))
                }
              }}
            >
              {busy === 'order' ? <Loader2 size={14} className="animate-spin" /> : <ShoppingBag size={14} />} Order next month now
            </button>
            </Action>
          )}

          {has('reactivate') && (
            <Action label="What does Pay to reactivate do?" tip={HELP.actions.reactivate}>
            <button className={btnDark} disabled={working} onClick={() => run('reactivate', () => reactivateSubscriptionAction(model.id))}>
              {busy === 'reactivate' ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Pay to reactivate
            </button>
            </Action>
          )}

          {has('resume') && (
            <Action label="What does Resume do?" tip={HELP.actions.resume}>
            <button
              className={btnDark}
              disabled={working}
              onClick={() => run('resume', () => resumeSubscriptionAction(model.id))}
            >
              {busy === 'resume' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Resume subscription
            </button>
            </Action>
          )}

          {has('skip_month') && (
            <Action label="What does Skip next month do?" tip={HELP.actions.skip}>
            <button
              className={btnLight}
              disabled={working}
              onClick={() => {
                if (
                  window.confirm(
                    `Skip next month? Your next shipment moves from ${day(model.skipFrom)} to ${day(model.skipTo)}. You still get all ${model.planMonths} months - your plan just ends a month later.${view.openInvoice ? ' The unpaid invoice will be cancelled.' : ''}`,
                  )
                ) {
                  run('skip', () => skipMonthAction(model.id), `Skipped. Your next shipment is now around ${day(model.skipTo)}.`)
                }
              }}
            >
              {busy === 'skip' ? <Loader2 size={14} className="animate-spin" /> : <FastForward size={14} />} Skip next month
            </button>
            </Action>
          )}

          {has('pause') && (
            <Action label="What does Pause do?" tip={HELP.actions.pause}>
            <button
              className={btnLight}
              disabled={working}
              onClick={() => {
                if (window.confirm('Pause your subscription? No invoices will be sent while paused, and any unpaid invoice is cancelled. Your next month keeps its normal date. You can resume anytime.')) {
                  run('pause', () => pauseSubscriptionAction(model.id), 'Subscription paused.')
                }
              }}
            >
              {busy === 'pause' ? <Loader2 size={14} className="animate-spin" /> : <Pause size={14} />} Pause subscription
            </button>
            </Action>
          )}

          {view.actions.length === 0 && model.status !== 'pending_payment' && (
            <Link href="/shop" className={btnLight}>
              Browse products
            </Link>
          )}
        </div>
      </div>

      {/* ---------- what the options mean (plain words, visible without hovering) ---------- */}
      {view.actions.length > 0 && (
        <details className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8 group" data-testid="options-help">
          <summary className="cursor-pointer text-sm font-bold uppercase tracking-[0.15em] text-black list-none flex items-center justify-between">
            What do these options do?
            <span className="text-gray-400 text-xs normal-case tracking-normal group-open:hidden">Tap to read</span>
          </summary>
          <dl className="mt-4 flex flex-col gap-4 text-sm text-gray-600">
            {view.actions.includes('pay_now') && (
              <div><dt className="font-bold text-black">Pay now</dt><dd>{HELP.actions.payNow}</dd></div>
            )}
            {view.actions.includes('order_next_month') && (
              <div><dt className="font-bold text-black">Order next month now</dt><dd>{HELP.actions.orderNextMonth}</dd></div>
            )}
            {view.actions.includes('skip_month') && (
              <div><dt className="font-bold text-black">Skip next month</dt><dd>{HELP.actions.skip}</dd></div>
            )}
            {view.actions.includes('pause') && (
              <div><dt className="font-bold text-black">Pause subscription</dt><dd>{HELP.actions.pause}</dd></div>
            )}
            {view.actions.includes('resume') && (
              <div><dt className="font-bold text-black">Resume subscription</dt><dd>{HELP.actions.resume}</dd></div>
            )}
            {view.actions.includes('reactivate') && (
              <div><dt className="font-bold text-black">Pay to reactivate</dt><dd>{HELP.actions.reactivate}</dd></div>
            )}
            <div><dt className="font-bold text-black">Will you charge my card automatically?</dt><dd>{HELP.noAutoCharge}</dd></div>
          </dl>
        </details>
      )}

      {/* ---------- schedule ---------- */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
        <h2 className={`text-xl font-bold text-black mb-4 flex items-center gap-2 ${spaceGrotesk.className}`}>
          Your {model.planMonths} months
          <InfoTip label="How do I read this list?">{HELP.schedule}</InfoTip>
        </h2>
        <ul className="divide-y divide-gray-100">
          {view.schedule.map((row) => (
            <li key={row.month} className="py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <span className="w-9 h-9 shrink-0 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-sm font-bold text-black">
                  {row.month}
                </span>
                <div className="min-w-0">
                  <span className={`inline-block px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-[0.1em] ${ROW_TONE[row.state]}`}>
                    {row.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {row.state === 'awaiting_payment' && row.date ? `Due ${day(row.date)}` : null}
                    {(row.state === 'paid' || row.state === 'shipped' || row.state === 'delivered') && row.date ? `Paid ${day(row.date)}` : null}
                    {row.state === 'upcoming' && row.date ? `Planned around ${day(row.date)}` : null}
                    {row.orderNumber ? ` · Order #${row.orderNumber}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 sm:justify-end text-sm">
                {row.total ? <span className="font-medium text-black">{money(row.total)}</span> : null}
                {row.payPath && (
                  <Link href={row.payPath} className="text-black underline font-semibold">
                    Pay now
                  </Link>
                )}
                {row.trackingLink && (
                  <a href={row.trackingLink} target="_blank" rel="noopener noreferrer" className="text-black underline font-semibold">
                    Track
                  </a>
                )}
                {row.orderNumber && !row.payPath && row.state !== 'upcoming' && row.state !== 'skipped_hold' && (
                  <Link href={`/account/orders/${row.orderNumber}`} className="text-gray-500 underline">
                    Receipt
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------- how future invoices are paid ---------- */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
        <h2 className={`text-xl font-bold text-black mb-1 flex items-center gap-2 ${spaceGrotesk.className}`}>
          How you pay future invoices
          <InfoTip label="Will my card be charged automatically?">{HELP.paymentMethod}</InfoTip>
        </h2>
        <p className="text-sm text-gray-500 mb-4">We email you a pay link (card) or Zelle instructions each month - we never charge you automatically. You can still pay any single invoice the other way from its pay page.</p>
        <div className="flex flex-wrap items-center gap-3">
          {model.allowedPaymentMethods.map((m) => (
            <label
              key={m}
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border cursor-pointer text-sm font-medium ${method === m ? 'border-black bg-black/5' : 'border-gray-200'}`}
            >
              <input type="radio" name="method" checked={method === m} onChange={() => setMethod(m)} className="accent-black" />
              {METHOD_LABEL[m] || m}
            </label>
          ))}
          <button
            className={btnDark}
            disabled={working || method === model.paymentMethod}
            onClick={() => run('method', () => setPaymentMethodAction(model.id, method), 'Payment method updated.')}
          >
            {busy === 'method' ? <Loader2 size={14} className="animate-spin" /> : null} Save
          </button>
        </div>
      </div>

      {/* ---------- shipping address ---------- */}
      <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 md:p-8">
        <h2 className={`text-xl font-bold text-black mb-1 flex items-center gap-2 ${spaceGrotesk.className}`}>
          Shipping address
          <InfoTip label="Which orders use this address?">{HELP.address}</InfoTip>
        </h2>
        <p className="text-sm text-gray-500 mb-4">Used for all future monthly orders (and any unpaid invoice).</p>
        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            run('address', () => updateAddressAction(model.id, addr), 'Shipping address updated.')
          }}
        >
          {(
            [
              ['firstName', 'First name'],
              ['lastName', 'Last name'],
              ['line1', 'Street address'],
              ['line2', 'Apartment, suite, etc. (optional)'],
              ['city', 'City'],
              ['state', 'State'],
              ['postalCode', 'ZIP code'],
              ['phone', 'Phone'],
            ] as const
          ).map(([field, label]) => (
            <label key={field} className="flex flex-col gap-1 text-xs font-bold uppercase tracking-widest text-gray-400">
              {label}
              <input
                value={addr[field]}
                onChange={(e) => setAddr((a) => ({ ...a, [field]: e.target.value }))}
                required={field !== 'line2' && field !== 'phone' && field !== 'lastName'}
                className="h-12 rounded-xl border border-gray-200 px-4 text-sm font-normal normal-case tracking-normal text-black focus:outline-none focus:border-black"
              />
            </label>
          ))}
          <div className="sm:col-span-2">
            <button type="submit" className={btnDark} disabled={working}>
              {busy === 'address' ? <Loader2 size={14} className="animate-spin" /> : null} Save address
            </button>
          </div>
        </form>
      </div>

      <p className="text-sm text-gray-500 text-center">
        Questions? Email <a href="mailto:support@longeviaresearch.com" className="underline text-black">support@longeviaresearch.com</a>
      </p>
    </div>
  )
}
