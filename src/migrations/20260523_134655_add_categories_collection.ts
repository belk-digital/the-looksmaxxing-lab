import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "categories" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "description" varchar,
      "seo_title" varchar,
      "seo_description" varchar,
      "slug" varchar,
      "parent_id" integer,
      "is_visible" boolean DEFAULT true,
      "sort_order" numeric,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "categories"
      ADD CONSTRAINT "categories_parent_id_categories_id_fk"
      FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
    CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
    CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
    CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
    CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE "categories" CASCADE;
  `)
}
