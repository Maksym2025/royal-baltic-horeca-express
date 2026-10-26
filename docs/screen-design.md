# Royal Baltic HoReCa Express — screen implementation

This change implements the seven supplied HTML screen references in the existing application. It is stacked on PR #2 (`feat/admin-login-reviewed`) and retains the invitation, Preview-origin, Google-capability and Android viewport work already present there.

| Screen | Route |
| --- | --- |
| Home, range previews and ordering shortcuts | `/` |
| Approved customer catalog and basket | `/live` |
| Checkout | `/checkout` |
| Welcome, benefits and company introduction | `/welcome` |
| Customer sign-in / account registration | `/sign-in`, `/register` |
| Separate administrator sign-in | `/admin/login` |
| Orders table, filters, search and selected order | `/admin` |

The navy, gold and teal palette, Fraunces / Instrument Sans fonts, supplied hero and brand mark are local assets. Font licenses are in `public/design/FONT-LICENSES.txt`. Client copy supports FR / EN / RU / AR; first-time visitors default to French. Existing language cookies take precedence.

The reference's fixed 390 / 1280 pixel canvases have been replaced by responsive layouts. Mobile navigation respects the safe area. The catalog and checkout use the same authenticated API and per-user session-storage basket. The homepage range previews are editorial links, not live stock or price claims. Prices and ordering remain behind the existing approval gate.

## Validation

- TypeScript and full ESLint pass.
- Production build passes with a dummy localhost database URL and local-only auth values. No production credentials or database connection were used.
- Chromium rendered home, welcome, customer sign-in, registration and admin sign-in at 320, 390, 768, 1024 and 1440 pixels: no page-level horizontal overflow, broken images or runtime exceptions.
- Local browser fixtures exercised add quantity → checkout → reload and restore basket → submit once → confirmation → history → repeat order. The captured POST retained quantity, delivery slot and idempotency key.
- Pending B2B fixtures did not render products or prices.
- Catalog and admin order views were checked at all five widths. Order search and empty results were checked.
- Password visibility, Arabic RTL, anonymous `/admin` redirect, and isolation of the admin header/navigation were checked. A temporary admin-only rendering harness was removed after testing.
- Browser API fixtures intercepted requests locally; no real orders or accounts were created. This verifies interface behavior, not production database transactions or live Google OAuth.

## Review boundaries

This PR changes presentation and navigation. It does not change database schema, API authorization, stock rules, dispatch permissions, OAuth provider settings, secrets, DNS or CI workflows. Existing server operations remain authoritative. The backend's root-admin-only shipment release requirement needs its own server-side verification; this UI work does not establish that guarantee.

No main merge or Production publication is included.
