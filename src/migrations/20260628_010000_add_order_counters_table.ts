import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "order_counters" (
      "id" integer PRIMARY KEY,
      "counter" integer NOT NULL DEFAULT 1000,
      "created_at" timestamptz DEFAULT now(),
      "updated_at" timestamptz DEFAULT now()
    )
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "order_counters"`)
}
