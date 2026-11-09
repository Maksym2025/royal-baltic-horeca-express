# Phase 4 bridge hardening
VAT 0 fallback removed. Core requires documented approved customer/product policy with rate, basis, evidence and expiry before catalog/checkout. Returned line rates and gross totals are explicit; no client VAT/price overrides.
Core snapshots VAT on order lines; confirming and dispatching enforce policy. Net-only payment cannot unlock a gross obligation. Existing policy-free historical orders require reviewed migration/backfill; do not invent zero.
The 21% used in .invalid integration fixtures is synthetic, NOT a production tax decision. Do not copy test policies into Production.
End-to-end BetterAuth PWA checkout → Core confirmation/payment/reservation → root approval → warehouse dispatch → PWA in_transit/succeeded checked.
This feature branch remains a pre-production candidate; no real fiscal/payment service or deployment enabled.
