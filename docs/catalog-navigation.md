# Catalog navigation and storage facts

Extends the existing HoReCa storefront and CRM catalog; no new inventory or order data.

The header catalog menu and the public catalog separate three independent axes:
storage (chilled/frozen), preparation (all smoked/hot-smoked/cold-smoked/salted/dried),
and existing product families. Counts reflect the actual published catalog. Catalog
counts apply the other selected axes and the search. Zero-result combinations have
a clear reset action. Filters are addressable through `storage`, `processing`,
`category` and `q` parameters and restore on reload and browser back/forward.
When the feature is enabled, unpublished products are excluded using the shared
catalog publication allowlist, including internal test records without public cards.

Cards, quick-order rows and product details display the same source storage facts.
Public copy is available in FR (default), EN, DE and RU. Unspecified smoking never
implies a hot/cold subtype. Unknown temperatures stay unknown; a frozen title never
causes the client to invent −18 °C. Structured metadata takes precedence over names.

`0033_horeca_catalog_facets.sql` adds optional editorial facts to the existing
`horeca_catalog_cards`. `horeca_catalog_facets()` exposes only published product IDs,
storage, temperature limits and preparation. Its fixed search path and execute-only
channel grant preserve the existing permissions. The existing CRM staff manages
these fields; customer APIs do not write them. A CRM form for editing the new fields
is outside this storefront repository and has not been implemented or verified.

Enable `HORECA_CATALOG_FACETS=1` only after the migration. This release enables it
only on the existing Preview branch and isolated CRM database branch. Production
does not require the migration while the flag is off.

Preview fixture temperatures for the six legacy SKUs come from this repository's
original `lib/catalog.ts`: 10442 is 0…+2 °C; 44090 is 0…+4 °C; 20881, 30129,
10456 and 20912 have a maximum of −18 °C. These are demo specifications and MUST be
confirmed against actual product labels before any Production rollout. No smoking
subtype or temperature is invented for the four new announcements.

Reference inspected: the shared Stitch project
https://stitch.google.com/projects/12059797459033009173. Adapted its visible catalog
tabs/counts, photo-adjacent temperature labels and scanning hierarchy. No external
stock, certification, origin, delivery guarantees or telemetry claims were copied.

Validation: `npm run test:catalog`, `npm run test:intents`, targeted lint/TypeScript,
production build, metadata/permission SQL checks and real desktop/mobile browser
checks against the isolated Preview data. No real order/payment/dispatch tests are
needed for these navigation/metadata changes; the prior preorder flows get a smoke
regression run. Actual product-label accuracy and an external CRM editing form remain
NOT VERIFIED.
