-- TEST ONLY: identity and delivery scheduling; no product, order, stock or payment store.
CREATE TYPE user_role AS ENUM ('CUSTOMER','ADMIN');CREATE TYPE approval_status AS ENUM ('PENDING','APPROVED','REJECTED','DISABLED');CREATE TYPE payment_terms AS ENUM ('INVOICE_7_DAYS','CARD_IMMEDIATE');CREATE TABLE "restaurants" (
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
CREATE TABLE "restaurant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject" text NOT NULL,
	"restaurant_id" uuid NOT NULL,
	CONSTRAINT "restaurant_members_subject_unique" UNIQUE("subject")
);
CREATE TABLE "delivery_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"delivery_date" date NOT NULL,
	"window" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL
);CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session" ("user_id");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "access_token" text,
  "refresh_token" text,
  "access_token_expires_at" timestamptz,
  "refresh_token_expires_at" timestamptz,
  "scope" text,
  "id_token" text,
  "password" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account" ("user_id");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

ALTER TABLE "restaurant_members"
  ADD CONSTRAINT "restaurant_members_subject_user_id_fk"
  FOREIGN KEY ("subject") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "user" ADD COLUMN role user_role NOT NULL DEFAULT 'CUSTOMER';ALTER TABLE restaurants ADD COLUMN contact_person text;ALTER TABLE restaurants ADD COLUMN billing_address text;ALTER TABLE restaurants ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'PENDING';ALTER TABLE restaurants ADD CONSTRAINT restaurant_approval_consistent CHECK(verified=(approval_status='APPROVED'));