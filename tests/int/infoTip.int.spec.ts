import React from 'react'
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { InfoTip } from '@/components/ui/InfoTip'
import { HELP } from '@/lib/subscriptions/helpText'
import { buildInvoiceEmail, buildReminderEmail, buildLapseEmail, buildPaymentReceivedEmail } from '@/lib/subscriptions/emails'
import { buildSubscriptionView } from '@/lib/subscriptions/view'

afterEach(cleanup)

const mount = (align?: 'left' | 'center' | 'right') =>
  render(
    React.createElement(
      'div',
      null,
      React.createElement(InfoTip, { label: 'What does Skip do?', align, children: 'Moves your next shipment one month later.' }),
      React.createElement('p', null, 'elsewhere on the page'),
    ),
  )

describe('InfoTip (the "i" icon)', () => {
  it('is a real, named button; nothing is shown until it is used', () => {
    mount()
    const btn = screen.getByRole('button', { name: 'What does Skip do?' })
    expect(btn.getAttribute('type')).toBe('button') // never submits a form
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on hover and closes when the mouse leaves', () => {
    mount()
    const wrap = screen.getByTestId('info-tip')
    fireEvent.mouseEnter(wrap)
    expect(screen.getByRole('tooltip').textContent).toBe('Moves your next shipment one month later.')
    fireEvent.mouseLeave(wrap)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on keyboard focus (and links the text to the button for screen readers)', () => {
    mount()
    const btn = screen.getByRole('button', { name: 'What does Skip do?' })
    fireEvent.focus(btn)
    const tip = screen.getByRole('tooltip')
    expect(btn.getAttribute('aria-describedby')).toBe(tip.id)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    fireEvent.blur(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('on a phone (tap, no hover) it opens on tap and closes on the next tap', () => {
    mount()
    const btn = screen.getByRole('button', { name: 'What does Skip do?' })
    fireEvent.click(btn)
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.click(btn)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('stays open after hovering away when pinned by a tap, and closes on Escape or a tap elsewhere', () => {
    mount()
    const wrap = screen.getByTestId('info-tip')
    const btn = screen.getByRole('button', { name: 'What does Skip do?' })
    fireEvent.click(btn)
    fireEvent.mouseLeave(wrap)
    expect(screen.getByRole('tooltip')).toBeTruthy() // pinned
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.click(btn)
    expect(screen.getByRole('tooltip')).toBeTruthy()
    fireEvent.mouseDown(screen.getByText('elsewhere on the page'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('only one tip is open at a time: opening another closes the first', () => {
    render(
      React.createElement(
        'div',
        null,
        React.createElement(InfoTip, { label: 'first', children: 'FIRST TEXT' }),
        React.createElement(InfoTip, { label: 'second', children: 'SECOND TEXT' }),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'first' }))
    expect(screen.getByText('FIRST TEXT')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'second' }))
    expect(screen.getByText('SECOND TEXT')).toBeTruthy()
    expect(screen.queryByText('FIRST TEXT')).toBeNull()
    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
  })

  const rectOf = (left: number, top = 80, width = 20, height = 20) =>
    ({ left, right: left + width, top, bottom: top + height, width, height, x: left, y: top, toJSON: () => ({}) }) as DOMRect
  const withLayout = (viewportWidth: number, viewportHeight: number, iconRect: DOMRect, run: () => void) => {
    const widthSpy = vi.spyOn(document.documentElement, 'clientWidth', 'get').mockReturnValue(viewportWidth)
    const heightSpy = vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(viewportHeight)
    const rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(iconRect)
    try {
      run()
    } finally {
      rectSpy.mockRestore()
      heightSpy.mockRestore()
      widthSpy.mockRestore()
    }
  }

  it('the text box floats above the page (outside any scrolling list, ignores the mouse), so it cannot cause scrollbars or flicker', () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'What does Skip do?' }))
    const tip = screen.getByRole('tooltip')
    expect(screen.getByTestId('info-tip').contains(tip)).toBe(false) // not inside the icon's parent, so no overflow:auto ancestor can hold it
    expect(tip.parentElement).toBe(document.body)
    expect(tip.style.position).toBe('fixed')
    expect(tip.style.pointerEvents).toBe('none')
  })

  it('on a narrow screen the text box is pulled back inside the screen (icon near the right edge)', () => {
    withLayout(390, 800, rectOf(360), () => {
      mount()
      fireEvent.click(screen.getByRole('button', { name: 'What does Skip do?' }))
      const tip = screen.getByRole('tooltip')
      expect(tip.style.width).toBe('256px')
      expect(tip.style.left).toBe('122px') // 390 - 12 - 256: the box ends 12px before the screen edge
    })
  })

  it('right-aligned tips grow to the left of the icon, and one starting off the left edge is pulled back in', () => {
    withLayout(390, 800, rectOf(30), () => {
      mount('right')
      fireEvent.click(screen.getByRole('button', { name: 'What does Skip do?' }))
      expect(screen.getByRole('tooltip').style.left).toBe('12px') // would have been 50 - 256 < 0
    })
  })

  it('a very narrow screen shrinks the box instead of overflowing', () => {
    withLayout(200, 800, rectOf(100), () => {
      mount()
      fireEvent.click(screen.getByRole('button', { name: 'What does Skip do?' }))
      const tip = screen.getByRole('tooltip')
      expect(tip.style.width).toBe('176px') // 200 - 2 * 12
      expect(tip.style.left).toBe('12px')
    })
  })

  it('opens below the icon', () => {
    withLayout(1000, 800, rectOf(100, 80, 20, 20), () => {
      mount()
      fireEvent.click(screen.getByRole('button', { name: 'What does Skip do?' }))
      expect(screen.getByRole('tooltip').style.top).toBe('108px') // icon bottom (100) + 8
    })
  })

  it('does not trigger the click of whatever contains it', () => {
    let outerClicks = 0
    render(
      React.createElement(
        'div',
        { onClick: () => outerClicks++ },
        React.createElement(InfoTip, { label: 'i', children: 'help' }),
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'i' }))
    expect(outerClicks).toBe(0)
  })

})

describe('plain-English help text is complete', () => {
  it('every subscription status has an explanation', () => {
    for (const status of ['pending_payment', 'active', 'paused', 'lapsed', 'completed', 'cancelled']) {
      expect(HELP.status[status], status).toBeTruthy()
      expect(HELP.status[status].length).toBeGreaterThan(20)
    }
  })

  it('every action a customer can take has an explanation, and none is empty or jargon-only', () => {
    const view = (status: string, orders: any[] = []) => buildSubscriptionView({ status, planMonths: 3, cyclesCompleted: 1 } as any, orders)
    const paid = { id: 1, cycleNumber: 1, paymentStatus: 'captured', status: 'paid', orderType: 'subscription_first' }
    const open = { id: 2, cycleNumber: 2, orderType: 'subscription_cycle', status: 'pending', paymentStatus: 'unpaid', invoiceToken: 't'.repeat(30) }
    const seen = new Set<string>()
    for (const v of [view('active', [paid]), view('active', [paid, open]), view('paused', [paid]), view('lapsed', [paid]), view('lapsed', [paid, open])]) {
      v.actions.forEach((a) => seen.add(a))
    }
    expect([...seen].sort()).toEqual(['order_next_month', 'pause', 'pay_now', 'reactivate', 'resume', 'skip_month'])
    const key: Record<string, keyof typeof HELP.actions> = { pay_now: 'payNow', order_next_month: 'orderNextMonth', skip_month: 'skip', pause: 'pause', resume: 'resume', reactivate: 'reactivate' }
    for (const action of seen) expect(HELP.actions[key[action]].length, action).toBeGreaterThan(30)
  })

  it('the key promises are stated plainly: no automatic charging, one order at a time, what is due today, what skip does', () => {
    expect(HELP.noAutoCharge).toMatch(/never charge your card/i)
    expect(HELP.dueToday).toMatch(/only pay your first order/i)
    expect(HELP.dueToday).toMatch(/ever charged to your card automatically/i)
    expect(HELP.billedEvery).toMatch(/one order at a time/i)
    expect(HELP.actions.skip).toMatch(/one full interval/i)
    expect(HELP.actions.skip).toMatch(/will not receive an order for the skipped period/i)
    expect(HELP.whatIsSubscription).toMatch(/every month, every 3 months or every 6 months/i)
    expect(HELP.whatIsSubscription).toMatch(/until you pause it/i)
    expect(HELP.stopForGood).toMatch(/pause/i)
    expect(HELP.stopForGood).toMatch(/support@longeviaresearch.com/)
    expect(HELP.actions.pause).toMatch(/Nothing is due while paused/i)
    expect(HELP.paymentMethod).toMatch(/never charge automatically/i)
  })

  it('every subscription email tells the customer why they are receiving it', () => {
    const order = { id: 7, orderNumber: '1007', cycleNumber: 2, total: 45, subtotal: 40, shippingTotal: 5, feeTotal: 0, invoiceDueDate: '2026-11-20T00:00:00Z', invoiceToken: 'tok1234567890123456789', paymentMethod: 'authnet_bridge', items: [] }
    const mails = [
      buildInvoiceEmail({ order, subscriptionId: 9, reason: 'scheduled', intervalMonths: 6 }),
      buildReminderEmail({ order, subscriptionId: 9, stage: 1, intervalMonths: 6 }),
      buildReminderEmail({ order, subscriptionId: 9, stage: 2, intervalMonths: 6 }),
      buildLapseEmail({ order, subscriptionId: 9, intervalMonths: 6 }),
      buildPaymentReceivedEmail({ order, subscriptionId: 9, intervalMonths: 6 }),
    ]
    for (const m of mails) {
      expect(m.html).toContain('Why am I getting this?')
      expect(m.html).toContain('every 6 months')
      expect(m.html).toContain('never charge your card automatically')
    }
  })
})
