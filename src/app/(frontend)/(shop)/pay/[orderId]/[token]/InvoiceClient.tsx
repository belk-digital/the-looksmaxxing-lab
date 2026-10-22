'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, Loader2, RefreshCw } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'
import { submitBridgeHandoff } from '@/lib/payments/submitHandoff'
import { startInvoiceCardPayment } from '../../actions'
import { everyLabel, orderLabel } from '@/lib/subscriptions/labels'

export interface InvoiceViewModel {
  orderId: string
  token: string
  orderNumber: string
  state: 'open' | 'paid' | 'inactive'
  returnedFromPayment: boolean
  order: number
  intervalMonths: number
  discountPercent: number
  paymentMethod: 'authnet_bridge' | 'zelle'
  cardAvailable: boolean
  total: number
  subtotal: number
  discount: number
  couponCode: string | null
  shipping: number
  fees: number
  dueDate: string | null
  paidAt: string | null
  subscriptionId: string | null
  nextDueDate: string | null
  items: { name: string; variant: string; quantity: number; lineTotal: number }[]
}

const money = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0)
const date = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : ''

const ZELLE_QR = 'https://pub-0ab0207d475a48e7b7e92a35418eace6.r2.dev/email-assets/longevia-zelle-qr.jpeg'

export function InvoiceClient({ invoice }: { invoice: InvoiceViewModel }) {
  const router = useRouter()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Back from the card page but the confirmation hasn't reached us yet: check again every few seconds.
  const waiting = invoice.state === 'open' && invoice.returnedFromPayment
  useEffect(() => {
    if (!waiting) return
    let tries = 0
    const timer = setInterval(() => {
      tries++
      router.refresh()
      if (tries >= 36) clearInterval(timer) // ~3 minutes
    }, 5000)
    return () => clearInterval(timer)
  }, [waiting, router])

  const payByCard = async () => {
    setError(null)
    setPaying(true)
    try {
      const res: any = await startInvoiceCardPayment(invoice.orderId, invoice.token)
      if (res?.error || !res?.redirectUrl || !res?.fields) {
        setError(res?.error || 'Could not start the payment. Please try again.')
        setPaying(false)
        return
      }
      submitBridgeHandoff(res)
    } catch {
      setError('Something went wrong. Please try again.')
      setPaying(false)
    }
  }

  const monthLabel = orderLabel(invoice.order)
  const manageHref = invoice.subscriptionId ? `/account/subscriptions/${invoice.subscriptionId}` : '/account/subscriptions'

  return (
    <div className="min-h-screen bg-[#fafafa] pt-16 pb-32">
      <Container size="page" className="flex flex-col items-center px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block bg-ink text-white text-[11px] font-bold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full">
                Subscription &middot; {monthLabel}
              </span>
              <InfoTip label="What is a subscription?" align="center">{HELP.whatIsSubscription}</InfoTip>
            </span>
            <h1 className="mt-5 text-3xl md:text-4xl font-display font-bold text-ink">
              {invoice.state === 'paid' ? 'Payment received' : invoice.state === 'open' ? 'Your invoice' : 'Invoice no longer active'}
            </h1>
            <p className="mt-2 text-sm text-ink/60">Invoice #{invoice.orderNumber}</p>
            {invoice.state === 'open' && (
              <p className="mt-3 mx-auto max-w-md text-sm text-ink/60" data-testid="invoice-explainer">
                {`You subscribed to have an order delivered ${everyLabel(invoice.intervalMonths)}. Whenever an order is due we email an invoice like this one - pay it and that order ships. We never charge your card automatically.`}
              </p>
            )}
          </div>

          {invoice.state === 'paid' && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-3">
                <Check size={24} />
              </div>
              <p className="font-bold text-green-900">Thank you - this invoice is paid.</p>
              <p className="text-sm text-green-800 mt-1">
                {invoice.paidAt ? `Paid on ${date(invoice.paidAt)}. ` : ''}
                Your order is being prepared and tracking details will be emailed once it ships.
                {invoice.nextDueDate ? ` Your next invoice is due around ${date(invoice.nextDueDate)}.` : ''}
              </p>
            </div>
          )}

          {invoice.state === 'inactive' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center mb-8">
              <p className="font-bold text-amber-900">This invoice is no longer active.</p>
              <p className="text-sm text-amber-800 mt-1">
                It was cancelled (for example because a delivery was skipped, the subscription was paused, or it went unpaid). Open your
                subscription to see what to do next - you can reactivate or order your next delivery anytime.
              </p>
              <Link href={manageHref} className="inline-block mt-4 bg-ink text-white rounded-full px-6 py-3 text-xs font-bold uppercase tracking-widest">
                Open my subscription
              </Link>
            </div>
          )}

          {waiting && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center mb-6 flex flex-col items-center gap-2">
              <RefreshCw size={18} className="animate-spin text-blue-700" />
              <p className="font-bold text-blue-900">Confirming your payment...</p>
              <p className="text-sm text-blue-800">
                If you just paid, this page updates by itself within a minute or two - there is no need to pay again. If you did not complete the
                payment, you can try again below.
              </p>
            </div>
          )}

          {invoice.state === 'open' && (
            <div className="bg-white border border-ink/10 rounded-2xl shadow-sm p-6 sm:p-8 mb-8 text-center">
              <p className="inline-flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-ink/40">
                Amount due
                <InfoTip label="What does the amount include?" align="center">{HELP.amountDue}</InfoTip>
              </p>
              <p className="text-4xl font-bold text-ink mt-1">{money(invoice.total)}</p>
              {invoice.dueDate && <p className="text-sm text-ink/60 mt-1">Due by <strong>{date(invoice.dueDate)}</strong></p>}
              <p className="text-sm text-ink/50 mt-1">Your order ships as soon as this payment is received.</p>

              {invoice.paymentMethod === 'authnet_bridge' || invoice.cardAvailable ? (
                <div className="mt-6">
                  {invoice.paymentMethod === 'zelle' && (
                    <p className="text-xs text-ink/50 mb-2">Prefer a card? You can pay this invoice by card instead.</p>
                  )}
                  <button
                    onClick={payByCard}
                    disabled={paying || !invoice.cardAvailable}
                    className="w-full max-w-sm h-14 rounded-full bg-ink text-white text-sm font-bold uppercase tracking-widest inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {paying ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
                    {paying ? 'Redirecting...' : `Pay ${money(invoice.total)} by card`}
                  </button>
                  {!invoice.cardAvailable && <p className="text-xs text-red-600 mt-2">Card payment is temporarily unavailable.</p>}
                  {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
                  <p className="text-xs text-ink/40 mt-3 inline-flex items-center justify-center gap-1.5">
                    You will be redirected to our secure partner checkout (Longevia Beauty) and brought back here afterwards.
                    <InfoTip label="Is card payment safe?" align="center">{HELP.payByCard}</InfoTip>
                  </p>
                </div>
              ) : null}

              {invoice.paymentMethod === 'zelle' && (
                <div className="mt-8 text-left bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-amber-900 text-center">Pay with Zelle</h2>
                  <p className="text-sm text-amber-900 text-center mt-2">
                    Send <strong>{money(invoice.total)}</strong> via Zelle to:
                  </p>
                  <div className="flex justify-center my-4">
                    <Image src={ZELLE_QR} alt="Zelle payment QR code" width={180} height={180} className="rounded-xl border-2 border-amber-200" />
                  </div>
                  <p className="text-center font-mono font-bold text-ink bg-white border border-amber-200 rounded-lg py-2 px-3 break-all">
                    support@longeviaresearch.com
                  </p>
                  <p className="text-xs text-amber-900 text-center mt-3">
                    <strong>Important:</strong> include order number <strong>#{invoice.orderNumber}</strong> in the payment note. We mark your order paid
                    once we see it.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-ink/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink/40 mb-4">Order summary</h2>
              <ul className="divide-y divide-ink/5">
                {invoice.items.map((item, i) => (
                  <li key={i} className="py-3 flex justify-between gap-4 text-sm">
                    <span className="text-ink">
                      <strong>{item.name}</strong>
                      {item.variant ? <span className="text-ink/50"> - {item.variant}</span> : null}
                      <span className="block text-xs text-ink/50">Qty {item.quantity}</span>
                    </span>
                    <span className="font-medium text-ink">{money(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-ink/60">
                  <dt>Subtotal ({invoice.discountPercent}% plan discount applied)</dt>
                  <dd className="text-ink">{money(invoice.subtotal)}</dd>
                </div>
                {invoice.discount > 0 && (
                  <div className="flex justify-between text-ink/60" data-testid="invoice-coupon-row">
                    <dt>{invoice.couponCode ? `Coupon (${invoice.couponCode})` : 'Coupon'}</dt>
                    <dd className="text-ink">{`-${money(invoice.discount)}`}</dd>
                  </div>
                )}
                <div className="flex justify-between text-ink/60">
                  <dt>Shipping</dt>
                  <dd className="text-ink">{invoice.shipping ? money(invoice.shipping) : 'Free'}</dd>
                </div>
                {invoice.fees > 0 && (
                  <div className="flex justify-between text-ink/60">
                    <dt>Processing fees</dt>
                    <dd className="text-ink">{money(invoice.fees)}</dd>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-ink/10 text-base font-bold text-ink">
                  <dt>Total</dt>
                  <dd>{money(invoice.total)}</dd>
                </div>
              </dl>
            </div>
            <div className="bg-[#fafafa] border-t border-ink/5 px-6 sm:px-8 py-4 text-sm text-ink/60 flex flex-col sm:flex-row justify-between gap-2">
              <span>
                Need to skip this delivery or pause? <Link href={manageHref} className="text-ink underline font-medium">Manage my subscription</Link>
              </span>
              <a href="mailto:support@longeviaresearch.com" className="text-ink underline font-medium">Contact support</a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
