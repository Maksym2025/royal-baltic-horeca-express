---
name: horeca-frontend
description: Use for implementation of HoReCa Express Next.js React Tailwind screens, responsive components and checkout UI.
---
# HoReCa frontend
1. Read AGENTS.md and horeca-design skill before visual changes.
2. Reuse the existing Next.js / React / Tailwind architecture, shared components and design tokens; do not create another app.
3. Keep FR as public default, with complete EN/DE/RU switching. Never hardcode RU in public UI.
4. Prefer accessible semantic HTML, keyboard operation, alt text, visible focus styles and responsive behavior at ~390px and ~1440px.
5. Product price, stock and box-size are server-authoritative. Never leak supplier costs, margins or privileged data in public components.
6. Make the smallest possible diff and keep all approved regions visually invariant. Check navigation, image loading, localization and relevant browser interactions.
7. Run targeted lint/build checks where feasible, then hand off to visual-qa. Passing build does not mean UI passes review.
8. Report actual files changed, checks run and gaps; do not mark unavailable integrations as verified.
