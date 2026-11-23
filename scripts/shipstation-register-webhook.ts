// Registers, lists or removes the ShipStation SHIP_NOTIFY webhook that tells the site when a shipping label is
// created, so the order can be marked shipped and the customer gets their tracking email.
//
//   pnpm shipstation-webhook --base-url https://longeviaresearch.com                       list + show what WOULD change (changes nothing)
//   pnpm shipstation-webhook --base-url https://longeviaresearch.com --apply               register it (replaces a stale one of this site)
//   pnpm shipstation-webhook --base-url https://longeviaresearch.com --store-id <this site's store id> --apply
//                                                                                          register it for ONE ShipStation store only
//   pnpm shipstation-webhook --base-url https://longeviaresearch.com --remove --apply      remove THIS site's webhook(s)
//
// Several sites share one ShipStation account and use the same webhook path, so a webhook is "this site's" only if its
// address starts with --base-url's origin + /api/webhooks/shipstation. Every other webhook on the account (other sites,
// other tools) is listed but never touched. The URL carries a secret token derived from SHIPSTATION_API_SECRET (see
// src/lib/shipstation/webhookAuth.ts), so run this with the same SHIPSTATION_API_SECRET the live site uses.
// The token is masked in this script's output.
import { shipstationRequest } from '../src/lib/shipstation/client'
import { shipstationWebhookToken } from '../src/lib/shipstation/webhookAuth'

const args = process.argv.slice(2)
const flag = (n: string) => args.includes(n)
const value = (n: string) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }

const WEBHOOK_PATH = '/api/webhooks/shipstation'
const EVENT = 'SHIP_NOTIFY'
const mask = (url: string) => url.replace(/token=([0-9a-f]{4})[0-9a-f]+/i, 'token=$1…(hidden)')
// ShipStation's list response uses PascalCase keys; accept either casing so a harmless change there does not break us
const pick = (o: any, ...keys: string[]) => { for (const k of keys) if (o?.[k] !== undefined) return o[k]; return undefined }
const urlOf = (w: any) => String(pick(w, 'Url', 'url', 'target_url') || '')
const idOf = (w: any) => pick(w, 'WebHookID', 'WebhookID', 'id')
const storeOf = (w: any) => pick(w, 'StoreID', 'storeId', 'store_id') ?? null

async function main() {
  const apply = flag('--apply')
  const remove = flag('--remove')
  const secret = process.env.SHIPSTATION_API_SECRET
  if (!secret || !process.env.SHIPSTATION_API_KEY) throw new Error('SHIPSTATION_API_KEY / SHIPSTATION_API_SECRET are not set.')

  const baseUrl = value('--base-url')
  const origin = baseUrl ? new URL(baseUrl).origin : null
  const storeArg = value('--store-id')
  const storeId = storeArg ? Number(storeArg) : null
  if (storeArg && (!Number.isInteger(storeId) || (storeId as number) <= 0)) throw new Error('--store-id must be a whole number (ids come from ShipStation GET /stores)')
  if (remove && !origin) throw new Error("Pass --base-url so only THIS site's webhooks are removed.")

  const listed = await shipstationRequest<any>('/webhooks')
  const all: any[] = listed?.webhooks || listed || []
  // Only this site's own webhooks: other sites on the same account use the same path, so the path alone is NOT enough.
  const ours = origin ? all.filter((w) => urlOf(w).startsWith(origin + WEBHOOK_PATH)) : []
  console.log(`Webhooks on the account: ${all.length}${origin ? `, belonging to ${origin}: ${ours.length}` : ''}`)
  for (const w of all) {
    const mine = ours.includes(w)
    const shown = mine ? mask(urlOf(w)) : urlOf(w).replace(/[?#].*$/, '')
    console.log(`  ${mine ? '*' : ' '} #${idOf(w)}  ${pick(w, 'HookType', 'event')}  store=${storeOf(w) ?? 'all'}  active=${pick(w, 'Active', 'active')}  ${shown}`)
  }
  if (origin) console.log('  (* = this site; everything else is left alone)')

  if (remove) {
    if (!ours.length) return console.log('Nothing to remove.')
    for (const w of ours) {
      if (!apply) console.log(`  would remove #${idOf(w)}   (add --apply to do it)`)
      else { await shipstationRequest(`/webhooks/${idOf(w)}`, { method: 'DELETE' }); console.log(`  removed #${idOf(w)}`) }
    }
    return
  }

  if (!baseUrl || !origin) throw new Error('Pass --base-url https://your-live-domain')
  const url = new URL(baseUrl)
  if (url.protocol !== 'https:' || /^(localhost|127\.|0\.0\.0\.0|.*\.local$)/i.test(url.hostname)) {
    throw new Error('ShipStation can only reach a public https address, not ' + url.origin)
  }
  const target = `${url.origin}${WEBHOOK_PATH}?token=${shipstationWebhookToken(secret)}`

  const current = ours.find((w) => urlOf(w) === target && pick(w, 'HookType', 'event') === EVENT && String(storeOf(w) ?? '') === String(storeId ?? ''))
  if (current) return console.log(`Already registered with the right address, token and store (${storeId ?? 'all stores'}). Nothing to do.`)

  const stale = ours // this site's older registration (wrong address, token or store scope)
  console.log(`\nWill register ${EVENT} -> ${mask(target)}  for ${storeId ? `store ${storeId} only` : 'ALL stores'}`)
  for (const w of stale) console.log(`  and then remove this site's older #${idOf(w)} (store=${storeOf(w) ?? 'all'})`)
  if (!apply) return console.log('\nDry run only. Add --apply to do it.')

  // Register the new one FIRST: if ShipStation refuses it, the old one is still in place and nothing is lost.
  const res = await shipstationRequest<any>('/webhooks/subscribe', {
    method: 'POST',
    body: { target_url: target, event: EVENT, friendly_name: 'Longevia Research site (shipment tracking)', ...(storeId ? { store_id: storeId } : {}) },
  })
  console.log('Registered. ShipStation webhook id:', res?.id ?? JSON.stringify(res))
  for (const w of stale) { await shipstationRequest(`/webhooks/${idOf(w)}`, { method: 'DELETE' }); console.log(`  removed older #${idOf(w)}`) }
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1) })
