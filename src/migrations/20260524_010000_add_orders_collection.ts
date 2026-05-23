import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_counters" (
      "year" integer PRIMARY KEY NOT NULL,
      "counter" integer NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "orders" (
      "id" serial PRIMARY KEY NOT NULL,
      "orderNumber" text NOT NULL,
      "owner" integer NOT NULL,
      "items" jsonb NOT NULL,
      "shippingAddress" jsonb,
      "billingAddress" jsonb,
      "status" text NOT NULL,
      "paymentStatus" text NOT NULL,
      "fulfillmentStatus" text NOT NULL,
      "refunds" jsonb,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_unique" ON "orders" ("orderNumber");
    CREATE INDEX IF NOT EXISTS "orders_owner_idx" ON "orders" ("owner");
    ALTER TABLE "orders" ADD CONSTRAINT "orders_owner_fkey"
      FOREIGN KEY ("owner") REFERENCES "users" ("id") ON DELETE CASCADE;
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "orders";
    DROP TABLE IF EXISTS "order_counters";
  `)
}
