/**
 * Pure date rules for subscriptions. No database access, so every rule is unit-testable.
 * All dates are handled in UTC; "due day" granularity is a whole UTC day.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

/** Whole UTC days from `from` to `to` (negative if `to` is earlier). */
export function diffDays(from: Date, to: Date): number {
  return Math.round((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / DAY_MS)
}

/**
 * Adds calendar months and clamps to the end of the target month
 * (Jan 31 + 1 month = Feb 28/29, never Mar 3).
 */
export function addMonths(d: Date, months: number): Date {
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + months
  const targetYear = y + Math.floor(m / 12)
  const targetMonth = ((m % 12) + 12) % 12
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate()
  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      Math.min(d.getUTCDate(), lastDay),
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds(),
    ),
  )
}

/** Next month is due one calendar month after the previous month was paid. */
export function nextDueAfterPayment(paidAt: Date): Date {
  return addMonths(paidAt, 1)
}

/**
 * What happens when a PAUSED subscription is resumed ("the calendar keeps running").
 *
 * A pause only stops invoices; it never changes WHEN a month is due. The next month keeps its normal date - one month after the
 * previous month was paid (or the later date it was moved to by "skip"):
 *   - its invoice date is still ahead      -> 'wait': nothing is created now, the daily job sends the invoice on its normal day
 *   - the date passed while paused (or the invoice is due to go out within the lead time anyway)
 *                                          -> 'invoice_now': create the invoice right away
 * An invoice created on resume never is due sooner than 2 days from now, and one that was already overdue gets the full lead time.
 */
export interface ResumePlan {
  mode: 'wait' | 'invoice_now'
  /** Due date of the next month. */
  dueDate: Date
  /** The day the invoice is emailed ('wait'), or now ('invoice_now'). */
  invoiceDate: Date
}

export function planResume(args: { now: Date; scheduledDue: Date | null; lastPaidAt: Date | null; leadDays: number }): ResumePlan {
  const { now, leadDays } = args
  const valid = (d: Date | null): d is Date => !!d && !isNaN(d.getTime())
  // never earlier than one month after the last payment (that is the rule), but keep a later date set by "skip"
  const candidates = [valid(args.scheduledDue) ? args.scheduledDue : null, valid(args.lastPaidAt) ? nextDueAfterPayment(args.lastPaidAt) : null].filter(
    (d): d is Date => d !== null,
  )
  const original = candidates.length ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : now

  const invoiceDate = invoiceDateFor(original, leadDays)
  if (invoiceDate.getTime() > now.getTime()) return { mode: 'wait', dueDate: original, invoiceDate }

  const earliest = addDays(now, 2)
  const dueDate = original.getTime() <= now.getTime() ? addDays(now, Math.max(2, leadDays)) : original < earliest ? earliest : original
  return { mode: 'invoice_now', dueDate, invoiceDate: now }
}

/** The day the invoice for a due date should be created (and emailed). */
export function invoiceDateFor(due: Date, leadDays: number): Date {
  return addDays(due, -Math.max(0, leadDays))
}

export interface ReminderRules {
  /** Days after the due date when the final notice goes out. */
  finalNoticeAfterDays: number
  /** Days after the due date when an unpaid invoice lapses. */
  lapseAfterDays: number
}

/**
 * What an unpaid invoice should have reached by `now`:
 *   0 = nothing yet (before the due day)
 *   1 = due-day reminder
 *   2 = final notice
 *   3 = lapsed
 * The caller sends the email for the highest stage not yet sent, so a missed cron day catches up
 * without sending several emails at once.
 */
export function desiredReminderStage(now: Date, due: Date, rules: ReminderRules): 0 | 1 | 2 | 3 {
  const late = diffDays(due, now) // days past the due day (negative before it)
  if (late >= rules.lapseAfterDays) return 3
  if (late >= rules.finalNoticeAfterDays) return 2
  if (late >= 0) return 1
  return 0
}
