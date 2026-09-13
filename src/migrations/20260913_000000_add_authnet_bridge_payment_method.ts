import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TYPE "public"."enum_orders_payment_method" ADD VALUE IF NOT EXISTS 'authnet_bridge'`)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Postgres doesn't support removing a single enum value directly. Any orders already
  // using 'authnet_bridge' would need to be migrated to another value before this could
  // safely be reverted, so this is intentionally a no-op.
}
