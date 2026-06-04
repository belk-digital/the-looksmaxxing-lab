import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_processing_fees_type" AS ENUM('fixed_amount', 'percentage');
  CREATE TYPE "public"."enum_affiliate_settings_default_commission_type" AS ENUM('percentage', 'fixed_amount');
  CREATE TYPE "public"."enum_affiliate_settings_default_commission_on" AS ENUM('subtotal_after_coupon', 'subtotal_before_coupon');
  CREATE TABLE "products_bundle_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"product_id" integer,
  	"quantity" numeric DEFAULT 1
  );
  
  CREATE TABLE "products_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "orders_applied_fees" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"fee_id_id" integer,
  	"fee_name" varchar,
  	"amount" numeric
  );
  
  CREATE TABLE "processing_fees" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"amount" numeric NOT NULL,
  	"type" "enum_processing_fees_type" DEFAULT 'fixed_amount' NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"is_optional" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "affiliate_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"default_commission_rate" numeric DEFAULT 10 NOT NULL,
  	"default_commission_type" "enum_affiliate_settings_default_commission_type" DEFAULT 'percentage' NOT NULL,
  	"default_commission_on" "enum_affiliate_settings_default_commission_on" DEFAULT 'subtotal_after_coupon' NOT NULL,
  	"default_cookie_duration_days" numeric DEFAULT 30 NOT NULL,
  	"default_pending_period_days" numeric DEFAULT 30 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "orders" ALTER COLUMN "owner_id" DROP NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "total" SET DEFAULT 0;
  ALTER TABLE "orders" ALTER COLUMN "total" SET NOT NULL;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_rate" DROP DEFAULT;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_type" DROP DEFAULT;
  ALTER TABLE "affiliates" ALTER COLUMN "pending_period_days" DROP DEFAULT;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_on" DROP DEFAULT;
  ALTER TABLE "products_variants" ADD COLUMN "sale_price" numeric;
  ALTER TABLE "products" ADD COLUMN "sku" varchar;
  ALTER TABLE "products" ADD COLUMN "sale_price" numeric;
  ALTER TABLE "products" ADD COLUMN "weight" numeric;
  ALTER TABLE "products" ADD COLUMN "dimensions_length" numeric;
  ALTER TABLE "products" ADD COLUMN "dimensions_width" numeric;
  ALTER TABLE "products" ADD COLUMN "dimensions_height" numeric;
  ALTER TABLE "products" ADD COLUMN "is_bundle" boolean DEFAULT false;
  ALTER TABLE "products" ADD COLUMN "product_details_title" varchar DEFAULT 'Product Details';
  ALTER TABLE "products" ADD COLUMN "product_details_description" varchar;
  ALTER TABLE "products" ADD COLUMN "research_focus_title" varchar DEFAULT 'Research Focus & Mechanism Overview';
  ALTER TABLE "products" ADD COLUMN "research_focus_description" varchar;
  ALTER TABLE "products" ADD COLUMN "quality_purity_title" varchar DEFAULT 'Quality & Purity Standards';
  ALTER TABLE "products" ADD COLUMN "quality_purity_description" varchar;
  ALTER TABLE "products" ADD COLUMN "compliance_notice_title" varchar DEFAULT 'Compliance Notice';
  ALTER TABLE "products" ADD COLUMN "compliance_notice_description" varchar;
  ALTER TABLE "products" ADD COLUMN "coa_file_id" integer;
  ALTER TABLE "orders" ADD COLUMN "customer_first_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "customer_last_name" varchar;
  ALTER TABLE "orders" ADD COLUMN "customer_phone" varchar;
  ALTER TABLE "orders" ADD COLUMN "shipping_total" numeric DEFAULT 0;
  ALTER TABLE "orders" ADD COLUMN "tax_total" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "fee_total" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "orders" ADD COLUMN "shipping_method" varchar;
  ALTER TABLE "orders" ADD COLUMN "customer_note" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "processing_fees_id" integer;
  ALTER TABLE "products_bundle_items" ADD CONSTRAINT "products_bundle_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "products_bundle_items" ADD CONSTRAINT "products_bundle_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "products_faqs" ADD CONSTRAINT "products_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_applied_fees" ADD CONSTRAINT "orders_applied_fees_fee_id_id_processing_fees_id_fk" FOREIGN KEY ("fee_id_id") REFERENCES "public"."processing_fees"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_applied_fees" ADD CONSTRAINT "orders_applied_fees_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_bundle_items_order_idx" ON "products_bundle_items" USING btree ("_order");
  CREATE INDEX "products_bundle_items_parent_id_idx" ON "products_bundle_items" USING btree ("_parent_id");
  CREATE INDEX "products_bundle_items_product_idx" ON "products_bundle_items" USING btree ("product_id");
  CREATE INDEX "products_faqs_order_idx" ON "products_faqs" USING btree ("_order");
  CREATE INDEX "products_faqs_parent_id_idx" ON "products_faqs" USING btree ("_parent_id");
  CREATE INDEX "orders_applied_fees_order_idx" ON "orders_applied_fees" USING btree ("_order");
  CREATE INDEX "orders_applied_fees_parent_id_idx" ON "orders_applied_fees" USING btree ("_parent_id");
  CREATE INDEX "orders_applied_fees_fee_id_idx" ON "orders_applied_fees" USING btree ("fee_id_id");
  CREATE INDEX "processing_fees_updated_at_idx" ON "processing_fees" USING btree ("updated_at");
  CREATE INDEX "processing_fees_created_at_idx" ON "processing_fees" USING btree ("created_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_coa_file_id_media_id_fk" FOREIGN KEY ("coa_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_processing_fees_fk" FOREIGN KEY ("processing_fees_id") REFERENCES "public"."processing_fees"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_coa_file_idx" ON "products" USING btree ("coa_file_id");
  CREATE INDEX "payload_locked_documents_rels_processing_fees_id_idx" ON "payload_locked_documents_rels" USING btree ("processing_fees_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products_bundle_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "products_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_applied_fees" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "processing_fees" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "affiliate_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "products_bundle_items" CASCADE;
  DROP TABLE "products_faqs" CASCADE;
  DROP TABLE "orders_applied_fees" CASCADE;
  DROP TABLE "processing_fees" CASCADE;
  DROP TABLE "affiliate_settings" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_coa_file_id_media_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_processing_fees_fk";
  
  DROP INDEX "products_coa_file_idx";
  DROP INDEX "payload_locked_documents_rels_processing_fees_id_idx";
  ALTER TABLE "orders" ALTER COLUMN "owner_id" SET NOT NULL;
  ALTER TABLE "orders" ALTER COLUMN "total" DROP DEFAULT;
  ALTER TABLE "orders" ALTER COLUMN "total" DROP NOT NULL;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_rate" SET DEFAULT 10;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_type" SET DEFAULT 'percentage';
  ALTER TABLE "affiliates" ALTER COLUMN "pending_period_days" SET DEFAULT 30;
  ALTER TABLE "affiliates" ALTER COLUMN "commission_on" SET DEFAULT 'subtotal_after_coupon';
  ALTER TABLE "products_variants" DROP COLUMN "sale_price";
  ALTER TABLE "products" DROP COLUMN "sku";
  ALTER TABLE "products" DROP COLUMN "sale_price";
  ALTER TABLE "products" DROP COLUMN "weight";
  ALTER TABLE "products" DROP COLUMN "dimensions_length";
  ALTER TABLE "products" DROP COLUMN "dimensions_width";
  ALTER TABLE "products" DROP COLUMN "dimensions_height";
  ALTER TABLE "products" DROP COLUMN "is_bundle";
  ALTER TABLE "products" DROP COLUMN "product_details_title";
  ALTER TABLE "products" DROP COLUMN "product_details_description";
  ALTER TABLE "products" DROP COLUMN "research_focus_title";
  ALTER TABLE "products" DROP COLUMN "research_focus_description";
  ALTER TABLE "products" DROP COLUMN "quality_purity_title";
  ALTER TABLE "products" DROP COLUMN "quality_purity_description";
  ALTER TABLE "products" DROP COLUMN "compliance_notice_title";
  ALTER TABLE "products" DROP COLUMN "compliance_notice_description";
  ALTER TABLE "products" DROP COLUMN "coa_file_id";
  ALTER TABLE "orders" DROP COLUMN "customer_first_name";
  ALTER TABLE "orders" DROP COLUMN "customer_last_name";
  ALTER TABLE "orders" DROP COLUMN "customer_phone";
  ALTER TABLE "orders" DROP COLUMN "shipping_total";
  ALTER TABLE "orders" DROP COLUMN "tax_total";
  ALTER TABLE "orders" DROP COLUMN "fee_total";
  ALTER TABLE "orders" DROP COLUMN "shipping_method";
  ALTER TABLE "orders" DROP COLUMN "customer_note";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "processing_fees_id";
  DROP TYPE "public"."enum_processing_fees_type";
  DROP TYPE "public"."enum_affiliate_settings_default_commission_type";
  DROP TYPE "public"."enum_affiliate_settings_default_commission_on";`)
}
