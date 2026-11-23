import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// ShipStation hand-off fields on orders (see src/lib/shipstation). Purely additive: every column is
// nullable with no default, so every existing order keeps NULL everywhere and is never pushed to
// ShipStation. Safe to run before the code that uses it is deployed.
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
     CREATE TYPE "public"."enum_orders_shipstation_sync_status" AS ENUM('pending', 'synced', 'failed', 'manual', 'skipped', 'cancelled');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carrier" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_at" timestamp(3) with time zone;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_sync_status" "enum_orders_shipstation_sync_status";
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_order_id" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_sync_error" varchar;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_sync_attempts" numeric;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_synced_at" timestamp(3) with time zone;
   ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipstation_retry" boolean;
   -- An earlier, never-committed experiment left "shipstation_sync_status" on this table as plain text (empty on every
   -- order). Convert it to the allowed-values type, but ONLY when nothing is stored in it; otherwise leave it alone.
   DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'shipstation_sync_status' AND udt_name = 'text')
        AND NOT EXISTS (SELECT 1 FROM "orders" WHERE "shipstation_sync_status" IS NOT NULL) THEN
       ALTER TABLE "orders" ALTER COLUMN "shipstation_sync_status" TYPE "public"."enum_orders_shipstation_sync_status" USING "shipstation_sync_status"::"public"."enum_orders_shipstation_sync_status";
     END IF;
   END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "carrier";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "tracking_number";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipped_at";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_sync_status";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_order_id";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_sync_error";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_sync_attempts";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_synced_at";
   ALTER TABLE "orders" DROP COLUMN IF EXISTS "shipstation_retry";
   DROP TYPE IF EXISTS "public"."enum_orders_shipstation_sync_status";`)
}
