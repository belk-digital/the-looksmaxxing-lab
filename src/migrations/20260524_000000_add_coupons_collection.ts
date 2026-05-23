import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "coupons" (
      "id" serial PRIMARY KEY NOT NULL,
      "code" varchar NOT NULL,
      "type" varchar NOT NULL,
      "value" integer,
      "usageCount" integer DEFAULT 0,
      "appliesTo" varchar NOT NULL,
      "products" jsonb,
      "categories" jsonb,
      "minSpend" integer,
      "usageLimit" integer,
      "stackable" boolean DEFAULT false,
      "expiresAt" timestamp with time zone,
      "excludeSaleItems" boolean DEFAULT false,
      "autoApply" boolean DEFAULT false,
      "lockedEmails" jsonb,
      "storeCreditAmount" integer,
      "remainingBalance" integer,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "coupons_code_idx" ON "coupons" ("code");
    CREATE INDEX IF NOT EXISTS "coupons_type_idx" ON "coupons" ("type");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "coupons";`)
}
