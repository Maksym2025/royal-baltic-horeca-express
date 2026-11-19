---
name: visual-qa
description: Mandatory rendered-page visual acceptance check for every HoReCa Express UI task before calling it complete.
---
# Visual QA acceptance
1. Read AGENTS.md and understand requested scope and approved baseline.
2. Start or open the actual candidate UI (local browser or Preview). Verify at desktop ~1440px and mobile ~390px. Capture screenshots of BOTH sizes and compare against baseline for unrelated changes. Never fabricate visual inspection.
3. Verify: image loaded and appropriate; spacing and grid; typography hierarchy; legibility and contrast; no overflow/overlap; no placeholder filler; links/buttons work; FR default and language-switch behavior where affected; accessible focus states.
4. For recipes: visually appealing real dish image where authorized, valid readable recipe title, real metadata (duration, servings if known), functional recipe link, correct professional chef attribution only if substantiated.
5. Run relevant functional checks of touched paths; checkout/order/stock integration requires separate verified end-to-end evidence.
6. Fail the gate for ugly or incomplete cards, broken images, layout bugs, dead links, fabricated metadata, missing mobile presentation or regressions. Fix and recheck rather than report PASS.
7. Final report: DESKTOP screenshot path/URL, MOBILE screenshot path/URL, tests actually run, PASS/FAIL by criterion, and remaining NOT VERIFIED. If screenshots/browser cannot be obtained, mark VISUAL QA NOT VERIFIED and status BLOCKED; never claim DONE.
