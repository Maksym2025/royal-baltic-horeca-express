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

## Mandatory skill discovery and evidence (Astra / Codex / other agents)
Before editing files, inspect this AGENTS.md and enumerate task-relevant local skills in `.agents/skills/*/SKILL.md`. Open and read the FULL relevant SKILL.md files, not just their names. For visual work always read `.agents/skills/horeca-design/SKILL.md` and `.agents/skills/visual-qa/SKILL.md`; for React/UI implementation also read `.agents/skills/horeca-frontend/SKILL.md`. For non-visual work, pick only applicable skills. Check which external plugin/MCP skills/tools are actually available in this session; do not claim they were read or used unless verified. Never block useful work merely because an optional plugin is unavailable.

At the start of the task, briefly report: (a) project instructions loaded, (b) skills read and their paths, (c) relevant external tools available/unavailable, (d) concrete delivery target. At the end, report evidence: files changed, tests performed, actual screenshots/URLs inspected and anything NOT VERIFIED. No invented screenshots, tool usage, user approvals, or passing checks.

## Visual quality gate: build PASS is not design PASS
A visual/UI task is NOT DONE until a real rendered Preview or local browser view was inspected at desktop (~1440px) and mobile (~390px), with screenshot evidence, and checked for layout, typography, image quality, spacing, accessibility, localization and functional links. If browser access is unavailable, report BLOCKED: VISUAL QA NOT VERIFIED, not DONE. Never ship placeholders, text-only recipe cards presented as polished content, missing or broken images, overlapping content, or fake product/catalog data as finished UI. Favor authentic licensed or generated food photography when the approved design calls for images; never silently invent copyright permissions.

For recipe sections specifically: heading must be locale-aware (FR default), suitable for a professional HoReCa audience, with appealing food imagery, readable titles, preparation duration and portion details where known, functioning recipe links, and visual hierarchy matching existing approved UI. Never assert recipe popularity or chef attribution without editorial basis. If required data is absent, design an intentional empty/loading state and explicitly flag missing content rather than fabricate.

## No unattended human-login deadlock
When a step requires owner login, approval, CAPTCHA or another human action: try all permitted noninteractive checks first; state exactly which step is blocked and what remains independent of it; continue independent work in this run; then finish with an honest BLOCKED status and a concise single action needed from the owner. Do not idle indefinitely awaiting login, do not retry endlessly, and do not bypass access controls. Do not claim to send reminders later unless a reminder automation was actually created.

## Release gate and approved baseline
Preserve the approved design, tokens, layout, copy and behavior unless the request explicitly changes them. Before touching UI, inspect nearby existing styles/components and use the smallest scoped patch. Preview is not Production: no Production release or domain switch without explicit owner authorization. A task requiring user review ends at READY FOR REVIEW, not DONE/PRODUCTION. Clearly distinguish code complete, visual QA passed, integration verified, and owner-approved.
