/**
 * Plan discount math. Shared by the browser (product page / cart preview) and the server
 * (authoritative pricing) so both always produce the exact same cents.
 */
export function applyPlanDiscount(unitPrice: number, percent: number): number {
  if (!Number.isFinite(unitPrice)) return unitPrice
  const pct = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0))
  const cents = Math.round(unitPrice * 100)
  return Math.round((cents * (100 - pct)) / 100) / 100
}
