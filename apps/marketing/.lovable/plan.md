# Typography refinement pass

Single-file edit to `src/routes/index.tsx` plus minor cleanup in `src/styles.css`. No layout, color, spacing, section, card, button, or phone-mockup changes.

## Type system (final state)

Map every page-level text node to one of six tokens. Reuse existing tokens — no new tokens, no new families, no new weights.

**Titles (Inter, semibold; Cormorant only on the kept italic accents)**
- **Hero Title** → `text-h1 md:text-display-lg font-semibold` — hero only.
- **Section Title** → `text-h1 md:text-display-md font-semibold` — every section headline (Built Around Real Life, Save/Spend/Grow/Learn/Own, Pia, How it works, FAQ, final CTA). All sections identical.
- **Card Title** → `text-h3 font-semibold` — card titles, feature titles, footer wordmark, header wordmark, How-it-works step titles, Pia chat header.

**Body (Inter)**
- **Large Body** → `text-body-lg` — hero supporting paragraph only.
- **Body** → `text-body` — every other paragraph: section leads, card descriptions, FAQ questions, FAQ answers, Pia section lead, How-it-works step descriptions.
- **Small Body** → `text-body-sm font-medium` (or `font-semibold` where it currently is, e.g. buttons) — nav, buttons, eyebrows, chips, "see all" links, Pia status, timestamps, footer fine print.

Eyebrows keep their existing `uppercase tracking-[0.18em] text-raspberry` treatment, just standardized at `text-body-sm font-semibold` instead of `text-label`.

Drop from page use: `text-display-xl`, `text-h2`, `text-caption`, `text-label`, `text-xs`. (Tokens stay defined in `styles.css` for the mockup/system, but I'll mark unused ones in a comment so they don't get reintroduced.)

## Italic accent cleanup (~70% reduction)

Currently 8 Cormorant italic accent phrases on the homepage. Keep 3, convert the rest to plain Inter (same color treatment where relevant).

**Keep italic:**
1. Hero: *"checking account."* ✓
2. "Built around your *money goals.*" — anchor accent for the goals section.
3. FAQ headline: *"FAQ"* — single-word brand flourish that reads as a label.

**Remove italic (convert span to plain Inter, keep raspberry color where it's the accent color):**
- Marquee row "And a little more." → plain
- "…feel *simple.*" → plain
- "…finance *degree.*" → plain
- "More empowering than *one.*" → plain
- How it *works.* → plain
- Final CTA "*More freedom.*" → plain (keep raspberry color)

Header & footer "Olimpia" wordmarks stay Cormorant (brand wordmark, not a sentence accent). How-it-works step numerals stay Cormorant.

## Phone mockup

Untouched. All `text-[10px]` / `text-[11px]` / `text-[13px]` / `text-[15px]` / `text-[28px]` inside `PhoneMockup` remain as-is.

## Files

- `src/routes/index.tsx` — className swaps only.
- `src/styles.css` — add a short comment block noting which tokens are page-level vs reserved; no token deletions (safer, avoids breaking the mockup or any future use).

No logic, routing, copy, or component-structure changes.

Used the **design-consistency** skill.
