import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "contact_messages" CASCADE;
    CREATE TABLE IF NOT EXISTS "contact_messages" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "subject" text,
      "message" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "contact_messages";`)
}
