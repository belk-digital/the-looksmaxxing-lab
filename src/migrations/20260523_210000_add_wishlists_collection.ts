import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "wishlists" CASCADE;
    CREATE TABLE IF NOT EXISTS "wishlists" (
      "id" serial PRIMARY KEY NOT NULL,
      "user" integer NOT NULL,
      "items" jsonb NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "wishlists_user_unique" ON "wishlists" ("user");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "wishlists";`)
}
