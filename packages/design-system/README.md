# Design System

**Olimpia** visual design rules and tokens.

## What belongs here

- Colors, fonts, typography scale, spacing, and radius
- Button, card, and shadow definitions
- Theme tokens for light/dark (if applicable)
- Rules aligned with `docs/brand/Brand.md` (Cormorant Garamond, Inter, palette, voice)

## Out of scope

- Composed UI components — see `packages/ui/`
- Screen layouts and product flows — see `apps/mobile/` and `apps/marketing/`
- Marketing copy and content

## Color source of truth

Use these files for canonical hex values and token names:

| Surface | File |
|---------|------|
| Marketing site / Lovable | [`apps/marketing/src/styles.css`](../../apps/marketing/src/styles.css) |
| Mobile Phase 2 | [`docs/design/MobilePhase2ScreenBrief.md`](../../docs/design/MobilePhase2ScreenBrief.md) §1.1 |

**Do not use** `tokens.css` in this folder for implementation — it contains stale draft values and is not wired into `apps/marketing`. Regenerate from the sources above when this package is connected to mobile.

## Status

Scaffold only — `tokens.css` is a placeholder until synced from the canonical sources above.
