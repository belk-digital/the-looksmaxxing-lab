import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Subscriptions: ADDITIVE ONLY.
 *
 *  - creates new types/tables/indexes/constraints
 *  - adds NEW, NULLABLE (or defaulted) columns to existing tables
 *  - never drops, renames, rewrites or deletes anything, and touches no existing row's data
 *
 * Every statement is idempotent (IF NOT EXISTS / duplicate-safe), so running it twice is harmless.
 * The same list is used by the standalone production runner (scripts/subscriptions/apply-migration.ts),
 * which adds a dry-run, a transaction, and before/after row-count checks.
 *
 * Old code keeps working against the migrated database (it ignores the new columns), so the safe
 * rollout order is: 1) run this migration  2) deploy the new code.
 */
export const MIGRATION_NAME = '20261020_000000_add_subscriptions'

const createEnum = (name: string, values: string[]) => `
DO $$ BEGIN
  CREATE TYPE "public"."${name}" AS ENUM(${values.map((v) => `'${v}'`).join(', ')});
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`

const addFk = (table: string, constraint: string, column: string, refTable: string, onDelete: string) => `
DO $$ BEGIN
  ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" FOREIGN KEY ("${column}") REFERENCES "public"."${refTable}"("id") ON DELETE ${onDelete} ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;`

export const SUBSCRIPTIONS_UP_STATEMENTS: string[] = [
  // ---------------------------------------------------------------- enums
  createEnum('enum_orders_order_type', ['one_time', 'subscription_first', 'subscription_cycle']),
  createEnum('enum_subscriptions_status', ['pending_payment', 'active', 'paused', 'lapsed', 'completed', 'cancelled']),
  createEnum('enum_subscriptions_payment_method', ['authnet_bridge', 'zelle']),

  // ------------------------------------------------------- new tables
  `CREATE TABLE IF NOT EXISTS "subscription_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "enabled" boolean DEFAULT false,
    "allow_card" boolean DEFAULT true,
    "allow_zelle" boolean DEFAULT true,
    "invoice_lead_days" numeric DEFAULT 7,
    "final_notice_after_days" numeric DEFAULT 7,
    "lapse_after_days" numeric DEFAULT 14,
    "first_payment_expiry_days" numeric DEFAULT 14,
    "min_days_between_early_orders" numeric DEFAULT 0,
    "terms_text" varchar DEFAULT 'I understand this is a monthly subscription: I will receive an invoice by email before each shipment and the order ships after that month is paid. I can pause, skip or resume anytime from my account. Prices follow the current store price at the time of each invoice. For research use only.',
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  )`,
  `CREATE TABLE IF NOT EXISTS "subscription_settings_plans" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "months" numeric NOT NULL,
    "label" varchar NOT NULL,
    "discount_percent" numeric DEFAULT 15 NOT NULL,
    "badge" varchar,
    "is_active" boolean DEFAULT true
  )`,
  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" serial PRIMARY KEY NOT NULL,
    "owner_id" integer NOT NULL,
    "status" "enum_subscriptions_status" DEFAULT 'pending_payment' NOT NULL,
    "plan_months" numeric NOT NULL,
    "discount_percent" numeric DEFAULT 0 NOT NULL,
    "payment_method" "enum_subscriptions_payment_method" DEFAULT 'authnet_bridge' NOT NULL,
    "shipping_method" varchar,
    "shipping_address_line1" varchar,
    "shipping_address_line2" varchar,
    "shipping_address_city" varchar,
    "shipping_address_state" varchar,
    "shipping_address_postal_code" varchar,
    "shipping_address_country" varchar,
    "customer_first_name" varchar,
    "customer_last_name" varchar,
    "customer_phone" varchar,
    "cycles_completed" numeric DEFAULT 0,
    "started_at" timestamp(3) with time zone,
    "next_due_date" timestamp(3) with time zone,
    "next_invoice_date" timestamp(3) with time zone,
    "open_invoice_id" integer,
    "first_order_id" integer,
    "paused_at" timestamp(3) with time zone,
    "lapsed_at" timestamp(3) with time zone,
    "last_early_order_at" timestamp(3) with time zone,
    "affiliate_id" integer,
    "affiliate_click_id" varchar,
    "admin_note" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "subscriptions_items" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "product_id" integer NOT NULL,
    "variant_sku" varchar,
    "variant_title" varchar,
    "quantity" numeric DEFAULT 1 NOT NULL
  )`,

  // ------------------------------------- new columns on EXISTING tables
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_type" "enum_orders_order_type" DEFAULT 'one_time' NOT NULL`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subscription_id" integer`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cycle_number" numeric`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cycles_total" numeric`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subscription_discount_percent" numeric`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_due_date" timestamp(3) with time zone`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_reminder_stage" numeric DEFAULT 0`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "invoice_token" varchar`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "paid_at" timestamp(3) with time zone`,
  `ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_txn_id" varchar`,
  `ALTER TABLE "carts_items" ADD COLUMN IF NOT EXISTS "plan_months" numeric`,
  `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subscription_enabled" boolean DEFAULT false`,
  `ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subscriptions_id" integer`,

  // ---------------------------------------------------------- constraints
  addFk('subscription_settings_plans', 'subscription_settings_plans_parent_id_fk', '_parent_id', 'subscription_settings', 'cascade'),
  addFk('subscriptions', 'subscriptions_owner_id_users_id_fk', 'owner_id', 'users', 'set null'),
  addFk('subscriptions', 'subscriptions_open_invoice_id_orders_id_fk', 'open_invoice_id', 'orders', 'set null'),
  addFk('subscriptions', 'subscriptions_first_order_id_orders_id_fk', 'first_order_id', 'orders', 'set null'),
  addFk('subscriptions', 'subscriptions_affiliate_id_affiliates_id_fk', 'affiliate_id', 'affiliates', 'set null'),
  addFk('subscriptions_items', 'subscriptions_items_product_id_products_id_fk', 'product_id', 'products', 'set null'),
  addFk('subscriptions_items', 'subscriptions_items_parent_id_fk', '_parent_id', 'subscriptions', 'cascade'),
  addFk('orders', 'orders_subscription_id_subscriptions_id_fk', 'subscription_id', 'subscriptions', 'set null'),
  addFk('payload_locked_documents_rels', 'payload_locked_documents_rels_subscriptions_fk', 'subscriptions_id', 'subscriptions', 'cascade'),

  // -------------------------------------------------------------- indexes
  `CREATE INDEX IF NOT EXISTS "subscription_settings_plans_order_idx" ON "subscription_settings_plans" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "subscription_settings_plans_parent_id_idx" ON "subscription_settings_plans" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_owner_idx" ON "subscriptions" USING btree ("owner_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" USING btree ("status")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_open_invoice_idx" ON "subscriptions" USING btree ("open_invoice_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_first_order_idx" ON "subscriptions" USING btree ("first_order_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_affiliate_idx" ON "subscriptions" USING btree ("affiliate_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_updated_at_idx" ON "subscriptions" USING btree ("updated_at")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_created_at_idx" ON "subscriptions" USING btree ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_items_order_idx" ON "subscriptions_items" USING btree ("_order")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_items_parent_id_idx" ON "subscriptions_items" USING btree ("_parent_id")`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_items_product_idx" ON "subscriptions_items" USING btree ("product_id")`,
  `CREATE INDEX IF NOT EXISTS "orders_order_type_idx" ON "orders" USING btree ("order_type")`,
  `CREATE INDEX IF NOT EXISTS "orders_subscription_idx" ON "orders" USING btree ("subscription_id")`,
  `CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subscriptions_id_idx" ON "payload_locked_documents_rels" USING btree ("subscriptions_id")`,

  // Safety net: at most ONE open (unpaid, pending) invoice per subscription month, even if the daily job
  // and a customer's "order next month now" click happen at the same moment.
  `CREATE UNIQUE INDEX IF NOT EXISTS "orders_open_cycle_invoice_uniq" ON "orders" USING btree ("subscription_id", "cycle_number") WHERE "order_type" = 'subscription_cycle' AND "status" = 'pending' AND "payment_status" = 'unpaid'`,
]

/** Objects this migration creates (used by the runner's dry-run and post-check). */
export const EXPECTED_NEW_TABLES = ['subscriptions', 'subscriptions_items', 'subscription_settings', 'subscription_settings_plans']
export const EXPECTED_NEW_COLUMNS: [string, string][] = [
  ['orders', 'order_type'], ['orders', 'subscription_id'], ['orders', 'cycle_number'], ['orders', 'cycles_total'],
  ['orders', 'subscription_discount_percent'], ['orders', 'invoice_due_date'], ['orders', 'invoice_reminder_stage'],
  ['orders', 'invoice_token'], ['orders', 'paid_at'], ['orders', 'payment_txn_id'],
  ['carts_items', 'plan_months'], ['products', 'subscription_enabled'], ['payload_locked_documents_rels', 'subscriptions_id'],
]

export async function up({ db }: MigrateUpArgs): Promise<void> {
  for (const statement of SUBSCRIPTIONS_UP_STATEMENTS) {
    await db.execute(sql.raw(statement))
  }
}

/**
 * Removes ONLY what this migration added. Destructive for subscription data: never run it on a database
 * that holds real subscriptions. (Rolling back the code does not require rolling back the database.)
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  const drops = [
    `DROP INDEX IF EXISTS "orders_open_cycle_invoice_uniq"`,
    `ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_subscription_id_subscriptions_id_fk"`,
    `ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_subscriptions_fk"`,
    `DROP INDEX IF EXISTS "payload_locked_documents_rels_subscriptions_id_idx"`,
    `DROP INDEX IF EXISTS "orders_subscription_idx"`,
    `DROP INDEX IF EXISTS "orders_order_type_idx"`,
    `ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subscriptions_id"`,
    `ALTER TABLE "products" DROP COLUMN IF EXISTS "subscription_enabled"`,
    `ALTER TABLE "carts_items" DROP COLUMN IF EXISTS "plan_months"`,
    ...['payment_txn_id', 'paid_at', 'invoice_token', 'invoice_reminder_stage', 'invoice_due_date', 'subscription_discount_percent', 'cycles_total', 'cycle_number', 'subscription_id', 'order_type'].map(
      (c) => `ALTER TABLE "orders" DROP COLUMN IF EXISTS "${c}"`,
    ),
    `DROP TABLE IF EXISTS "subscriptions_items"`,
    `DROP TABLE IF EXISTS "subscriptions"`,
    `DROP TABLE IF EXISTS "subscription_settings_plans"`,
    `DROP TABLE IF EXISTS "subscription_settings"`,
    `DROP TYPE IF EXISTS "public"."enum_subscriptions_payment_method"`,
    `DROP TYPE IF EXISTS "public"."enum_subscriptions_status"`,
    `DROP TYPE IF EXISTS "public"."enum_orders_order_type"`,
  ]
  for (const statement of drops) {
    await db.execute(sql.raw(statement))
  }
}
