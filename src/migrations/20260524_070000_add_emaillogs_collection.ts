import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "email_logs" CASCADE;
    CREATE TABLE IF NOT EXISTS "email_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "to" text NOT NULL,
      "subject" text NOT NULL,
      "body" jsonb NOT NULL,
      "sent_at" timestamp with time zone DEFAULT now() NOT NULL,
      "status" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "email_logs_status_idx" ON "email_logs" ("status");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "email_logs";`)
}
