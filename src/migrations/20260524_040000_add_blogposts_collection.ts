import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export const up = async ({ db }: MigrateUpArgs) => {
  await db.execute(sql`
    DROP TABLE IF EXISTS "blog_posts" CASCADE;
    CREATE TABLE IF NOT EXISTS "blog_posts" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" text NOT NULL,
      "slug" text NOT NULL,
      "author" integer NOT NULL,
      "content" jsonb NOT NULL,
      "published_at" timestamp with time zone DEFAULT now() NOT NULL,
      "status" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "blog_posts_author_fk" FOREIGN KEY ("author") REFERENCES "users" ("id") ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_unique" ON "blog_posts" ("slug");
  `)
}

export const down = async ({ db }: MigrateDownArgs) => {
  await db.execute(sql`DROP TABLE IF EXISTS "blog_posts";`)
}
