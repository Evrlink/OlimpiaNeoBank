---
name: design-consistency
description: Enforce Olimpia's locked typography system — Cormorant Garamond for italic accent words and brand wordmark, Inter for everything else, and a fixed 11-step font-size scale. Trigger whenever editing visual design, building a new page or section, refining UI, polishing layout, or whenever the user mentions fonts, typography, sizes, "inconsistent", "redesign", "make it look better", or "more premium".
---

# Olimpia Design Consistency

This skill locks typography across the Olimpia marketing site and mobile previews. Apply it whenever you touch a component, route, or stylesheet that renders text.

## The two-font rule

| Role | Family | Token | Allowed weights |
| --- | --- | --- | --- |
| Default text — headlines, body, UI, buttons, nav, labels, numbers | Inter | `font-sans` (default) | 400, 500, 600 |
| Italic accent word inside a headline, brand wordmark, "01/02" step numbers | Cormorant Garamond | `font-display` | 400 only (use `italic` for accents, plain for wordmark/numerals) |

- **Inter is the workhorse**, including for non-italic headline text. Default `font-semibold` on display sizes.
- **Cormorant is the spice** — used as `font-display italic` on exactly one or two accent words per headline, on the "Olimpia" wordmark, and on step numerals ("01"). Never on full sentences, body text, buttons, nav, or labels.
- No third family. No `font-serif` utility, no inline `font-family`, no new `@import` for Google Fonts.
- Never combine `font-display` with `font-semibold` / `font-bold` — Cormorant stays at 400.

## The locked size scale

Pick one token per element. Never write `text-[Npx]`, `text-[1.0625rem]`, arbitrary `leading-[…]`, arbitrary `tracking-[…]` (except the approved `tracking-[0.18em]` for eyebrows), or one-off `font-size` in CSS.

| Token | Size | Line height | Use |
| --- | --- | --- | --- |
| `text-display-xl` | 4.5rem / 72px | 1.02 | Hero headline + final-CTA headline |
| `text-display-lg` | 3.5rem / 56px | 1.05 | FAQ headline, large closers |
| `text-display-md` | 2.75rem / 44px | 1.08 | Section headlines (desktop) |
| `text-h1` | 2.25rem / 36px | 1.15 | Section headlines (mobile), subsection headlines |
| `text-h2` | 1.75rem / 28px | 1.2 | Card titles, hero subhead |
| `text-h3` | 1.375rem / 22px | 1.3 | Small headings, logo wordmark, step numerals |
| `text-body-lg` | 1.125rem / 18px | 1.6 | Lead paragraphs under section headlines |
| `text-body` | 1rem / 16px | 1.6 | Default paragraph |
| `text-body-sm` | 0.875rem / 14px | 1.55 | Secondary text, nav links, button labels |
| `text-caption` | 0.75rem / 12px | 1.5 | Captions, metadata, footer fine print |
| `text-label` | 0.6875rem / 11px | 1.4 | Eyebrows, tags — pair with `font-semibold uppercase tracking-[0.18em]` |

Responsive headlines: combine scale tokens (e.g. `text-h1 md:text-display-md`). Do not invent intermediate sizes.

## Anti-patterns — reject on sight

- `text-[22px]`, `text-[1.0625rem]`, `leading-[1.65]`, `tracking-[-0.02em]` outside the locked tokens.
- Cormorant on body copy, buttons, nav, labels, captions, or any sentence longer than ~3 words.
- `font-display font-semibold` or `font-display font-bold` — strip the weight class.
- Adding a third font file or new Google Fonts `<link>`.
- Inline `style={{ fontFamily }}` or `font-family:` in CSS modules.

## Allowed exceptions

- **Device mockups** (e.g. `PhoneMockup`, marketing screenshots that simulate a real phone UI at fixed scale) may use arbitrary pixel sizes like `text-[10px]`, `text-[28px]`. Keep them confined to that one component and add a brief comment noting the mockup-scale reason.

## Workflow before finishing any UI edit

1. Read `references/audit-checklist.md` and run the greps.
2. Replace every arbitrary value in marketing/page content with the nearest scale token. If nothing fits, the design is wrong — do not invent a new token.
3. Verify `font-display` only appears on: italic accent spans, the "Olimpia" wordmark, or step numerals — and carries no weight class.
4. Confirm headings descend monotonically within a section.

## Reference files

- `references/type-scale.md` — JSX examples for every token
- `references/audit-checklist.md` — grep commands and pre-finish checks
