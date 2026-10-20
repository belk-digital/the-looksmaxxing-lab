/**
 * Applies the subscription database migrations SAFELY (in order, only what is still missing).
 *
 *   DRY RUN (default - changes nothing):
 *     npx tsx scripts/subscriptions/apply-migration.ts
 *
 *   APPLY to a local/test database:
 *     npx tsx scripts/subscriptions/apply-migration.ts --apply
 *
 *   APPLY to a remote (e.g. Supabase production) database - requires an explicit backup confirmation:
 *     npx tsx scripts/subscriptions/apply-migration.ts --apply --i-have-a-backup
 *
 * Why this exists instead of `payload migrate`: this project's production database does not record the
 * older migration files as applied, so `payload migrate` would try to re-run all of them. This script
 * runs ONLY the new, additive, idempotent subscription statements.
 *
 * Migrations handled (a migration that is already fully applied is skipped):
 *   1. 20261020_000000_add_subscriptions         - subscriptions, plans, order/cart/product columns
 *   2. 20261021_000000_add_subscription_coupons  - "valid for subscriptions" coupon settings
 *
 * Safety:
 *   - dry run first: shows exactly what is missing, touches nothing
 *   - one transaction: all-or-nothing, with a lock timeout so a busy site is never frozen
 *   - row counts of the main tables are compared before/after; any difference rolls everything back
 *   - orders keep their type: the number of non-"one_time" orders must be the same after as before (0 on a database that has no
 *     subscriptions yet, so every old order comes out as "one_time"); existing coupons must all come out as "not for subscriptions"
 */
import 'dotenv/config'
import { Client } from 'pg'
import * as subscriptionsMigration from '../../src/migrations/20261020_000000_add_subscriptions'
import * as couponsMigration from '../../src/migrations/20261021_000000_add_subscription_coupons'

interface MigrationInfo {
  name: string
  statements: string[]
  newTables: string[]
  newColumns: [string, string][]
}

const MIGRATIONS: MigrationInfo[] = [
  {
    name: subscriptionsMigration.MIGRATION_NAME,
    statements: subscriptionsMigration.SUBSCRIPTIONS_UP_STATEMENTS,
    newTables: subscriptionsMigration.EXPECTED_NEW_TABLES,
    newColumns: subscriptionsMigration.EXPECTED_NEW_COLUMNS,
  },
  {
    name: couponsMigration.MIGRATION_NAME,
    statements: couponsMigration.SUBSCRIPTION_COUPONS_UP_STATEMENTS,
    newTables: couponsMigration.EXPECTED_NEW_TABLES,
    newColumns: couponsMigration.EXPECTED_NEW_COLUMNS,
  },
]

const args = new Set(process.argv.slice(2))
const APPLY = args.has('--apply')
const HAS_BACKUP = args.has('--i-have-a-backup')

const COUNT_TABLES = ['orders', 'orders_items', 'users', 'products', 'carts', 'carts_items', 'affiliates', 'affiliate_conversions', 'coupons', 'addresses', 'processing_fees', 'shippingzones']
const REQUIRED_EXISTING = ['orders', 'carts_items', 'products', 'users', 'affiliates', 'coupons', 'payload_locked_documents_rels', 'payload_migrations']

async function main() {
  const uri = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URI is not set')
  const url = new URL(uri)
  const isLocal = ['127.0.0.1', 'localhost'].includes(url.hostname)

  console.log('============================================================')
  console.log(' Subscription migrations')
  console.log(' Target database host :', url.hostname)
  console.log(' Target database name :', url.pathname.slice(1))
  console.log(' Mode                 :', APPLY ? 'APPLY (will change the database)' : 'DRY RUN (changes nothing)')
  console.log('============================================================')

  if (APPLY && !isLocal && !HAS_BACKUP) {
    throw new Error(
      'Refusing to modify a REMOTE database without --i-have-a-backup. Take a backup/snapshot first (Supabase dashboard), then re-run with that flag.',
    )
  }

  const client = new Client({ connectionString: uri, ssl: isLocal ? false : { rejectUnauthorized: false } })
  await client.connect()
  const q = async (text: string, params: any[] = []) => (await client.query(text, params)).rows

  try {
    const [{ version }] = await q('select version()')
    console.log('Server:', String(version).split(',')[0])

    // ---- preflight ---------------------------------------------------------------------------
    const tables = new Set((await q(`select table_name from information_schema.tables where table_schema='public'`)).map((r: any) => r.table_name))
    const missingRequired = REQUIRED_EXISTING.filter((t) => !tables.has(t))
    if (missingRequired.length) throw new Error(`Required existing tables are missing: ${missingRequired.join(', ')} - wrong database?`)

    const hasCol = async (t: string, c: string) =>
      (await q(`select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`, [t, c])).length > 0

    // What is still missing for each migration. The coupons migration alters the "subscriptions" table, so it can only
    // run after the first one (they run in order inside the same transaction, which is also fine on a fresh database).
    const pending: { m: MigrationInfo; missingTables: string[]; missingCols: string[] }[] = []
    for (const m of MIGRATIONS) {
      const missingTables = m.newTables.filter((t) => !tables.has(t))
      const missingCols: string[] = []
      for (const [t, c] of m.newColumns) if (!(await hasCol(t, c))) missingCols.push(`${t}.${c}`)
      console.log(`\n[${m.name}]`)
      console.log('  New tables still to create :', missingTables.length ? missingTables.join(', ') : '(none - already present)')
      console.log('  New columns still to add   :', missingCols.length ? missingCols.join(', ') : '(none - already present)')
      if (missingTables.length || missingCols.length) pending.push({ m, missingTables, missingCols })
    }

    const countsBefore: Record<string, number> = {}
    for (const t of COUNT_TABLES) if (tables.has(t)) countsBefore[t] = Number((await q(`select count(*)::int as n from "${t}"`))[0].n)
    console.log('\nRow counts BEFORE:', JSON.stringify(countsBefore))

    // how many orders already are subscription orders (0 on a database that has never had subscriptions)
    const nonOneTimeBefore = (await hasCol('orders', 'order_type'))
      ? Number((await q(`select count(*)::int as n from orders where order_type is distinct from 'one_time'`))[0].n)
      : 0
    if (nonOneTimeBefore) console.log(`Subscription orders already present: ${nonOneTimeBefore} (they must stay exactly as they are)`)

    if (!pending.length) {
      console.log('\nNothing to do: every migration is already applied.')
      return
    }

    if (!APPLY) {
      const n = pending.reduce((sum, p) => sum + p.m.statements.length, 0)
      console.log(`\nDRY RUN complete. ${n} idempotent statements (${pending.map((p) => p.m.name).join(', ')}) would run. Nothing was changed.`)
      console.log('Re-run with --apply (and --i-have-a-backup for a remote database) to perform it.')
      return
    }

    // ---- apply (single transaction) ------------------------------------------------------------
    console.log('\nApplying in ONE transaction...')
    await client.query('BEGIN')
    try {
      await client.query(`SET LOCAL lock_timeout = '10s'`)
      await client.query(`SET LOCAL statement_timeout = '120s'`)

      for (const { m } of pending) {
        let n = 0
        for (const statement of m.statements) {
          await client.query(statement)
          n++
        }
        console.log(`  ${m.name}: ran ${n} statements`)
        await client.query(
          `insert into payload_migrations (name, batch)
           select $1::varchar, coalesce((select max(batch) from payload_migrations where batch > 0), 0) + 1
           where not exists (select 1 from payload_migrations where name = $1::varchar)`,
          [m.name],
        )
      }

      // ---- post-checks: anything off => ROLLBACK -----------------------------------------------
      const tablesAfter = new Set((await q(`select table_name from information_schema.tables where table_schema='public'`)).map((r: any) => r.table_name))
      for (const { m } of pending) {
        const stillMissingTables = m.newTables.filter((t) => !tablesAfter.has(t))
        if (stillMissingTables.length) throw new Error(`post-check failed: tables missing: ${stillMissingTables.join(', ')}`)
        for (const [t, c] of m.newColumns) {
          if (!(await hasCol(t, c))) throw new Error(`post-check failed: column ${t}.${c} missing`)
        }
      }
      for (const [t, before] of Object.entries(countsBefore)) {
        const after = Number((await q(`select count(*)::int as n from "${t}"`))[0].n)
        if (after !== before) throw new Error(`post-check failed: row count of ${t} changed (${before} -> ${after})`)
      }
      const nonOneTimeAfter = Number((await q(`select count(*)::int as n from orders where order_type is distinct from 'one_time'`))[0].n)
      if (nonOneTimeAfter !== nonOneTimeBefore) throw new Error(`post-check failed: subscription orders changed (${nonOneTimeBefore} -> ${nonOneTimeAfter})`)
      if (await hasCol('coupons', 'allow_on_subscriptions')) {
        const badCoupons = Number((await q(`select count(*)::int as n from coupons where allow_on_subscriptions is distinct from false`))[0].n)
        if (badCoupons !== 0) throw new Error(`post-check failed: ${badCoupons} existing coupons are not set to "not for subscriptions"`)
      }

      await client.query('COMMIT')
      console.log('\nCOMMITTED. Row counts unchanged; order types unchanged; every existing coupon is "not for subscriptions".')
    } catch (err) {
      await client.query('ROLLBACK')
      console.error('\nROLLED BACK - the database was NOT changed.')
      throw err
    }

    const countsAfter: Record<string, number> = {}
    for (const t of COUNT_TABLES) if (tables.has(t)) countsAfter[t] = Number((await q(`select count(*)::int as n from "${t}"`))[0].n)
    console.log('Row counts AFTER :', JSON.stringify(countsAfter))
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nERROR:', err.message)
  process.exit(1)
})
