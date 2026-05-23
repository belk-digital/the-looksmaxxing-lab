import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "products" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" jsonb,
      "description" jsonb,
      "seo_title" jsonb,
      "seo_description" jsonb,
      "slug" varchar,
      "price" integer DEFAULT 0,
      "stock" integer DEFAULT 0,
      "has_variants" boolean DEFAULT false,
      "variants" jsonb,
      "average_rating" integer DEFAULT 0,
      "review_count" integer DEFAULT 0,
      "status" varchar DEFAULT 'draft',
      "is_visible" boolean DEFAULT true,
      "sort_order" numeric,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "products_slug_idx" ON "products" ("slug");
    CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products" ("status");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "products";`)
}
