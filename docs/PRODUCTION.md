# Royal Baltic operations rollout

The existing Better Auth, Neon HTTP/Drizzle APIs and `rb_place_order` remain authoritative.
No demo customer/product data is seeded. Amounts are integer euro cents and VAT is basis points.

## Upgrade existing database

Take a Neon branch/backup and validate the upgrade there first. Do not run `drizzle-kit push`
on production. This repository predates a complete Drizzle migration journal: `0002_auth.sql`
was applied separately. Do not replay `0000`/`0001` on an existing database.

Apply `neon-migrations/0003_operations.sql` once in a transaction, commit, then apply
`neon-migrations/0004_order_catalog_guard.sql` in a second transaction. Deploy code after
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
