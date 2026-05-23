import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "carts" CASCADE;
    CREATE TABLE IF NOT EXISTS "carts" (
      "id" serial PRIMARY KEY NOT NULL,
      "user" integer NOT NULL,
      "items" jsonb NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "carts_user_unique" ON "carts" ("user");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "carts";`)
}
