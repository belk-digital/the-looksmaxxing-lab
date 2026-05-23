import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages" CASCADE;
    CREATE TABLE IF NOT EXISTS "pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "slug" text NOT NULL,
      "content" jsonb NOT NULL,
      "status" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "pages_slug_unique" ON "pages" ("slug");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "pages";`)
}
