import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "reviews" (
      "id" serial PRIMARY KEY NOT NULL,
      "product" integer NOT NULL,
      "user" integer NOT NULL,
      "order" integer,
      "rating" integer NOT NULL,
      "comment" text,
      "verifiedPurchase" boolean NOT NULL DEFAULT false,
      "status" text NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "reviews_product_idx" ON "reviews" ("product");
    CREATE INDEX IF NOT EXISTS "reviews_user_idx" ON "reviews" ("user");
    CREATE INDEX IF NOT EXISTS "reviews_order_idx" ON "reviews" ("order");

    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_fkey"
      FOREIGN KEY ("product") REFERENCES "products" ("id") ON DELETE CASCADE;
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_fkey"
      FOREIGN KEY ("user") REFERENCES "users" ("id") ON DELETE CASCADE;
    ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_fkey"
      FOREIGN KEY ("order") REFERENCES "orders" ("id") ON DELETE SET NULL;
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "reviews";
  `)
}
