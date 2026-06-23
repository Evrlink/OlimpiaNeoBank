# Olimpia — Design References

**Status:** Draft for founder review  
**Purpose:** Translate visual inspiration into implementation guidance before `apps/marketing` and mobile UI work begin  
**Does not replace:** [`Brand.md`](./Brand.md) (source of truth for copy, palette, fonts, voice)

**Reviewed against:** [`Brand.md`](./Brand.md) · [`Architecture.md`](../architecture/Architecture.md) §3A · [`ScreenInventory.md`](../product/ScreenInventory.md) (M1, A4)

---

## How to use this document

| Layer | File / folder | Role |
|-------|---------------|------|
| **Brand rules** | `Brand.md` | Official colors, fonts, copy, section content |
| **Visual intent** | This document | What to borrow, how it should feel, quality bar |
| **Screenshots** | `references/` (add when ready) | Desktop/mobile examples — optional but high value |
| **Code tokens** | `packages/design-system/` | Implementation (after founder approves this doc) |

**Workflow:** Founder drops reference images into `docs/brand/references/` → annotate in the tables below → approve this doc → implement marketing → founder preview → mobile inherits tokens.

**Structural reference (layout only):** [defied.money](https://defied.money/) — information hierarchy and scrolling simplicity. **Never copy** Defied text, colors, logos, or visuals.

**Product feel shorthand (Brand.md):** Cash App × Revolut × wellness brand for women — simple, supportive, modern, optimistic.

---

## Quality bar (all surfaces)

Implementation should feel:

- **Modern** — clean surfaces, confident whitespace, no clutter
- **Premium** — refined typography, subtle depth, intentional color
- **Feminine** — warm palette, approachable curves, never pink-for-pink’s-sake cliché
- **Approachable** — low anxiety, plain language, human tone

Every screen should **reduce anxiety** (Brand UX principles). Celebrate **progress**, not raw balances.

---

## 1. Hero references

### Intended experience

The hero is the first trust moment. It should answer: *What is this? Who is it for? What do I do next?* — in under five seconds on mobile.

### Structural reference

| Take from defied.money | Apply with Olimpia |
|------------------------|-------------------|
| Clear nav + single primary CTA in header | Logo left · anchor links · plum CTA pill right |
| Strong headline hierarchy above the fold | Eyebrow → H1 → subheads → tagline → CTAs |
| Minimal hero clutter | No carousels, no stock-photo heroes, no crypto charts |
| Immediate product signal below fold | Product Preview mockup directly under Hero (Brand.md §3) |

### Approved copy (Brand.md — do not paraphrase for MVP)

| Element | Content |
|---------|---------|
| Eyebrow | Financial freedom, designed for women. |
| Headline | Your future deserves more than a checking account. |
| Subheadline | Save, spend, and grow your money with confidence. |
| Subheadline (line 2) | Earn yield with your **USDC** → links to `/learn/usdc` |
| Tagline | More choices. More freedom. |
| Primary CTA | **Download the App** → waitlist modal (pre-launch) |
| Secondary CTA | **Learn More** → smooth scroll to `#features` |

### Visual guidance

| Attribute | Direction |
|-----------|-----------|
| **Background** | Primary `#F7F4F1` or soft gradient into secondary `#E8E1DA` — warm, not sterile white |
| **Headline** | Cormorant Garamond — large, editorial, confident; max ~2 lines on mobile |
| **Body / subheads** | Inter — readable, generous line-height (1.5–1.6) |
| **CTAs** | Primary: plum `#6F2B46` fill, white text, pill radius. Secondary: outline or text + arrow |
| **Whitespace** | Generous top/bottom padding; hero breathes — avoid cramming mockup into hero on mobile |
| **Imagery** | No generic fintech stock photos. Optional: subtle abstract shape or none — copy + mockup carry the section |

### Layout breakpoints

| Viewport | Behavior |
|----------|----------|
| **Desktop** | Text left or centered; mockup may appear in Hero or immediately below (Product Preview section) |
| **Tablet** | Stack if needed; maintain headline scale |
| **Mobile** | Single column; eyebrow → H1 → subheads → CTAs full-width; touch targets ≥ 44px |

### Founder review questions

- [ ] Does the hero feel *for women* without stereotype?
- [ ] Is the primary action obvious (Download / waitlist)?
- [ ] Does USDC link feel educational, not scary?

### Structural reference: defied.money hero

**File:** `references/hero/defied-money-hero-reference.png` (founder provided)

| Take from defied.money | Apply with Olimpia |
|------------------------|-------------------|
| Centered hero, generous whitespace | Same layout rhythm |
| Small brand pill above headline | Olimpia pill with plum dot |
| Large bold headline + accent underline on key phrase | Plum + wavy raspberry underline on accent line |
| Single centered subhead paragraph | Combined lead copy |
| Primary + secondary CTA row, centered | Download + Learn More |
| Gray stage with phone emerging below fold | `#ebe6e1` stage, phone crop |
| Nav: logo left · links center · CTA right | Same grid nav |

| Do NOT copy | Use instead |
|-------------|-------------|
| Blue palette | Plum `#6F2B46`, cream `#F7F4F1` |
| Defied copy / euro messaging | Brand.md approved copy |
| Defied logo | Olimpia wordmark |

**Screenshot slots:** `references/hero-desktop.png` · `references/hero-mobile.png`

---

## 2. Typography references

### Type system (Brand.md — mandatory)

| Role | Font | Usage |
|------|------|--------|
| **Headings** | Cormorant Garamond | H1–H3, section titles, card titles, wordmark |
| **Body** | Inter | Paragraphs, UI labels, buttons, FAQ, nav links |

### Scale (implementation guidance — tune in design-system)

Use a **modular scale** — editorial headings, calm body. Suggested starting points (founder to confirm):

| Token | Desktop | Mobile | Notes |
|-------|---------|--------|-------|
| **Display / H1** | 48–56px | 36–40px | Hero headline only |
| **H2 (section)** | 36–40px | 28–32px | Built Around Real Life, Features, etc. |
| **H3** | 24–28px | 20–24px | Card titles, FAQ questions |
| **Body large** | 18–20px | 17–18px | Hero subheads |
| **Body** | 16–17px | 16px | Default paragraph |
| **Small / caption** | 13–14px | 13–14px | Earnings lines, legal, badges |
| **Eyebrow** | 12–13px, uppercase or small caps, letter-spacing +0.05em | Same | “Financial freedom, designed for women.” |

### Typography rules

| Do | Don’t |
|----|-------|
| Pair Cormorant display with Inter UI | Mix more than two families |
| Use weight contrast (Cormorant 500–600, Inter 400–600) | Ultra-thin hairlines on small text |
| Left-align long copy; center optional for hero only | Center-align dense paragraphs |
| Limit line length ~60–75 characters on desktop | Full-bleed text edge-to-edge on wide screens |
| Use sentence case for UI | ALL CAPS body text |

### Inspiration (feel, not copy)

| Brand | Take | Leave |
|-------|------|-------|
| **Glossier** | Soft editorial headlines, airy spacing | Beauty-specific imagery |
| **Apple** | Hierarchy clarity, restraint | Cold minimalism |
| **Alo Yoga** | Warm premium wellness tone | Athletic lifestyle photography |

**Screenshot slots:** `references/typography-scale.png`

---

## 3. Layout references

### Marketing page rhythm (Architecture §3A · Brand.md site structure)

Single scrolling landing page. Section order is **fixed**:

```
Navigation → Hero → Product Preview → Built Around Real Life → Pia →
Trusted Infrastructure → Features → How It Works → FAQ → Final CTA → Footer
```

### Page-level layout principles

| Principle | Spec |
|-----------|------|
| **Max content width** | ~1120–1200px centered; sections full-bleed background optional |
| **Section padding** | Vertical: 80–120px desktop · 48–64px mobile |
| **Horizontal padding** | 24px mobile · 40–48px tablet · auto center on desktop |
| **Grid** | 12-column mental model; cards snap to 4 / 2 / 1 columns by breakpoint |
| **Nav** | Sticky optional; must not obscure hero on load; compact on mobile (hamburger acceptable if anchor links preserved) |
| **Anchors** | Smooth scroll to `#features`, `#how-it-works`, `#faq`, `#preview`, `#pia`, `#real-life`, `#infrastructure` |

### Section density

| Do | Don’t |
|----|-------|
| One idea per section | Multi-topic walls of text |
| Scannable headings + short blocks | Long manifestos (Brand.md) |
| Clear visual separation between sections | Identical stacked white blocks with no rhythm |
| Conversion CTAs at hero, nav, and final section | CTA only in footer |

### `/learn/usdc` layout

- Same nav/footer pattern as M1 where possible
- One H1; H2 per education topic (Architecture §3A)
- Narrow reading column (~680px) for long-form comfort
- Optional CTA back to home / download at bottom

**Screenshot slots:** `references/layout-desktop-full.png` · `references/layout-mobile-full.png` · `references/nav-sticky.png`

---

## 4. Card design references

Cards are the primary visual language for goals, features, and product UI previews. They should feel like **real app UI**, not marketing illustration (Brand.md · ScreenInventory M1).

### Goal cards — Built Around Real Life (`#real-life`)

**Headline:** Money goals that look like your life.

| Attribute | Direction |
|-----------|-----------|
| **Layout** | Desktop: 4-up · Tablet: 2×2 · Mobile: stacked |
| **Surface** | Secondary background `#E8E1DA` or white card on `#F7F4F1` with soft shadow |
| **Radius** | 12–16px — rounded, friendly |
| **Content** | Goal name · target amount · progress bar · % · monthly earnings line |
| **Progress bar** | Subtle fill in plum/berry/raspberry family; not neon |
| **Emoji** | Light use (✈️ 💼 🏡 💜) per approved examples — optional at implementation |

**Approved demo data (Brand.md):**

| Card | Goal | Progress | Earnings |
|------|------|----------|----------|
| Girls Trip Fund | $2,500 | 72% | +$18 earned this month |
| Business Launch Fund | $10,000 | 41% | +$63 earned this month |
| First Home Fund | $25,000 | 29% | +$112 earned this month |
| Financial Freedom Fund | $50,000 | 18% | +$247 earned this month |

### Feature pillar cards (`#features`)

Five cards: **Save · Spend · Grow · Learn · Own** — icon + headline + one short line. Match Defied **scannability**, not Defied content.

### Pia conversation card (`#pia`)

Large **messaging-style** bubble/card — warm, encouraging. **Static preview only** on the marketing site (no live chat, no API calls).

**MVP rule (founder confirmed):** Website = static preview that sells the vision · Mobile app = fully functional Pia (Architecture §12B).

### Product Preview mockup (`#preview`)

Must showcase: balance · growth · goal progress · Send · Add Money · (Request Money optional in mock). **Lead with growth and confidence**, not payment buttons.

### Card anti-details (within card section)

- No budgeting-app pie charts as hero art
- No corporate stock icons
- No childish illustrations
- No dark glassmorphism / crypto dashboard cards

**Screenshot slots:** `references/cards-goals-desktop.png` · `references/cards-goals-mobile.png` · `references/cards-features.png` · `references/pia-message-card.png`

---

## 5. Dashboard references

Dashboard guidance applies to **mobile app Home (A4)** and the **Product Preview mockup** on the marketing site. Same visual language — different fidelity.

### Product principle (ScreenInventory · UserFlows)

Home is a **personal guide**, not a traditional bank dashboard. **Progress and momentum** over raw balance as hero.

### Dynamic states (A4 — behavior drives layout emphasis)

| State | Hero emphasis | Primary CTAs |
|-------|---------------|--------------|
| **New User** | “Let’s get started” | Add Money · Ask Pia |
| **Funded User** | “Your money is ready” | Create Goal · Growth Account · Ask Pia |
| **Goal Builder** | Featured goal + progress % | Add to goal · View goal · Ask Pia |
| **Growth User** | Growth earnings summary | View Growth · Add to Growth · Ask Pia |
| **Mature User** | Progress headline + goal + growth | Review progress · Ask Pia |

**De-emphasize** on early states: Send · Receive as primary · balance-as-hero.

### Example copy direction (UserFlows §4)

```
Hi Sarah ✨
You're making progress.
Girls Trip Fund 43%
```

### Dashboard visual guidance

| Element | Direction |
|---------|-----------|
| **Greeting** | Personal, warm — optional ✨ sparingly |
| **Headline** | Cormorant or large Inter semibold — outcome language |
| **Progress** | Bars and % like goal cards — consistent component |
| **Balance** | Present but secondary until mature state; `$` formatting, two decimals |
| **Quick actions** | Pill or icon row — Add · Send · Receive · Ask Pia |
| **Activity list** | Plain-language labels; no blockchain hashes |
| **Empty states** | Friendly forward path — never blank ledger wall |

### Marketing mockup vs. real app

| Surface | Fidelity |
|---------|----------|
| **M1 Product Preview** | Static image or lightweight HTML mock — may show “ideal” mature state |
| **A4 Home** | Live data, state-aware — implement shared card/progress components from design-system |

**Screenshot slots:** `references/dashboard-mock-mature.png` · `references/dashboard-new-user.png` · `references/dashboard-goal-builder.png`

---

## 6. Motion references

Brand.md does not specify a motion system. This section defines **default guidance** for founder review.

### Philosophy

Motion should feel **calm and supportive** — never flashy, never “crypto trading app.”

| Do | Don’t |
|----|-------|
| Subtle fade/slide on section reveal (marketing) | Parallax, scroll-jacking |
| Smooth scroll to anchors (~400–600ms) | Bouncy spring overshoot |
| Modal fade + scale (waitlist) | Aggressive full-screen transitions |
| Progress bar fill animation on load (goal cards) | Constant looping animations |
| Haptic feedback on mobile success (app) | Shake animations on errors |
| Reduced-motion media query — respect `prefers-reduced-motion` | Auto-play video backgrounds |

### Marketing site

| Interaction | Motion |
|-------------|--------|
| Nav anchor scroll | Smooth scroll |
| Waitlist modal open/close | Fade + slight scale (8px) |
| FAQ accordion | Height transition 200–250ms ease |
| CTA hover | Background darken 5–8%; no lift shadow drama |
| Page load | Optional staggered fade for hero text — max 300ms delay total |

### Mobile app (future)

| Interaction | Motion |
|-------------|--------|
| Tab switch | Cross-fade or subtle slide |
| Stack push/pop | Platform-native (iOS/Android) |
| Inline money states | Text cross-fade pending → processing → complete |
| Success moments | Gentle confetti or checkmark — Brand celebration system |

**Explicit avoid (Brand.md):** Excessive animation or parallax.

**Screenshot / ref slots:** `references/motion-waitlist-modal.mp4` (optional) · note reduced-motion fallback in implementation

---

## 7. Mobile references

### Marketing site (responsive web)

| Requirement | Spec (Architecture §3A) |
|-------------|---------------------------|
| **Approach** | Mobile-first CSS |
| **Touch targets** | ≥ 44×44px for buttons, nav, FAQ, modal |
| **Typography** | Scale down per §2; no horizontal scroll |
| **Navigation** | Logo + hamburger or condensed links; Download CTA always reachable |
| **Cards** | Single column stack |
| **Mockup** | Centered; max-width ~320–375px frame |
| **Footer** | Compact; legal links stacked |
| **Modal** | Full-width on small screens; safe-area insets |

### React Native app (iOS + Android)

| Requirement | Spec |
|-------------|------|
| **Platform** | Single RN codebase; parity on both platforms |
| **Safe areas** | Respect notches and home indicators |
| **Tab bar** | 4 tabs: Home · Savings · Card · Profile |
| **Thumb zone** | Primary actions in lower half where possible |
| **Biometric gates** | Send, withdraw, CVV reveal — native patterns |
| **Type** | Same tokens as web; adjust sizes for mobile density |

### Breakpoints (marketing — suggested)

| Name | Width | Layout notes |
|------|-------|--------------|
| **Mobile** | &lt; 640px | Stack all; hamburger nav optional |
| **Tablet** | 640–1024px | 2-column cards |
| **Desktop** | &gt; 1024px | Full section layouts |

**Screenshot slots:** `references/mobile-hero.png` · `references/mobile-nav.png` · `references/mobile-faq.png` · `references/app-home-ios.png`

---

## 8. Anti-patterns — what Olimpia should never look like

### Visual

| Never | Why |
|-------|-----|
| Dark-mode-only crypto aesthetic | Conflicts with warm, approachable brand |
| Neon greens, laser gradients, “Web3” purple | Reads as trading/speculation |
| Meme coins, rocket ships, diamond hands | Not our user |
| Generic blue corporate bank UI | Cold, masculine, traditional |
| Stock photos of businessmen shaking hands | Cliché, exclusionary |
| Childish clipart or overly cute mascots | Undermines financial trust |
| Dense terminal-style numbers and charts | Anxiety, crypto leakage |
| Glassmorphism over dark blur | 2021 crypto dashboard trope |
| Copying Defied colors, logos, copy, or layouts | Legal/brand risk — structure only |

### Typography & copy

| Never | Why |
|-------|-----|
| APY optimization, yield farming, DeFi, liquidity | Banned vocabulary (Brand.md) |
| ALL CAPS SHOUTING in body | Aggressive finance tone |
| Jargon without plain-language layer | Breaks neobank positioning |
| Fake performance guarantees | Trust and compliance risk |

### UX

| Never | Why |
|-------|-----|
| Balance as only hero on first visit | ScreenInventory state model |
| Blank empty states with no CTA | UserFlows — always forward path |
| Hidden fees / surprise crypto steps | Wrapper model — invisible infrastructure |
| Live Pia chat on marketing site | Architecture — static preview only |
| Keyword-stuffed SEO blocks | Architecture §3A |
| FAQ answers only in images | SEO + accessibility failure |

### Brand personality failures (Brand.md)

Should **never** feel: corporate · cold · intimidating · condescending · technical · masculine · judgmental.

### Inspiration to avoid

Traditional banks · trading platforms · crypto exchanges · aggressive finance brands · dark-mode-only products.

---

## Color quick reference (Brand.md)

| Token | Hex | Use |
|-------|-----|-----|
| Primary background | `#F7F4F1` | Page canvas |
| Secondary background | `#E8E1DA` | Cards, sections |
| Primary text | `#2F2F2F` | Body copy |
| Plum (primary brand) | `#6F2F46` | CTAs, key accents |
| Deep berry | `#8B2F5D` | Secondary accents |
| Raspberry | `#C73E72` | Highlights, sparingly |
| Success | `#5B8A72` | Positive states, earnings |

**Accessibility:** All text combinations must meet **WCAG AA** (Architecture §3A).

---

## Reference image folder (optional — add before build)

```
docs/brand/references/
├── hero/
├── typography/
├── layout/
├── cards/
├── dashboard/
├── motion/
└── mobile/
```

When adding screenshots, update the tables in each section above with **Take / Avoid / Olimpia override** notes.

---

## Implementation mapping (after approval)

| DesignReferences section | Primary code home |
|----------------------------|-------------------|
| Typography · Color | `packages/design-system/` |
| Cards · Buttons · Nav | `packages/ui/` |
| M1 landing · `/learn/usdc` | `apps/marketing/` |
| A4 dashboard · app screens | `apps/mobile/` |

---

## Founder approval checklist

Before `apps/marketing` implementation begins:

- [ ] Hero direction approved (§1)
- [ ] Typography scale confirmed or adjusted (§2)
- [ ] Section order and spacing feel approved (§3)
- [ ] Goal card style approved (§4)
- [ ] Product Preview / dashboard mock direction approved (§5)
- [ ] Motion level approved — calm default (§6)
- [ ] Mobile responsive rules accepted (§7)
- [ ] Anti-patterns acknowledged (§8)
- [ ] Reference screenshots added (optional) or waived
- [x] Pia marketing treatment confirmed: **static preview on web; fully functional in mobile app**

**Sign-off:** ___________________ **Date:** ___________

---

*End of DesignReferences.md — draft for founder review*
