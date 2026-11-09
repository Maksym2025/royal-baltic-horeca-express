# Commerce Core server bridge — test only
Set server-only COMMERCE_CORE_URL and COMMERCE_CORE_SECRET. Keep existing BetterAuth identity/restaurant approval/delivery scheduling. Map verified restaurant.id to Core commerce_channel_members.company_id server-side. Do not accept company/price/actor from browser.
Products/categories/orders use Core when enabled. Quantities are integer cartons; Core computes kg, discount and price. An order is a draft and never self-confirms payment or release. Delivery window/terms checks remain in PWA; delivery snapshot lives on order in Core.
Native PWA operational admin writes are blocked in Core mode. Do not run legacy order/stock SQL against Core.
tests/commerce-identity-fixture.sql is ONLY an empty test identity/scheduling database, no commerce store. RB-CRM/scripts/test-horeca-bridge.cjs exercised actual BetterAuth sessions through PWA HTTP routes.
Current bridge prices are net EUR and VAT 0: fiscal mapping is not approved for live checkout. No production API, Stripe, Resend or Merit connected.
