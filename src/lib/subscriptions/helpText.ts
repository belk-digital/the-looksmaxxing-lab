/**
 * Plain-English explanations shown next to the "i" icons and in help lines across the storefront.
 * Kept in one place so the wording is consistent and easy to review or change.
 */
export const HELP = {
  whatIsSubscription:
    'A subscription sends you one order every month for the length you choose (3, 6 or 12 months). You pay for one month at a time - never everything at once - and every order gets the plan discount. You can pause, skip a month or order early whenever you like.',

  planDiscount:
    'The plan discount is taken off the product price of every monthly order. It is locked in on the day you subscribe.',

  billedMonthly:
    'Billed monthly means you pay for one month at a time. The price shown is the price of one month, after your plan discount.',

  dueToday:
    'You only pay month 1 now. The other months are invoiced one by one: about a week before each is due we email you a secure link (card) or Zelle instructions. Nothing is ever charged to your card automatically.',

  noAutoCharge:
    'We never charge your card on our own. Each month we email you an invoice with a secure pay link (or Zelle instructions) and you pay when you are ready. Your order ships once the payment is confirmed.',

  priceFollowsStore:
    'Each monthly invoice uses the store price on the day it is created, minus your plan discount. Prices you have already paid never change.',

  monthsPaid: 'Every month of your plan is one order. A month counts as paid once its payment is confirmed.',

  schedule:
    'One row per month of your plan. "Awaiting payment" means an invoice has been sent to you. "Upcoming" means it has not been created yet - we create it about a week before it is due.',

  paymentMethod:
    'This is how you will pay future invoices. We never charge automatically: each month you get an email with a pay link (card) or Zelle instructions, and you pay when you are ready. You can still pay any single invoice the other way from its pay page.',

  address:
    'Future monthly orders ship to this address. Changing it also updates any invoice you have not paid yet. Orders already paid keep the address they were placed with.',

  amountDue:
    'This is one month of your plan: the product price minus your plan discount, plus shipping and any processing fee - worked out the same way as a normal order.',

  payByCard:
    'You will be taken to our secure partner checkout (Longevia Beauty) to enter your card details, then brought straight back here. We never see or store your card number.',

  couponFirstMonth: 'Your coupon is taken off your first payment only. Later monthly invoices are at the normal plan price.',
  couponEveryMonth: 'Your coupon is taken off every monthly invoice of this plan (on top of the plan discount), not just the first payment.',

  actions: {
    payNow: 'Opens a secure page where you can pay this month\'s invoice by card or Zelle. Your order ships once the payment is confirmed.',
    orderNextMonth:
      'Do not want to wait? We create next month\'s invoice right away so you can pay it today and receive it sooner. Your following month is then due one month after you pay.',
    skip:
      'Moves your next shipment one month later. You still receive every month of your plan - it just finishes a month later. If an invoice is open for that month it is cancelled, so you do not need to pay it.',
    pause:
      'Stops all invoices until you resume. Nothing is due while paused, and any unpaid invoice is cancelled. Months you already paid are not affected. Pausing does not move your dates: your next month keeps its normal date.',
    resume:
      'Restarts your plan. Your next month keeps its normal date (one month after your last payment): if that date is still ahead we send the invoice then, and if it already passed while you were paused we create the invoice straight away so you can pay it and continue.',
    reactivate:
      'Your last invoice was not paid, so we put your plan on hold. Pay a fresh invoice for that month and your plan continues as normal.',
  },

  status: {
    pending_payment: 'Your plan starts as soon as your first payment is confirmed. Until then nothing else happens.',
    active: 'Your plan is running normally. Each month we send an invoice, and your order ships after you pay it.',
    paused: 'You paused your plan. No invoices are sent until you resume.',
    lapsed: 'An invoice was not paid in time, so billing is on hold. Pay a fresh invoice to continue.',
    completed: 'Every month of this plan has been paid. Thank you!',
    cancelled: 'This subscription has been cancelled. Nothing more will be invoiced.',
  } as Record<string, string>,
} as const
