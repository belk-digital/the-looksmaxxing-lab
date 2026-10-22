/**
 * Turns subscriptions ON (or OFF) in the database in DATABASE_URI. Small and reversible.
 *
 *   npx tsx scripts/subscriptions/enable-live.ts bpc-157            -> master switch ON, plans 3/6/12 @ 15%, product bpc-157 enabled
 *   npx tsx scripts/subscriptions/enable-live.ts bpc-157 tb-500     -> several products
 *   npx tsx scripts/subscriptions/enable-live.ts --off bpc-157      -> master switch OFF and those products un-ticked
 *
 * Existing plan settings are kept if they already exist; only the "enabled" switch and the product flags change.
 * Nothing is shown to customers until the new website code is deployed.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Client } from 'pg'

const args = process.argv.slice(2)
const off = args.includes('--off')
const slugs = args.filter((a) => !a.startsWith('--'))
if (!slugs.length) throw new Error('Give at least one product slug, e.g. bpc-157')

const uri = process.env.DATABASE_URI || ''
const url = new URL(uri)
console.log(`Database: ${url.hostname}/${url.pathname.slice(1)}  |  action: ${off ? 'TURN OFF' : 'TURN ON'}  |  products: ${slugs.join(', ')}`)

const payload = await getPayload({ config })
const before: any = await payload.findGlobal({ slug: 'subscription-settings' as any })
console.log('Before: enabled =', before.enabled, '| plans =', (before.plans || []).map((p: any) => `${p.months}m@${p.discountPercent}%`).join(', ') || '(none saved yet)')

const hasPlans = Array.isArray(before.plans) && before.plans.length > 0
await payload.updateGlobal({
  slug: 'subscription-settings' as any,
  data: {
    enabled: !off,
    ...(hasPlans
      ? {}
      : {
          plans: [
            { months: 1, label: 'Every month', discountPercent: 25, isActive: true },
            { months: 3, label: 'Every 3 months', discountPercent: 20, isActive: true },
            { months: 6, label: 'Every 6 months', discountPercent: 15, isActive: true },
          ],
        }),
  } as any,
})

// product flags: one small, exact SQL update per product (no product hooks, nothing else touched)
const client = new Client({ connectionString: uri, ssl: ['127.0.0.1', 'localhost'].includes(url.hostname) ? false : { rejectUnauthorized: false } })
await client.connect()
try {
  for (const slug of slugs) {
    const r = await client.query('update products set subscription_enabled = $1 where slug = $2 returning id, name, subscription_enabled', [!off, slug])
    if (r.rowCount !== 1) throw new Error(`Expected to update exactly one product for slug "${slug}", updated ${r.rowCount}`)
    console.log(`Product ${r.rows[0].id} "${r.rows[0].name}": subscription_enabled = ${r.rows[0].subscription_enabled}`)
  }
} finally {
  await client.end()
}

const after: any = await payload.findGlobal({ slug: 'subscription-settings' as any })
console.log('After:  enabled =', after.enabled, '| plans =', (after.plans || []).map((p: any) => `${p.months}m@${p.discountPercent}%${p.isActive ? '' : ' (inactive)'}`).join(', '), '| card =', after.allowCard, '| zelle =', after.allowZelle)
process.exit(0)
