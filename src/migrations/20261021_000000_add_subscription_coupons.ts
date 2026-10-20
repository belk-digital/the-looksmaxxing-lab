import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Subscription coupons: ADDITIVE ONLY (3 new columns, 1 new type). Follows 20261020_000000_add_subscriptions.
 *
 *  - coupons.allow_on_subscriptions      boolean, default false  -> every existing coupon stays "not for subscriptions"
 *  - coupons.subscription_discount_scope enum,    default 'first_month'
 *  - subscriptions.recurring_coupon_code varchar, nullable        -> the coupon that discounts every monthly invoice
 *
 * Nothing is dropped, renamed or rewritten, and no existing row's meaning changes. Every statement is idempotent,
 * so running it twice is harmless. Old code ignores the new columns, so the safe rollout order is:
 * 1) run this migration  2) deploy the new code.
 */
export const MIGRATION_NAME = '20261021_000000_add_subscription_coupons'

const createEnum = (name: string, values: string[]) => `
DO $$ BEGIN
  CREATE TYPE "public"."${name}" AS ENUM(${values.map((v) => `'${v}'`).join(', ')});
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`

export const SUBSCRIPTION_COUPONS_UP_STATEMENTS: string[] = [
  createEnum('enum_coupons_subscription_discount_scope', ['first_month', 'every_month']),
  `ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "allow_on_subscriptions" boolean DEFAULT false`,
  `ALTER TABLE "coupons" ADD COLUMN IF NOT EXISTS "subscription_discount_scope" "public"."enum_coupons_subscription_discount_scope" DEFAULT 'first_month'`,
  `ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "recurring_coupon_code" varchar`,
]

/** Objects this migration creates (used by the runner's dry-run and post-check). */
export const EXPECTED_NEW_TABLES: string[] = []
export const EXPECTED_NEW_COLUMNS: [string, string][] = [
  ['coupons', 'allow_on_subscriptions'],
  ['coupons', 'subscription_discount_scope'],
  ['subscriptions', 'recurring_coupon_code'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of SUBSCRIPTION_COUPONS_UP_STATEMENTS) {
    await db.execute(sql.raw(statement))
  }
}

/** Removes ONLY what this migration added. (Rolling back the code does not require rolling back the database.) */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  for (const statement of [
    `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "recurring_coupon_code"`,
    `ALTER TABLE "coupons" DROP COLUMN IF EXISTS "subscription_discount_scope"`,
    `ALTER TABLE "coupons" DROP COLUMN IF EXISTS "allow_on_subscriptions"`,
    `DROP TYPE IF EXISTS "public"."enum_coupons_subscription_discount_scope"`,
  ]) {
    await db.execute(sql.raw(statement))
  }
}
