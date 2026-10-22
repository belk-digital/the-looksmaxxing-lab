/**
 * Plain-English explanations shown next to the "i" icons and in help lines across the storefront.
 * Kept in one place so the wording is consistent and easy to review or change.
 *
 * The model: a subscription sends a new order on a fixed interval (every month, every 3 months or every 6 months,
 * depending on the plan) until the customer pauses it. The customer pays one invoice at a time.
 */
export const HELP = {
  whatIsSubscription:
    'A subscription sends you a new order on a schedule you choose - every month, every 3 months or every 6 months - until you pause it. You pay for one order at a time, never in advance, and every order gets the plan discount. You can pause, skip a delivery or order early whenever you like.',

  planDiscount:
    'The plan discount is taken off the product price of every order in your subscription. It is locked in on the day you subscribe.',

  billedEvery:
    'You pay for one order at a time, when its invoice arrives. The price shown is the price of one order, after your plan discount.',

  dueToday:
    'You only pay your first order now. After that, before each order is due, we email you a secure link (card) or Zelle instructions. Nothing is ever charged to your card automatically.',

  noAutoCharge:
    'We never charge your card on our own. Whenever an order is due we email you an invoice with a secure pay link (or Zelle instructions) and you pay when you are ready. Your order ships once the payment is confirmed.',

  priceFollowsStore:
    'Each invoice uses the store price on the day it is created, minus your plan discount. Prices you have already paid never change.',

  ordersPaid: 'Each order of your subscription is paid by you when its invoice arrives. An order counts as paid once its payment is confirmed.',

  orderSchedule:
    'Your plan sends a new order on a fixed schedule - every month, every 3 months or every 6 months, depending on the plan you chose - until you pause it.',

  schedule:
    'Your orders, oldest first. "Awaiting payment" means an invoice has been sent to you. "Upcoming" is your next order: we create its invoice before it is due.',

  paymentMethod:
    'This is how you will pay future invoices. We never charge automatically: whenever an order is due you get an email with a pay link (card) or Zelle instructions, and you pay when you are ready. You can still pay any single invoice the other way from its pay page.',

  address:
    'Future orders ship to this address. Changing it also updates any invoice you have not paid yet. Orders already paid keep the address they were placed with.',

  amountDue:
    'This is one order of your subscription: the product price minus your plan discount, plus shipping and any processing fee - worked out the same way as a normal order.',

  payByCard:
    'You will be taken to our secure partner checkout (Longevia Beauty) to enter your card details, then brought straight back here. We never see or store your card number.',

  couponFirstMonth: 'Your coupon is taken off your first order only. Later orders are at the normal plan price.',
  couponEveryMonth: 'Your coupon is taken off every order of this subscription (on top of the plan discount), not just the first one.',

  stopForGood: 'Want to stop for good? You can pause your subscription anytime, or email support@longeviaresearch.com and we will cancel it for you.',

  actions: {
    payNow: "Opens a secure page where you can pay this order's invoice by card or Zelle. Your order ships once the payment is confirmed.",
    orderNextMonth:
      'Do not want to wait? We create your next invoice right away so you can pay it today and receive your order sooner. Your following order is then due one full interval (1, 3 or 6 months, depending on your plan) after you pay.',
    skip:
      'Moves your next delivery back by one full interval (1, 3 or 6 months, depending on your plan). You will not receive an order for the skipped period. If an invoice is open for it, it is cancelled, so you do not need to pay it.',
    pause:
      'Stops all invoices until you resume. Nothing is due while paused, and any unpaid invoice is cancelled. Orders you already paid are not affected. Pausing does not move your dates: your next order keeps its normal date.',
    resume:
      'Restarts your subscription. Your next order keeps its normal date (one interval after your last payment): if that date is still ahead we send the invoice then, and if it already passed while you were paused we create the invoice straight away so you can pay it and continue.',
    reactivate:
      'Your last invoice was not paid, so we put your subscription on hold. Pay a fresh invoice for that order and your subscription continues as normal.',
  },

  status: {
    pending_payment: 'Your subscription starts as soon as your first payment is confirmed. Until then nothing else happens.',
    active: 'Your subscription is running normally. Whenever an order is due we send an invoice, and your order ships after you pay it.',
    paused: 'You paused your subscription. No invoices are sent until you resume.',
    lapsed: 'An invoice was not paid in time, so your subscription is on hold. Pay a fresh invoice to continue.',
    completed: 'This subscription has ended. Nothing more will be invoiced.',
    cancelled: 'This subscription has been cancelled. Nothing more will be invoiced.',
  } as Record<string, string>,
} as const
