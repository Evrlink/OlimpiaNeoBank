# Olimpia — Design Input (Phase 2 Mobile)

**Status:** Active — mirrors approved preview + [`MobilePhase2ScreenBrief.md`](MobilePhase2ScreenBrief.md)  
**Scope:** Phase 2 mobile app screens — design concepts only (no backend, no live Pia, no funding integration)  
**Visual source of truth:** `apps/marketing/src/styles.css` · `docs/design/MobilePhase2ScreenBrief.md`  
**Preview components:** `apps/marketing/src/components/app-preview/` · routes `/app-preview/*`  
**Ignore:** `packages/design-system/tokens.css` (stale, unwired)

---

## 1. Product summary

Olimpia is a women-first neobank mobile app that helps users save, spend, and grow their money with confidence. Phase 2 covers auth, onboarding, and the app shell: a calm empty Home, four-tab navigation, and a Profile screen with a static Pia “Coming Soon” teaser. The experience should feel like the Olimpia marketing brand — warm, premium, approachable — not a generic fintech dashboard.

---

## 2. Screens to design

Design these as **native mobile screens** (iOS + Android parity). Light theme only.

| # | Screen | Notes |
|---|--------|-------|
| 1 | **Welcome** | Pre-auth. Static rose→raspberry gradient on `#F7F4F1`. Pill CTAs pinned above safe area. |
| 2 | **Sign up / Login** | Single auth flow; mode from entry path. Privy-style fields; back to Welcome. |
| 3 | **“You're in!” confirmation** | Post sign-up only. Pia-free. Full reassurance layout per §3.3 brief. Preview: `/app-preview/youre-in`. |
| 4 | **Add Funds** | Shared stub — same layout from onboarding **Add funds and start earning** and Home **Add money**. |
| 5 | **Empty Home** | State 1 new user. Headline + Add money card are hero; balance is quiet `$0.00` line. |
| 6 | **Savings empty state** | Centered EmptyState inside tab shell. |
| 7 | **Card empty state** | Same EmptyState pattern as Savings. |
| 8 | **Profile** | Account header + static Pia Coming Soon card + settings rows + Sign out. |

**Tab shell (Home · Savings · Card · Profile):** White or `#F7F4F1` bar, `#E8E1DA` top border, active tab raspberry icon + label, inactive ink-muted ~70% opacity. Height ~56pt + safe area.

---

## 3. Approved user flow

```
Welcome
  ├─ Get started → Sign up
  │     └─ Account sync → “You're in!” [no Pia]
  │           ├─ Add funds and start earning → Add Funds → Back
  │           └─ Explore the app → Empty Home [tabs visible]
  └─ Sign in → Auth
        └─ Account sync → Empty Home [skip “You're in!”]

Empty Home ↔ Tabs: Savings · Card · Profile
Empty Home “Add money” → Add Funds (same screen as onboarding)
Profile → Sign out → Welcome

Pia: Profile Coming Soon card ONLY — no tab, no screen, no chat
```

---

## 4. Exact 8-color palette

From `apps/marketing/src/styles.css` / Mobile Phase 2 brief §1.1.

| Role | Hex | Usage |
|------|-----|-------|
| **Background** | `#F7F4F1` | App shell, screen backgrounds |
| **Surface** | `#E8E1DA` | Muted fills, progress tracks, borders, inputs |
| **Card** | `#FFFFFF` | Elevated cards, optional tab bar |
| **Ink** | `#2F2F2F` | Headlines, body, labels |
| **Ink muted** | `#6B6B6B` | Secondary copy, inactive tabs, quiet balance |
| **Raspberry** | `#E54B7A` | Primary buttons, active tab, links, focus rings |
| **Plum / Berry** | `#6F2B46` | Wordmark, secondary depth accents |
| **Rose** | `#FBDDE6` | Icon circles, warm accent surfaces |

**Supporting (mobile only, not in core 8):** Berry dark `#C73E72` — pressed states on raspberry elements only.

**MVP:** Light-only. No dark mode.

---

## 5. Typography rules

| Role | Font | Rule |
|------|------|------|
| **Default UI** | **Inter** (400, 500, 600) | All body, buttons, inputs, tabs, labels, Pia bubble text, settings rows |
| **Headline** | **Inter semibold** (600) | Welcome headline — all words except the Cormorant accent phrase |
| **Display accent** | **Cormorant Garamond** italic 400 | **Welcome only:** italic on *everything your bank can't do.* in headline; optional Cormorant “Olimpia” wordmark on Welcome / Profile / You're in |
| **Eyebrow** | Inter semibold uppercase | `tracking ~0.18em`, raspberry — Welcome only |

**Font loading (match marketing site):** Load Google Fonts — `Inter:wght@400;500;600` and `Cormorant+Garamond:ital,wght@0,400;0,500;1,400` (same as `apps/marketing/src/routes/__root.tsx`). Never combine `font-semibold` / `font-bold` with Cormorant.

**Shape:** Primary buttons = full pill, 48–56pt height. Cards = 16–24px radius. Inputs = 12px radius.

---

## 6. Exact approved copy

Use verbatim. Do not paraphrase. Full A3 detail in brief §3.3.

### Welcome

| Element | Copy |
|---------|------|
| Eyebrow | Financial freedom, designed for women |
| Headline | Better than a checking account, everything your bank can't do. |
| Subhead | Save, spend, and grow your money with confidence. |
| Tagline | More choices. More freedom. |
| Primary CTA | Get started |
| Secondary CTA | Sign in |

### Sign up / Sign in

See brief §3.2 placeholder tables.

### “You're in!” confirmation (founder approved)

| Element | Copy |
|---------|------|
| Headline | You're in! |
| Subhead (line 1) | Simple access to decentralized finance |
| Subhead (line 2) | so you can save, grow, and reach your goals. |
| Value prop 1 | **Earn yield** — Your money can grow over time. |
| Value prop 2 | **Set goals** — Create savings goals for what matters most. |
| Value prop 3 | **You're in control** — Move your money anytime, always your choice. |
| Step 1 | **Add USD** — Add funds from your bank. |
| Step 2 | **Convert to USDC** — Convert to USDC, earn yield. |
| Step 3 | **Earn and access** — USDC earns the yield. Cash out to your bank any time. |
| Built for you | No lock ups · Withdraw anytime · Full transparency |
| Primary CTA | Add funds and start earning |
| Secondary CTA | Explore the app |
| Footer | Olimpia provides access to third party financial services. Yield is variable and not guaranteed. |

*Uses onboarding-education copy tier (brief §1.4) — USDC, yield, bank, decentralized finance allowed on A3 only.*

### Add Funds

| Element | Copy |
|---------|------|
| Title | Add funds |
| Body | Choose how you'd like to add funds to your Olimpia balance. |
| Primary action | Continue |

### Empty Home

| Element | Copy |
|---------|------|
| Greeting | Hi {firstName} ✨ |
| Headline | Let's get started. |
| Subhead | Add funds to begin building toward the life you choose. |
| Primary CTA | Add money |
| Balance | Money available · $0.00 |
| Quick actions | Send · Receive |
| Goal placeholder | Your first savings goal will appear here |
| Growth placeholder | Growth earnings will show here when you're ready |
| Activity empty | No activity yet · Your first deposit will show up here |

### Savings / Card / Profile / Bottom tabs

See [`MobilePhase2ScreenBrief.md`](MobilePhase2ScreenBrief.md) §3.4–3.7.

---

## 7. Copy tiers (brief §1.4)

| Tier | Screens | Language |
|------|---------|------------|
| **Neobank default** | Welcome, Auth, Home, Savings, Card, Profile, Add funds stub | No DeFi/USDC/wallet/Bridge in user-facing copy |
| **Onboarding education** | **You're in! (A3) only** | USD, USDC, yield, bank, decentralized finance OK + disclaimer |
| **Marketing website** | `/`, `/learn/usdc`, FAQ | Educational DeFi/USDC unchanged |

---

## 8. Pia rules (non-negotiable)

- Pia appears **only** on **Profile** as a static **Coming Soon** card.
- **One** incoming message bubble — Pia’s text only.
- **No Pia** on Welcome, Auth, “You're in!”, Home, Savings, Card, Add Funds, or bottom nav.
- Avatar: `apps/marketing/src/assets/pia-raspberry.png`.

---

## 9. Add Funds rules

- **One shared screen** for onboarding **Add funds and start earning** and Home **Add money**.
- Stub copy: title **Add funds**, body **Choose how you'd like to add funds to your Olimpia balance.**, button **Continue**.
- **Do not show or name on stub:** bank account, debit card, Bridge, USDC, Base, wallet.
- *(Exception: A3 confirmation screen may name USDC/yield/bank — not the Add funds stub.)*

---

## 10. Must-not-do list

- **No fake balances** beyond quiet *Money available · $0.00*.
- **No fake card data** on Card tab.
- **No crypto language by default** — banned on neobank-tier screens (brief §1.4). **Exception:** A3 onboarding-education tier.
- **No live Pia** — static Profile card only.
- **No bank-linking UI** beyond Add Funds placeholder.
- **No dark mode** for MVP.
- **No Pia** outside Profile.

---

*Derived from MobilePhase2ScreenBrief.md (approved), Brand.md, and apps/marketing preview components.*
