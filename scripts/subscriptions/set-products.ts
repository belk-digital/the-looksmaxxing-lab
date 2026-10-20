/**
 * Switches "Subscription enabled" ON or OFF for products in the database in DATABASE_URI. It NEVER touches the master
 * switch in Subscription Settings, so customers see nothing until that switch is turned on and the new code is deployed.
 *
 *   npx tsx scripts/subscriptions/set-products.ts --all --on          every product
 *   npx tsx scripts/subscriptions/set-products.ts --all --off         every product
 *   npx tsx scripts/subscriptions/set-products.ts --on bpc-157 tb-500 only these slugs
 *
 * One transaction, with a row-count check. The list of products that were already switched on before the change is saved to
 * .local-test/product-flags-before-<time>.json so the change can be undone exactly.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'

const args = process.argv.slice(2)
const on = args.includes('--on')
const off = args.includes('--off')
const all = args.includes('--all')
const slugs = args.filter((a) => !a.startsWith('--'))
if (on === off) throw new Error('Choose exactly one of --on or --off')
if (!all && !slugs.length) throw new Error('Give --all or at least one product slug')

const uri = process.env.DATABASE_URI || ''
const url = new URL(uri)
const client = new Client({ connectionString: uri, ssl: ['127.0.0.1', 'localhost'].includes(url.hostname) ? false : { rejectUnauthorized: false } })
await client.connect()

try {
  console.log(`Database: ${url.hostname}/${url.pathname.slice(1)}  |  action: ${on ? 'SWITCH ON' : 'SWITCH OFF'}  |  products: ${all ? 'ALL' : slugs.join(', ')}`)
  const master = (await client.query('select enabled from subscription_settings limit 1')).rows[0]
  console.log(`Master switch (Subscription Settings -> enabled): ${master ? master.enabled : '(not saved yet)'}  - not touched by this script`)

  await client.query('BEGIN')
  const where = all ? '' : 'where slug = any($1)'
  const params = all ? [] : [slugs]
  const total = Number((await client.query(`select count(*)::int as n from products ${where}`, params)).rows[0].n)
  if (!all && total !== slugs.length) throw new Error(`Expected ${slugs.length} products for those slugs, found ${total}`)

  const beforeOn = (await client.query(`select id, slug from products where subscription_enabled = true order by id`)).rows
  const dir = path.join(process.cwd(), '.local-test')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `product-flags-before-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(file, JSON.stringify({ alreadyOn: beforeOn }, null, 1))
  console.log(`Products in scope: ${total}. Already switched on before: ${beforeOn.length}. Saved before-state: ${file}`)

  const countsBefore: Record<string, number> = {}
  for (const t of ['products', 'orders', 'users', 'coupons']) countsBefore[t] = Number((await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n)
  const res = await client.query(`update products set subscription_enabled = ${on} ${where ? where + ' and' : 'where'} subscription_enabled is distinct from ${on}`, params)
  console.log(`Rows changed: ${res.rowCount}`)

  const stillWrong = Number((await client.query(`select count(*)::int as n from products ${where ? where + ' and' : 'where'} subscription_enabled is distinct from ${on}`, params)).rows[0].n)
  if (stillWrong !== 0) throw new Error(`post-check failed: ${stillWrong} products are not ${on ? 'on' : 'off'}`)
  for (const [t, n] of Object.entries(countsBefore)) {
    const after = Number((await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n)
    if (after !== n) throw new Error(`post-check failed: row count of ${t} changed (${n} -> ${after})`)
  }
  const masterAfter = (await client.query('select enabled from subscription_settings limit 1')).rows[0]
  if ((master?.enabled ?? null) !== (masterAfter?.enabled ?? null)) throw new Error('post-check failed: the master switch changed')

  await client.query('COMMIT')
  const summary = (await client.query(`select count(*) filter (where subscription_enabled)::int as on_count, count(*)::int as total, count(*) filter (where status <> 'active' or is_visible = false)::int as hidden_or_draft from products`)).rows[0]
  console.log(`COMMITTED. Products with subscriptions switched on: ${summary.on_count} of ${summary.total} (${summary.hidden_or_draft} of them hidden/draft). Master switch still: ${masterAfter ? masterAfter.enabled : '(not saved yet)'}.`)
} catch (err) {
  await client.query('ROLLBACK').catch(() => undefined)
  console.error('ROLLED BACK - nothing was changed.')
  throw err
} finally {
  await client.end()
}
