import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_payment_methods_settings_methods_method_id" AS ENUM('stripe', 'zelle', 'authnet_bridge');

    CREATE TABLE IF NOT EXISTS "payment_methods_settings" (
      "id" serial PRIMARY KEY NOT NULL,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    CREATE TABLE IF NOT EXISTS "payment_methods_settings_methods" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "method_id" "public"."enum_payment_methods_settings_methods_method_id" NOT NULL,
      "label" varchar NOT NULL,
      "description" varchar,
      "is_active" boolean DEFAULT true
    );

    ALTER TABLE "payment_methods_settings_methods"
      ADD CONSTRAINT "payment_methods_settings_methods_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."payment_methods_settings"("id") ON DELETE cascade;

    CREATE INDEX IF NOT EXISTS "payment_methods_settings_methods_order_idx" ON "payment_methods_settings_methods" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "payment_methods_settings_methods_parent_id_idx" ON "payment_methods_settings_methods" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payment_methods_settings_methods";
    DROP TABLE IF EXISTS "payment_methods_settings";
    DROP TYPE IF EXISTS "public"."enum_payment_methods_settings_methods_method_id";
  `)
}
