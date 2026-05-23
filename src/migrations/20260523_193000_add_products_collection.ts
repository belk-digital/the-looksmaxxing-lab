import { sql } from 'drizzle-orm';
import { pgTable, serial, varchar, integer, boolean, numeric, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const up = async (db) => {
  await db.run(sql`
    CREATE TABLE "products" (
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
    CREATE UNIQUE INDEX "products_slug_idx" ON "products" ("slug");
    CREATE INDEX "products_status_idx" ON "products" ("status");
  `);
};

export const down = async (db) => {
  await db.run(sql`DROP TABLE IF EXISTS "products";`);
};
