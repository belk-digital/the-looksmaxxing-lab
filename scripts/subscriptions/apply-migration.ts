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
 *   ONLY ONE migration (touches nothing else, even if other migrations are still pending):
 *     npx tsx scripts/subscriptions/apply-migration.ts --only member-discount
 *     npx tsx scripts/subscriptions/apply-migration.ts --only member-discount --apply --additive-only
 *   --additive-only is the alternative to --i-have-a-backup for a remote database: the script checks every statement
 *   it is about to run and refuses unless each one only ADDS something that is not there yet (ADD COLUMN IF NOT EXISTS,
 *   CREATE TABLE/INDEX IF NOT EXISTS). Such a migration cannot change or remove an existing row, column or table.
 *
 * Why this exists instead of `payload migrate`: this project's production database does not record the
 * older migration files as applied, so `payload migrate` would try to re-run all of them. This script
 * runs ONLY the new, additive, idempotent subscription statements.
 *
 * Migrations handled (a migration that is already fully applied is skipped):
 *   1. 20261020_000000_add_subscriptions         - subscriptions, plans, order/cart/product columns
 *   2. 20261021_000000_add_subscription_coupons  - "valid for subscriptions" coupon settings
 *   3. 20261120_000000_add_member_discount_to_orders - 2 columns on orders (member discount amount + percent)
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
import * as memberDiscountMigration from '../../src/migrations/20261120_000000_add_member_discount_to_orders'

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
  {
    name: memberDiscountMigration.MIGRATION_NAME,
    statements: memberDiscountMigration.MEMBER_DISCOUNT_UP_STATEMENTS,
    newTables: memberDiscountMigration.EXPECTED_NEW_TABLES,
    newColumns: memberDiscountMigration.EXPECTED_NEW_COLUMNS,
  },
]

const argv = process.argv.slice(2)
const args = new Set(argv)
const APPLY = args.has('--apply')
const HAS_BACKUP = args.has('--i-have-a-backup')
const ADDITIVE_ONLY = args.has('--additive-only')
/** --only <part of a migration name>  or  --only=<part of a migration name> */
const ONLY: string | null = (() => {
  const eq = argv.find((a) => a.startsWith('--only='))
  if (eq) return eq.slice('--only='.length) || null
  const i = argv.indexOf('--only')
  return i >= 0 ? argv[i + 1] ?? '' : null
})()

/** A statement that can only ADD something that is not there yet: it can never change or remove existing data. */
const ADDITIVE_STATEMENT = [
  /^ALTER TABLE "?\w+"? ADD COLUMN IF NOT EXISTS /i,
  /^CREATE TABLE IF NOT EXISTS /i,
  /^CREATE (UNIQUE )?INDEX IF NOT EXISTS /i,
]
const isAdditive = (statement: string) => ADDITIVE_STATEMENT.some((re) => re.test(statement.trim()))

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

  // --only: work on exactly one migration and leave every other one alone
  let selected = MIGRATIONS
  if (ONLY !== null) {
    if (!ONLY) throw new Error('--only needs part of a migration name, e.g. --only member-discount')
    const wanted = ONLY.toLowerCase().replace(/[-\s]+/g, '_')
    selected = MIGRATIONS.filter((m) => m.name.toLowerCase().includes(wanted))
    if (selected.length !== 1) {
      throw new Error(`--only "${ONLY}" must match exactly one migration, it matched ${selected.length}: ${MIGRATIONS.map((m) => m.name).join(', ')}`)
    }
    console.log(' Only this migration  :', selected[0].name)
  }
  const nonAdditive = selected.flatMap((m) => m.statements).filter((s) => !isAdditive(s))
  const allAdditive = nonAdditive.length === 0

  if (ADDITIVE_ONLY && !allAdditive) {
    throw new Error(`--additive-only refused: ${nonAdditive.length} statement(s) are not purely "add something new", e.g. ${nonAdditive[0].trim().replace(/\s+/g, ' ').slice(0, 80)}`)
  }
  if (APPLY && !isLocal && !HAS_BACKUP && !(ADDITIVE_ONLY && allAdditive)) {
    throw new Error(
      'Refusing to modify a REMOTE database without --i-have-a-backup (or --additive-only for a migration that only adds new things). Take a backup/snapshot first (Supabase dashboard), then re-run with that flag.',
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
    for (const m of selected) {
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
      const appliedNow = (name: string) => pending.some((p) => p.m.name === name)
      if (appliedNow(couponsMigration.MIGRATION_NAME) && (await hasCol('coupons', 'allow_on_subscriptions'))) {
        const badCoupons = Number((await q(`select count(*)::int as n from coupons where allow_on_subscriptions is distinct from false`))[0].n)
        if (badCoupons !== 0) throw new Error(`post-check failed: ${badCoupons} existing coupons are not set to "not for subscriptions"`)
      }
      if (appliedNow(memberDiscountMigration.MIGRATION_NAME) && (await hasCol('orders', 'member_discount_total'))) {
        // every order placed before the member discount existed must read "no member discount" (so its pages and emails do not change)
        const badOrders = Number(
          (await q(`select count(*)::int as n from orders where member_discount_total is distinct from 0 or member_discount_percent is not null`))[0].n,
        )
        if (badOrders !== 0) throw new Error(`post-check failed: ${badOrders} existing orders do not read "no member discount"`)
      }

      await client.query('COMMIT')
      console.log('\nCOMMITTED. Row counts unchanged; order types unchanged. Checked for what ran now: new tables/columns exist;' +
        (appliedNow(couponsMigration.MIGRATION_NAME) ? ' every existing coupon is "not for subscriptions";' : '') +
        (appliedNow(memberDiscountMigration.MIGRATION_NAME) ? ' every existing order reads "no member discount";' : ''))
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
