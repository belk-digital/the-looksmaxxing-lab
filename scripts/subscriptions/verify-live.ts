/**
 * READ-ONLY check of the database in DATABASE_URI after a subscription migration, against a backup taken just before it.
 *
 *   npx tsx scripts/subscriptions/verify-live.ts <backup-folder>
 *
 * 1. every row of every table in the backup is still in the database, with exactly the same values in every column that
 *    existed at backup time (new columns are the only difference)
 * 2. no table lost or gained rows - except payload_migrations, which gains exactly one row per migration that was applied
 *    after the backup was taken, and brand-new tables, which must still be empty
 * 3. the number of subscription orders (order_type other than 'one_time') is unchanged
 * 4. if the coupons migration ran: every coupon that existed at backup time is "not for subscriptions" (first month)
 * 5. every new table/column of both migrations exists
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { Client } from 'pg'
import * as subscriptionsMigration from '../../src/migrations/20261020_000000_add_subscriptions'
import * as couponsMigration from '../../src/migrations/20261021_000000_add_subscription_coupons'

const MIGRATIONS = [
  { name: subscriptionsMigration.MIGRATION_NAME, tables: subscriptionsMigration.EXPECTED_NEW_TABLES, columns: subscriptionsMigration.EXPECTED_NEW_COLUMNS },
  { name: couponsMigration.MIGRATION_NAME, tables: couponsMigration.EXPECTED_NEW_TABLES, columns: couponsMigration.EXPECTED_NEW_COLUMNS },
]

const stable = (v: unknown): string => JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1))) : x))
const readRows = (folder: string, table: string): any[] => {
  const file = path.join(folder, `${table}.jsonl`)
  if (!fs.existsSync(file)) return []
  const text = fs.readFileSync(file, 'utf8')
  return text ? text.trimEnd().split('\n').map((l) => JSON.parse(l)) : []
}

async function main() {
  const folder = process.argv[2]
  if (!folder || !fs.existsSync(path.join(folder, '_manifest.json'))) throw new Error('Pass the backup folder as the first argument')
  const uri = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URI is not set')
  const url = new URL(uri)
  const client = new Client({ connectionString: uri, ssl: ['127.0.0.1', 'localhost'].includes(url.hostname) ? false : { rejectUnauthorized: false } })
  await client.connect()
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')

  const problems: string[] = []
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, '_manifest.json'), 'utf8')).tables as Record<string, { rows: number }>
  const backedUpMigrations = new Set(readRows(folder, 'payload_migrations').map((r) => r.name))
  const appliedSince = MIGRATIONS.filter((m) => !backedUpMigrations.has(m.name)).map((m) => m.name)
  let compared = 0

  try {
    for (const table of Object.keys(manifest)) {
      const before = readRows(folder, table)
      const live = (await client.query(`select row_to_json(x)::text as j from "${table}" x`)).rows.map((r) => JSON.parse(r.j))
      const expectedExtra = table === 'payload_migrations' ? appliedSince.length : 0
      if (live.length !== before.length + expectedExtra) problems.push(`${table}: had ${before.length} rows, now ${live.length} (expected ${before.length + expectedExtra})`)
      if (table === 'payload_migrations') {
        for (const name of appliedSince) {
          if (live.filter((r) => r.name === name).length !== 1) problems.push(`payload_migrations should list ${name} exactly once`)
        }
      }
      const oldCols = before.length ? Object.keys(before[0]) : []
      const keyOf = (row: any) => stable(Object.fromEntries(oldCols.map((c) => [c, row[c]])))
      const liveKeys = new Map<string, number>()
      for (const row of live) liveKeys.set(keyOf(row), (liveKeys.get(keyOf(row)) || 0) + 1)
      for (const row of before) {
        const k = keyOf(row)
        const n = liveKeys.get(k) || 0
        if (!n) {
          problems.push(`${table}: a row changed or disappeared: ${k.slice(0, 160)}`)
          break
        }
        liveKeys.set(k, n - 1)
      }
      compared += before.length
    }

    // 3. subscription orders unchanged
    const backupOrders = readRows(folder, 'orders')
    const nonOneTimeBefore = backupOrders.filter((o) => o.order_type !== undefined && o.order_type !== null && o.order_type !== 'one_time').length
    const nonOneTimeNow = Number((await client.query(`select count(*)::int as n from orders where order_type is distinct from 'one_time'`)).rows[0].n)
    if (nonOneTimeNow !== nonOneTimeBefore) problems.push(`subscription orders: had ${nonOneTimeBefore}, now ${nonOneTimeNow}`)

    // 4. coupons that existed before the coupons migration are "not for subscriptions"
    const backupCoupons = readRows(folder, 'coupons')
    if (backupCoupons.length && backupCoupons[0].allow_on_subscriptions === undefined) {
      const ids = backupCoupons.map((c) => c.id)
      const bad = Number((await client.query(`select count(*)::int as n from coupons where id = any($1) and (allow_on_subscriptions is distinct from false or subscription_discount_scope is distinct from 'first_month')`, [ids])).rows[0].n)
      if (bad) problems.push(`${bad} existing coupons are not set to "not for subscriptions / first month"`)
    }

    // brand-new tables (created after the backup) must still be empty
    for (const m of MIGRATIONS) {
      for (const t of m.tables) {
        if (manifest[t]) continue
        const n = Number((await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n)
        if (n !== 0) problems.push(`new table ${t} is not empty (${n})`)
      }
    }

    // 5. every expected column exists
    for (const m of MIGRATIONS) {
      for (const [t, c] of m.columns) {
        const r = await client.query(`select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`, [t, c])
        if (!r.rows.length) problems.push(`missing column ${t}.${c}`)
      }
    }
  } finally {
    await client.query('ROLLBACK')
    await client.end()
  }

  console.log(`Compared ${compared} existing rows across ${Object.keys(manifest).length} tables against the backup. Migrations applied since the backup: ${appliedSince.join(', ') || '(none)'}`)
  if (problems.length) {
    console.error('PROBLEMS FOUND:\n - ' + problems.join('\n - '))
    process.exit(2)
  }
  console.log('VERIFIED: every existing row is unchanged, subscription orders are unchanged, new columns/tables exist, existing coupons are "not for subscriptions".')
}

main().catch((e) => {
  console.error('VERIFY FAILED:', e.message)
  process.exit(1)
})
