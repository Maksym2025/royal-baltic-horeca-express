# HoReCa announcements and customer demand

Built on the existing `0cc2139` storefront Preview, not on the older local prototype.
The approved hero, header, range, CMS sections and footer are retained. The new
announcement strip appears immediately after the hero. Existing unavailable
catalog cards use a heart and an accessible information disclosure. FR remains
the default, with EN/DE/RU translations. Product quantities are whole sales packs.

## Customer flow

Public customers can inspect announced products, packaging, estimated arrival
and indicative net package prices. An authenticated approved company reserves
without payment. One active preorder exists per company/product; saving replaces
quantity, cancellation retains history, and retries cannot duplicate it. The
customer account shows its own company's preorders. A guest's selected product
and quantity are retained for confirmation after company sign-in/registration.

Demand uses explicit desired state and one vote per company/product, including
multiple staff members using the same company. Votes can be removed. Public
responses expose aggregate counts only, never customer identities or private
preorders. The heart is explicitly explained as demand research, not an order.

## Existing CRM and finance

All feature data resides in the existing Commerce Core alongside its canonical
products, companies, orders and warehouse records. New preorders are purchase
intent, not another order, inventory or payment ledger. Each creates one assigned
CRM task with the company, product and quantity; edits update that same task,
and customer cancellation cancels it. A demand threshold (default 20 companies)
creates one assortment-review task. It never buys or publishes inventory.

`horeca_preorders_admin(actor)` is staff-authorized; it provides company contacts,
quantities and demand totals. `horeca_preorder_convert(actor, preorder, slot)`
rechecks real available stock and delegates to the existing `platform_channel`
order function. The canonical current company price, tax policy and pack weight
apply. Retrying returns the same canonical order. The CRM task is linked to that
order for the existing Finance invoicing and payment workflow. Invoice issuance,
payment confirmation, warehouse reservation and Root release remain the existing
CRM responsibilities. These database functions do not introduce a separate staff
login or replace the CRM UI with a new shop administration system.

The announced price is indicative; the final current price is confirmed on the
invoice before payment. No price is frozen, stock deducted, invoice issued,
payment marked paid or message sent by reserving or voting. Normal checkout
rejects announced/planned products. Actual invoicing, bank payment and dispatch
must be handled through the established authorized workflow after receipt.

## Release scope

`integration/0032_horeca_preorders.sql` is additive and uses fixed-search-path,
allowlisted functions. The store channel has function execution only, with no
SELECT on the new private tables or permission to run staff reports. Reservation
ownership and company approval are verified on the server and in PostgreSQL.
Mutations require same-origin requests, authenticated users and a database rate
limit. No browser-provided company, price, vote count or paid status is trusted.

Enable `HORECA_INTENTS_ENABLED=1` only with the matching migration installed.
With the flag absent, catalog behavior is unchanged and the feature returns empty
state. The preview uses an isolated branch of the current shared CRM database and
two newly generated restricted logins. Existing environment secrets were not read.
Only the existing `feature/public-market-redesign` Preview environment is changed;
there is no Production migration, domain change, main merge or Production release.

`tests/fixtures/horeca-announcements.sql` requires an explicit
`horeca.preview_seed=confirmed` opt-in. It contains the four requested test
announcements for December 3, 2026 and one planned existing SKU. It creates no
stock, actual purchase prices, published payable price lists or orders. Its
prices are indicative Preview examples. Do not apply it to Production.

The caviar photograph is the existing approved store asset. The smoked herring
photograph is credited in the UI and in its license file; it is illustrative,
not documentation of a supplied batch. No vector product illustrations are used.

## Validation

`npm run test:intents` verifies input boundaries, explicit cancellation, client
ownership/price injection rejection and non-destructive announcement merging.
`tests/horeca-preorders.sql` runs on the isolated Preview branch with rollback-only
synthetic companies, tasks, price/tax approvals, stock and orders. It covers
deduplication, company isolation, CRM task quantities, cancellation, demand
thresholds, no premature payment/order, receipt checks and conversion at current
canonical prices without a physical stock deduction.

The public storefront and account are also exercised through real HTTP requests
against the Preview branch. Visual browser evidence covers desktop 1440px and
mobile 390px, image loading, locale switching, reserve/update/cancel, demand
disclosure and absence of document overflow. Test votes are removed through the
customer action before review. Outbound invoice delivery, actual payment and
physical dispatch are not performed by this change.
