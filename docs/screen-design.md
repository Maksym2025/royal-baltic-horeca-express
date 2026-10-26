# Royal Baltic HoReCa Express — public shop

Implements the supplied screen references in the existing project, with the requested change to a public e-commerce catalog. Stacked on PR #2 (`feat/admin-login-reviewed`).

| Screen | Route |
| --- | --- |
| Home, live products and ordering shortcuts | `/` |
| Public catalog, prices, cold-chain/category filters | `/live` |
| Guest or signed-in basket | `/cart` |
| Sign-in / company details / protected order submission | `/checkout` |
| Welcome and company introduction | `/welcome` |
| Customer sign-in / registration | `/sign-in`, `/register` |
| Administrator sign-in / orders | `/admin/login`, `/admin` |

The slogan is **FRESH FROM THE COLD WATERS TO YOUR TABLE!**. The home page highlights refrigerated delivery across France and whole-carton orders. Client copy supports FR / EN / RU / AR; first-time visitors default to French.

## Shopping behavior

- Active products in active categories and their selling prices are public. `/api/products` returns a specific storefront allowlist; internal image-storage metadata is excluded. Catalog prices are net EUR per configured sales pack, with the VAT rate shown.
- Customers can browse, search, filter, and add whole sales packs without signing in. Quantity controls increment by one and respect the stock limit.
- The public basket survives page reloads. On sign-in, the guest basket transfers into the existing per-user basket exactly once.
- Checkout still uses the existing server-authorized ordering API, company approval, payment eligibility, authoritative prices, stock validation and idempotency. Public catalog access does not make order history or order writes public.
- No new retail markup or price conversion is invented. Prices and carton contents come from the existing product records; the operator must configure each SKU's sales pack accordingly.

## Storage conditions

The product editor provides Chilled / Frozen / Not specified. To work with the existing schema without applying a migration, the canonical description stores one reserved `[cold-chain:...]` line. It is stripped from storefront descriptions. The API exposes the resulting `storageCondition` separately.

For legacy records without this marker, explicit terms in the canonical name/description/category are recognized conservatively. Missing or conflicting storage information stays unspecified and appears in All products, not in a guessed cold-chain group. An explicit editor choice takes precedence over legacy text.

## Responsive behavior

Layout uses the available content width as well as the existing Android webview normalization. Benefits and ordering steps become single-column in phone mode even when the browser reports a 980px layout viewport. Bottom navigation respects the safe area. Local assets include the supplied hero and brand mark; font licenses are in `public/design/FONT-LICENSES.txt`.

## Validation

- TypeScript, full ESLint, production build with dummy localhost connection values and the existing in-memory auth tests.
- `npm run test:shop`: storage metadata round trips, conservative classification, whole-pack quantity validation and one-time guest-basket transfer.
- Chromium with local API fixtures: public prices and both storage filters; guest add → increment → basket reload → sign-in → retained basket → single checkout submission.
- Home, catalog and cart at 320 / 390 / 768 / 1024 / 1440 pixels. Android 980px layout with 390px screen: single-column steps, no overlap or page-level horizontal overflow.
- Anonymous order history and order writes remain rejected. No real orders, accounts or database changes are made by the browser tests.

Production migration, merge, DNS changes and publication are outside this change. Live Google OAuth and production transactions are not established by fixture-based UI checks.
