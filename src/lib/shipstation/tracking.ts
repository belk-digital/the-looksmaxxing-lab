// Carrier tracking page for a tracking number. ShipStation reports a carrierCode and a trackingNumber but no URL.
// Your account's carriers: Stamps.com (USPS) -> "stamps_com", UPS by ShipStation -> "ups_walleted",
// FedEx One Balance -> "fedex_walleted", GlobalPost -> "globalpost". Matching is by substring so other
// ShipStation carrier codes (usps, ups, fedex, dhl_express, ...) work without changes.
export function trackingUrlFor(carrierCode: unknown, trackingNumber: unknown): string | null {
  const tn = String(trackingNumber ?? '').trim()
  if (!tn) return null
  const code = String(carrierCode ?? '').toLowerCase()
  const q = encodeURIComponent(tn)
  if (code.includes('usps') || code.includes('stamps') || code.includes('endicia')) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${q}`
  if (code.includes('ups')) return `https://www.ups.com/track?tracknum=${q}`
  if (code.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${q}`
  if (code.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${q}`
  // Unknown carrier: a web search for a tracking number shows the carrier's own tracking box.
  return `https://www.google.com/search?q=${q}`
}
