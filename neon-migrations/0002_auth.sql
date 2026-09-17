CREATE TABLE IF NOT EXISTS "user" (
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
