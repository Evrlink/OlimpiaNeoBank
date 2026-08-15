---
name: olimpia-mobile-ux
description: >-
  Olimpia mobile and app-preview UX rules for Home, Savings goals, yield/Growth,
  Add Money, activity, and tab navigation. Use when designing or implementing
  mobile screens, marketing app-preview states, empty states, CTAs, or when the
  user asks about savings goals, yield, APY, Choose Yield, or navigation IA.
---

# Olimpia Mobile UX

Calm, dollar-first neobank UX. Prefer clarity over feature density.

Also apply typography from `apps/marketing/.agents/skills/design-consistency` when editing marketing preview UI.

## Product model (do not blur)

| Concept | Meaning | User CTA |
| --- | --- | --- |
| **Available balance** | Spendable dollars (USDC behind the scenes) | Add money |
| **Savings goal** | Named pot of USDC (Vacation, etc.) — **does not auto-earn** | Create goal / Add to goal |
| **Yield / Growth** | Separate allocation via provider (invisible) | Choose Yield / Start earning — **only when yield is actually started** |
| **Activity** | Ledger of transfers and status | Home preview + See all (not a 5th tab yet) |

- Users do **not** browse or search Aave/Morpho/Compound in-app.
- Never show protocol names in UI.
- Never promise fixed returns. Rates are estimated and variable.
- Do **not** put a fake APY on Create goal. Prefer “Add yield later” until Growth is wired.

## Navigation

**Tabs (4):** Home · Savings · Card · Profile  

**Stacks / overlays (back, no new tab):** Add Money, Choose Yield, Send, Receive, Add to savings, New goal, full Activity  

- Mid-flow screens may keep the tab bar if product requires continuity; prefer back for focused flows.
- Activity: Home “Recent activity” + See all → full list. Do not add an Activity tab unless Card is deferred and usage justifies it.

## Savings

### Empty / create (one screen)

1. Free-text **Goal title** only — **no preset title pills/chips**
2. Optional **Add USDC**
3. Primary CTA: **Create goal** (not “Start earning yield”)
4. Optional quiet note: yield comes later from Home → Choose Yield

### Goals list (after ≥1 goal)

- Summary: **Amount**, **APY** (only if yield is allocated / real), **You’ve earned**
- **Add to savings** (USDC into a goal) — only when goals exist
- Goal cards: one at a time (horizontal snap), **1 of N** + dots + swipe hint
- Per-goal CTA: **Add to {title} goal**
- **New goal** secondary

### Do not

- Stack many full goal cards on one viewport
- Use Create goal CTA copy that implies yield has started
- Require a target date on goals

## Home (funded)

- Greeting + calm headline (copy shifts when already earning)
- One overview card with **both** states always visible:
  - **Available balance** (hero) → **Put this to work** + **Choose Yield** when available > $0
  - **Earning yield** → working balance; when > $0 show quiet **Earning** status + **Est. X% APY** (variable; not a promise)
- Prefer APY over “You’ve earned” on Home until earned yield is real from the API
- Send / Receive
- Add money row
- Recent activity empty/list

## Copy tone

- Dollars, not crypto jargon
- Short, confident, non-judgmental
- Disclaimers for yield: variable, not guaranteed — once, not on every line

## Implementation surfaces

- Mobile: `apps/mobile/src/screens/`
- Preview: `apps/marketing/src/components/app-preview/` + shared `preview-chrome.tsx`
- Keep preview and mobile behavior aligned when changing flows

## Before shipping a screen

- [ ] One primary action per state
- [ ] Empty state has one job (no premature Add to savings)
- [ ] Yield language only where yield actually starts
- [ ] Type/spacing/colors match existing chrome tokens
- [ ] Preview gallery updated if the flow is reviewable in browser
