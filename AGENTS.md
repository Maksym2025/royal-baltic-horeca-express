# Royal Baltic HoReCa Express — agent instructions

## Product and architecture
This is the existing HoReCa Express PWA for royal-baltic.com, not a replacement project. Public shopping experience defaults to French with EN/DE/RU language switching. Use the existing Royal Baltic CRM/OMS/Warehouse/Finance operational backend and shared Neon PostgreSQL as source of truth. Do not create a separate CRM, inventory database or duplicate order ledger. Do not alter the independent B2B website royal-baltic.eu.

## Customer experience
The public catalog must be visible without registration, with customer-facing approved selling prices, categories, product cards, cart and checkout. Sell in whole-box multiples, with minimum one box where applicable. Show available products first and out-of-stock products after them, clearly marked unavailable, without allowing purchase of unavailable quantity. Product cards must exist even when stock is zero. Recipe blog and comments require moderation, spam protection and server-side authorization for administration. All public copy and product names must follow the active locale.

## Integration and security
Product metadata, images, inventory, availability, prices and order state must come from approved CRM/warehouse APIs. Prevent overselling with server-side atomic reservation; do not trust browser quantities/prices. An order or paid flag never deducts physical stock or authorizes dispatch. Root admin alone releases verified reserved orders for dispatch. Keep full audit and handle partial dispatches without duplicate deductions.
Never expose supplier identities where confidential, EXW/purchase costs, margins, private customer documents, secrets or internal API credentials to the public frontend or chatbots. Enforce server-side RBAC and rate limits on authentication, checkout and comments.

## Development and release
Preserve approved UI and existing components; make targeted edits only. Work on the existing main branch when requested, without creating extra branches or PRs by default. Run focused tests and verify real public catalog -> cart -> checkout -> CRM order -> warehouse reservation flow using test fixtures. Keep Preview separate from Production; do not attach royal-baltic.com until the owner explicitly approves. No real orders, outbound messages, production migrations, destructive data edits, domain/DNS changes or production deployments without explicit approval. Report verified results and NOT VERIFIED gaps accurately.
