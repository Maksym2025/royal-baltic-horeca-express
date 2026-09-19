# Royal Baltic operations rollout

The existing Better Auth, Neon HTTP/Drizzle APIs and `rb_place_order` remain authoritative.
No demo customer/product data is seeded. Amounts are integer euro cents and VAT is basis points.

## Upgrade existing database

Take a Neon branch/backup and validate the upgrade there first. Do not run `drizzle-kit push`
on production. This repository predates a complete Drizzle migration journal: `0002_auth.sql`
was applied separately. Do not replay `0000`/`0001` on an existing database.

Apply `neon-migrations/0003_operations.sql` once in a transaction, commit, then apply
`neon-migrations/0004_order_catalog_guard.sql` in a second transaction, then
`neon-migrations/0005_delivery_snapshot_guard.sql`. Deploy code after
these migrations. They preserve all existing tables, IDs, order snapshots, stock and users.
Verified restaurants are backfilled as APPROVED; other restaurants remain PENDING.
Category rows are derived from existing catalog values, not demo fixtures.

All existing users start as CUSTOMER. Bootstrap an administrator using a trusted database
connection after checking the exact user identity:

```sql
UPDATE "user" SET role='ADMIN' WHERE id = '<verified-existing-user-id>';
```

There is deliberately no public API to grant administrator access. Roles are read from
PostgreSQL on each protected request, not trusted from the browser or session cache.

## Operational behavior

- Existing `pending`, `processing`, `in_transit`, `delivered`, `cancelled` states remain valid.
  New states `confirmed`, `preparing`, `ready` extend this enum. UI maps these to operational names.
- Compare-and-set transitions reject concurrent/stale admin edits.
- Cancellation restores reserved stock exactly once in PostgreSQL. Paid orders require
  reconciliation before cancellation. Online Stripe payment/refunds are not implemented.
- Slot date/window cannot change after orders reference it; disable and create a new slot.
- Archive products/categories instead of deleting order history.
- Price/stock/verification checks remain server/database authoritative.
- Dashboard calendar boundaries use Europe/Berlin; net sales excludes cancelled orders.

## Catalog images

Attach a public Vercel Blob store to the **existing** deployment project. Set
`BLOB_READ_WRITE_TOKEN` (server only) and `BLOB_PUBLIC_HOST` to its exact public hostname,
for example the hostname shown by the Blob store dashboard, without an https prefix.
The admin upload endpoint accepts JPEG/PNG/WebP up to 3 MB, checks file signatures and
requires a current database ADMIN role plus same-origin request. URLs and metadata are
stored in PostgreSQL; image binaries never enter Git. SVG uploads are rejected.
Detaching an image preserves the Blob object, so a product used elsewhere is not broken;
periodic unreferenced-media cleanup can be done in the storage dashboard.

## Customer UI and authentication

The root catalog and `/account` use real APIs only. `/live` remains a compatible entry.
Better Auth email/password and Google OAuth stay unchanged. Configure Google callback
as `<BETTER_AUTH_URL>/api/auth/callback/google`. After login, membership is loaded before
showing onboarding; only users without a company are asked to register one.
A company with pending/rejected/disabled status cannot access wholesale catalog APIs.

FR/EN/RU/AR dictionaries live in `lib/i18n/dictionaries.ts`. A locale cookie supplies the
server-rendered html lang/dir; the header switcher updates both immediately. Arabic uses
RTL and CSS logical directions; the operational admin surface is English/LTR.
Product/category translations are JSONB fields keyed by locale, with original data as
fallback. They do not duplicate product identities or alter order snapshots.

Card payments mean **card on delivery**, not online Stripe checkout. Existing invoice
eligibility is checked again by API and the atomic SQL order function. A pending request
is retained in sessionStorage with the same idempotency key on uncertain network errors.
Prices, quantities and eligibility are always revalidated server-side.

## Validation environment

Migration and atomic-order checks were executed first on Neon branch
`rb-operations-validation-20260918`. Test fixtures roll back and are never inserted into
production catalog data. The main branch upgrade keeps the existing empty catalog empty:
real products, commercial prices and delivery slots must be entered by an administrator.

## Automated regression checks

GitHub Actions runs TypeScript, ESLint and the Next.js production build, plus a separate
PostgreSQL 18 job applying every migration to an empty disposable database and executing
`tests/order-invariants.sql`. It verifies VAT totals, idempotent retries/conflicts, invoice
eligibility, stock reservation/release, duplicate cancellation, immutable booked slots,
archived category rejection and company approval enforcement. Fixtures roll back.

A full browser walkthrough and real Google OAuth callback still require a usable browser
and deployment credentials. Blob integration must be configured before upload testing.
