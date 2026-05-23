import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "shippingzones" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" text NOT NULL,
      "methods" jsonb NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "shippingzones_name_unique" ON "shippingzones" ("name");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "shippingzones";
  `)
}
