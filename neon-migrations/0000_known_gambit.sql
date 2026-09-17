CREATE TYPE "public"."order_status" AS ENUM('pending', 'processing', 'in_transit', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_terms" AS ENUM('INVOICE_7_DAYS', 'CARD_IMMEDIATE');--> statement-breakpoint
CREATE TABLE "delivery_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_date" date NOT NULL,
	"window" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_moment" integer NOT NULL,
	"vat_rate" integer NOT NULL,
	"product_title" text NOT NULL,
	"package_type" text NOT NULL,
	CONSTRAINT "item_quantity_positive" CHECK ("order_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"restaurant_id" uuid NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"total_amount_netto" integer NOT NULL,
	"total_vat" integer NOT NULL,
	"total_amount_brutto" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"delivery_date" date NOT NULL,
	"delivery_slot_id" uuid NOT NULL,
	"delivery_address" text NOT NULL,
	"payment_method" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_totals_match" CHECK ("orders"."total_amount_brutto" = "orders"."total_amount_netto" + "orders"."total_vat")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"stripe_payment_intent_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'eur' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"package_type" text NOT NULL,
	"price_netto" integer NOT NULL,
	"vat_rate" integer NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"stock_status" text DEFAULT 'in_stock' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "product_price_positive" CHECK ("products"."price_netto" >= 0),
	CONSTRAINT "product_stock_positive" CHECK ("products"."stock" >= 0),
	CONSTRAINT "product_vat_bounds" CHECK ("products"."vat_rate" between 0 and 10000)
);
--> statement-breakpoint
CREATE TABLE "restaurant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"restaurant_id" uuid NOT NULL,
	CONSTRAINT "restaurant_members_subject_unique" UNIQUE("subject")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"address" text NOT NULL,
	"vat_number" text NOT NULL,
	"stripe_customer_id" text,
	"payment_terms" "payment_terms" DEFAULT 'CARD_IMMEDIATE' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_delivery_slot_id_delivery_slots_id_fk" FOREIGN KEY ("delivery_slot_id") REFERENCES "public"."delivery_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_members" ADD CONSTRAINT "restaurant_members_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "order_idempotency" ON "orders" USING btree ("restaurant_id","idempotency_key");