# Royal Baltic HoReCa Express

## Delivered prototype

React 19 + Next.js App Router APIs via Vinext, Tailwind CSS 4, Lucide and accessible Shadcn/Radix controls. Sites deploys the app as a Cloudflare Worker. UI language: German. Responsive catalog, SKU/text search, category and stock filters, product detail dialogs, restaurant demo selection, per-package quantity controls, cart, delivery day/time selection, payment terms, confirmation, order history and additive repeat-order flow are implemented.

The UI is intentionally a demo, not a live ordering system. It never calls the production order API. Orders created in the demo exist in current page memory only; sample history is bundled. No real email/SMS authentication, company validation, dispatch, payment, tracking, notifications or invoice delivery occurs. Test profiles and prices are explicitly labelled. Switching restaurants clears the cart and selects eligible payment terms. Reordering uses current catalog prices and caps quantities at the demo stock limit.

## Project structure

- `app/page.tsx`: interactive ordering interface and demo flows.
- `app/globals.css`: responsive maritime theme and touch controls.
- `lib/catalog.ts`: demo products, restaurant fixtures and cent-based totals.
- `app/api/{products,profile,orders,delivery-slots}/route.ts`: protected server endpoints for the future connected mode.
- `lib/server/auth.ts`: Sites identity → verified restaurant membership; no restaurant ID is trusted from browser state.
- `lib/server/db.ts`: Drizzle + Neon serverless HTTP driver, no raw TCP connections.
- `db/schema.ts`: relational PostgreSQL schema.
- `neon-migrations/`: generated Drizzle migration and custom transactional order function.
- `public/manifest.json`, `public/sw.js`, `public/offline.html`: PWA assets.

## PostgreSQL model

Restaurants → restaurant_members; restaurants → orders → order_items; products → order_items; orders → payments; delivery_slots → orders. Stripe event IDs have a deduplication table reserved for a future webhook. Amounts are integer EUR cents, VAT rates integer basis points (700 = 7%). Price, tax rate, product title, package and delivery address are snapshotted. No NoSQL/D1 substitute was created.

`rb_place_order` verifies restaurant eligibility, server-controlled delivery slots and payment terms; locks inventory in stable product order; calculates prices/tax from the database; creates the order/items/payment and decrements stock in one transaction. Restaurant-scoped idempotency prevents duplicate order creation; different bodies with the same key fail. Any validation error rolls back the entire transaction. Delivery slots must be populated with real dates/cutoffs; public requests cannot populate or modify stock or company verification.

## Connecting a real development branch

No Neon credentials were available when this version was built. No external database was provisioned or migrated. The source includes the backend for connection work, but it has not been integration-tested against PostgreSQL.

1. Link the intended Neon project and create an isolated development branch. Set ignored `DATABASE_URL` (pooled runtime) and `DATABASE_URL_UNPOOLED` (direct migration) values. Do not paste secrets into chat or commit them.
2. Run the Drizzle migrations against that branch: `pnpm exec drizzle-kit migrate`. Review generated SQL before applying to any existing database.
3. Add restaurant, product and delivery-slot data. Explicitly map the authenticated Sites subject to a verified restaurant using `restaurant_members`. A demo restaurant selection is not authentication.
4. Set `DATABASE_URL` as a private Sites runtime secret. Verify API access, ownership isolation, concurrent inventory, idempotency, tax rounding, and failure rollback on that branch.
5. Wire a dedicated connected UI mode to the API and remove all demo fixtures from its client bundle. Keep real prices server-side; the current client-side demo price gate is only a demonstration.
6. For a public independent PWA with phone/email sign-in, implement a supported external authentication adapter. The current backend trusts identity headers ONLY from the Sites dispatcher; do not expose the origin or deploy this adapter unchanged to another host.

## Payments

The demo supports invoice terms, bank transfer and card on delivery as choices, but performs no transactions. The `payments` table records pending amounts in the connected API. There is no Stripe Checkout, webhook endpoint or API key use in this version. CARD_IMMEDIATE in the requested enum and card-on-delivery in the UI are distinct settlement flows: confirm the desired live method before wiring Stripe.

For online cards, use a server-created Stripe Checkout Session with EUR amounts from the order snapshot and an idempotency key tied to that order; persist its association, verify webhook signatures using the raw request body, deduplicate event IDs, check amount/currency/order ownership, and mark paid only after the verified successful event. A redirect must never mark an order paid. Card on delivery requires a terminal/provider integration, not an online Checkout substitute. Invoice payment deadlines need a real invoicing workflow.

## PWA / offline

Manifest, branded PNG icons and a registered service worker are included. It precaches only public imagery and an offline page. It never caches authenticated API responses, restaurant data or orders and never queues purchases offline. An already-open catalog remains interactive offline; order submission is disabled. An offline cold launch displays the reconnect page. Installation must be verified on the final HTTPS origin and target Android/iOS devices; owner-private Sites access can affect installability. Device installation and the service worker were not verified in the cloud browser.

## Tax and delivery

7% is an illustrative per-product demo setting supplied in the PRD, not a legal determination for all items. The schema allows per-SKU tax rates. Live German domestic/cross-border tax treatment, supplier registration, VAT validation and freight tax treatment must be configured with the business's actual circumstances. Demo freight is explicitly zero; no minimum or free-shipping threshold is implied.

## Development

Use Node >= 22.13 and the package manager version in package.json. `pnpm install`, `pnpm dev`, `pnpm build`. Retain the lockfile. All source is stored with the Site's repository. No other Royal Baltic repository or database is changed.

Driver reference: https://orm.drizzle.team/docs/connect-neon

## Verification

TypeScript no-emit check and production build passed. Cent-based totals (including 7% line rounding), empty cart totals, allowed delivery weekdays and required local image/icon references were checked. Browser UI and WebMCP validation were unavailable because the cloud browser blocked the supervised preview URL. No database migration or payment integration was executed.
