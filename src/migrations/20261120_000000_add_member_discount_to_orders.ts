import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Member discount on orders: ADDITIVE ONLY (2 new columns on "orders"). Follows 20261021_000000_add_subscription_coupons.
 *
 *  - orders.member_discount_total   numeric, default 0  -> the part of discount_total that was the member discount
 *  - orders.member_discount_percent numeric, nullable   -> the percent it was calculated at (empty when none was given)
 *
 * Nothing is dropped, renamed or rewritten, and no existing row's meaning changes: every existing order simply reads
 * "no member discount" (0 / empty), so its pages and emails look exactly as before. Every statement is idempotent, so
 * running it twice is harmless. Old code ignores the new columns, so the safe rollout order is:
 * 1) run this migration  2) deploy the new code.   (New code deployed BEFORE the migration cannot place orders.)
 */
export const MIGRATION_NAME = '20261120_000000_add_member_discount_to_orders'

export const MEMBER_DISCOUNT_UP_STATEMENTS: string[] = [
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "member_discount_total" numeric DEFAULT 0`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "member_discount_percent" numeric`,
]

/** Objects this migration creates (used by the runner's dry-run and post-check). */
export const EXPECTED_NEW_TABLES: string[] = []
export const EXPECTED_NEW_COLUMNS: [string, string][] = [
  ['orders', 'member_discount_total'],
  ['orders', 'member_discount_percent'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of MEMBER_DISCOUNT_UP_STATEMENTS) {
    await db.execute(sql.raw(statement))
  }
}

/** Removes ONLY what this migration added. (Rolling back the code does not require rolling back the database.) */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const statement of [
    `ALTER TABLE "orders" DROP COLUMN IF EXISTS "member_discount_percent"`,
    `ALTER TABLE "orders" DROP COLUMN IF EXISTS "member_discount_total"`,
  ]) {
    await db.execute(sql.raw(statement))
  }
}
