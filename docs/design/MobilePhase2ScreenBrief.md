# Olimpia — Mobile Phase 2 Screen Design Brief

**Version:** 2.0  
**Status:** **Approved** — all founder design decisions complete (no open questions)  
**Scope:** Build Plan Phase 2 — first implementation screens only  
**Source of truth:** [Brand.md](../brand/Brand.md) · [PRD.md](../product/PRD.md) (v1.10) · [BuildPlan.md](../build/BuildPlan.md) (v1.1) · [Architecture.md](../architecture/Architecture.md) · [UserFlows.md](../product/UserFlows.md) · [NavigationMap.md](../product/NavigationMap.md) · Marketing site (`apps/marketing`)

**Out of scope for this brief:** Code, backend files, live Pia chat, separate Pia screen or tab, product scope changes.

---

## Purpose

Translate the approved Olimpia brand system from the marketing website into a **native mobile experience** for Phase 2 (Auth, shell & onboarding). The app must feel like the same brand — calm, optimistic, polished, women-first — without copying the marketing site layout one-to-one.

**Phase 2 screens covered:**

1. Welcome  
2. Sign up / Login (Auth)  
3. Onboarding (post-auth first-run moment)  
4. Empty Home dashboard  
5. Bottom navigation  
6. Profile (with static Pia “Coming Soon” card)

---

## 1. Brand colors and typography rules (from repo)

### 1.1 Color palette

**Mobile theme (founder approved)** — aligned with `apps/marketing/src/styles.css`:

| Token | Hex | Usage |
|-------|-----|-------|
| Primary background | `#F7F4F1` | App shell, screen backgrounds |
| Secondary background / surface | `#E8E1DA` | Section fills, muted areas, progress track |
| Primary text | `#2F2F2F` | Headlines, body, labels |
| Muted text | `#6B6B6B` | Secondary lines, inactive tab labels |
| Card | `#FFFFFF` | Elevated cards, tab bar (optional) |
| Plum / Berry | `#6F2B46` | Wordmark, secondary CTAs, depth accents |
| Deep berry | `#8B2F5D` | Reserved — use sparingly |
| **Raspberry (primary accent)** | **`#E54B7A`** | Primary buttons, active tab, focus rings, joy accents, links — **matches marketing site** |
| Berry dark (supporting) | `#C73E72` | Darker berry shade — pressed states, subtle emphasis, depth on raspberry elements (Brand.md accent, used as secondary) |
| Raspberry soft | `#F08BA9` | Gradients, soft fills |
| Rose | `#FBDDE6` | Warm accent surfaces, icon circles |
| Rose soft | `#FCEEF2` | Large washes, hero backgrounds |
| Success | `#5B8A72` | Positive amounts, completion |
| Border / input | `#E8E1DA` | Borders, input outlines |

**Raspberry usage rule:** Default interactive accent is `#E54B7A`. Use `#C73E72` only as a supporting darker berry — e.g. button pressed state, gradient stop, or subtle text emphasis — not as the primary CTA fill.

**Brand.md reference:** Brand.md lists accent raspberry as `#C73E72`. For mobile Phase 2, the founder confirmed **`#E54B7A` as primary** (marketing parity) with **`#C73E72` as supporting berry dark**.

**Marketing CSS mapping** (`styles.css`):

| CSS variable | Mobile token | Hex |
|--------------|--------------|-----|
| `--background` | background | `#F7F4F1` |
| `--surface` | surface | `#E8E1DA` |
| `--foreground` / `--ink` | ink | `#2F2F2F` |
| `--ink-muted` | ink-muted | `#6B6B6B` |
| `--berry` | berry | `#6F2B46` |
| `--deep-berry` | deep-berry | `#8B2F5D` |
| `--raspberry` | **raspberry** | **`#E54B7A`** |
| — | **berry-dark** | **`#C73E72`** |
| `--raspberry-soft` | raspberry-soft | `#F08BA9` |
| `--rose` | rose | `#FBDDE6` |
| `--rose-soft` | rose-soft | `#FCEEF2` |
| `--success` | success | `#5B8A72` |
| `--card` | card | `#FFFFFF` |
| `--border` / `--input` | border | `#E8E1DA` |
| `--ring` | ring | `#E54B7A` |

**Shadows (marketing — adapt for mobile elevation):**

- `--shadow-soft`: warm tint, subtle lift  
- `--shadow-card`: raspberry-tinted card shadow (`rgb(229 75 122 / 0.18)` at largest spread)

**Selection highlight:** `--rose` background, `--raspberry` text (web only; not required on mobile).

### 1.2 Typography

**Font families** (Brand.md + `styles.css`):

| Role | Font | Mobile rule |
|------|------|-------------|
| UI, body, buttons, nav, labels | **Inter** | Default for all interactive and readable text |
| Display accents, wordmark, occasional headline emphasis | **Cormorant Garamond** (`font-display`) | Sparingly — not for dense UI |

**Cormorant Garamond usage rules** (founder approved — mobile Phase 2):

- **Required only for:** (1) Olimpia wordmark on Welcome and optional Profile header · (2) italic *yours.* in the Welcome headline  
- **Inter for every other mobile UI element** — auth, tabs, buttons, inputs, body copy, Pia message text, settings rows  
- **Do not** use Cormorant for buttons, inputs, tab bar, list rows, or Pia bubble body text  
- **Do not** use a system serif fallback unless the custom font **fails to load** (error/fallback path only)

**Font loading (implementation — Phase 2):**

- Bundle and load **Inter** and **Cormorant Garamond** before rendering Welcome (and Profile if wordmark shown)  
- Preload or block first paint on auth/onboarding stack until fonts are ready — **no visible font swap (FOUT/FOIT)** on wordmark or *yours.*  
- Apply to React Native via bundled assets (e.g. `expo-font` / `react-native-asset` pattern) — document in mobile app setup, not in this brief’s scope beyond requirement

**Legacy marketing rule (still applies):** Optional italic accent on **one joy word** in a headline — never whole sentences. Welcome headline uses this for *yours.* only in Phase 2.

**Inter usage:** Everything else — auth forms, tab labels, body copy, settings rows, empty states.

**Marketing type scale** (`styles.css` @theme — adapt proportionally for mobile):

| Token | Size | Line height | Typical mobile use |
|-------|------|-------------|-------------------|
| `display-md` | 2.75rem (44px) | 1.08 | Welcome hero headline (large phones) |
| `h1` | 2.25rem (36px) | 1.15 | Welcome headline (compact) |
| `h2` | 1.75rem (28px) | 1.2 | Onboarding step titles |
| `h3` | 1.375rem (22px) | 1.3 | Card titles, Profile name |
| `body-lg` | 1.125rem (18px) | 1.6 | Welcome subcopy, onboarding body |
| `body` | 1rem (16px) | 1.6 | Default body (minimum for readable mobile copy) |
| `body-sm` | 0.875rem (14px) | 1.55 | Helper text, tab labels, secondary lines |
| `caption` | 0.75rem (12px) | 1.5 | Timestamps, legal footnotes |
| `label` | 0.6875rem (11px) | 1.4 | Uppercase eyebrows (`tracking-[0.18em]`) |

**Eyebrow pattern** (marketing `.marketing-eyebrow`): Inter semibold, uppercase tracking ~0.18em, raspberry color — use on Welcome only in Phase 2.

**Letter-spacing:** Display/headline tokens use slight negative tracking (`-0.01em` to `-0.02em`).

### 1.3 Shape, radius, and density

From marketing implementation:

| Element | Radius | Notes |
|---------|--------|-------|
| Primary buttons | `rounded-full` (pill) | Height 48–56pt tap target |
| Cards | `rounded-2xl` (16px) to `rounded-[32px]` | Profile sections, Pia card |
| Inputs | `rounded-xl` (12px) or `rounded-md` (12px base `--radius: 0.75rem`) | Match marketing input feel |
| Icon action circles | `rounded-full` on `bg-rose/70` | Quick actions (future Home states) |
| Progress bars | `rounded-full`, height ~6pt | Raspberry fill on surface track |

**Spacing rhythm:** Marketing uses `section-pad` 3–5rem vertical; mobile screens use **16px horizontal padding** (aligns with phone mockup `px-6`), **24–32px** between major blocks, **12–16px** inside cards.

### 1.4 Brand voice and in-app copy (Phase 2 — founder approved)

**Mobile app is the source of truth** for in-app language: simple, consumer-friendly **neobank** framing — not crypto, DeFi, or protocol vocabulary.

**Preferred in-app language (examples):**

- Add funds  
- Your balance  
- Save · Spend · Grow your money  
- Savings goals  
- Financial confidence  

**Banned from Phase 2 app UI** (Welcome, Auth, onboarding, Home, Savings, Card, Profile, Add funds screen):

- crypto · DeFi · Base · USDC · wallet · yield · blockchain · protocol  
- (Also per Add funds screen: bank account, debit card, Bridge — user-facing Phase 2 stub)

**Marketing website:** May continue educational content on USDC, decentralized finance, and how Olimpia works where appropriate (`/learn/usdc`, FAQ, etc.). **Do not change marketing copy** as part of mobile Phase 2 implementation. App copy does not need to mirror marketing DeFi-forward hero language.

**Tone rules:**

- Friendly, clear, encouraging — never judgmental or technical  
- Tagline: **More choices. More freedom.**  
- Playfulness: **6/10** — light sparkle in greeting acceptable (✨); no meme tone  
- Funds belong to the **user** — *your balance*, *your Olimpia balance*; never imply Olimpia owns user money

### 1.5 Theme — light-only MVP (founder approved)

**Olimpia MVP is light-only.** Do not design, build, document, or test a dark-mode theme for MVP. Dark mode may be evaluated **after launch** as a future enhancement.

**Approved warm light theme (Phase 2):**

| Token | Hex / treatment |
|-------|-----------------|
| Background | `#F7F4F1` |
| Primary raspberry | `#E54B7A` |
| Supporting berry dark | `#C73E72` |
| Cards | `#FFFFFF` |
| Surfaces | Warm neutrals — `#E8E1DA` surface, `#FBDDE6` / `#FCEEF2` rose washes per §1.1 |

**Out of scope for MVP:** dark palette tokens · `prefers-color-scheme` theming · dark screenshots · dark-mode QA matrix

---

## 2. Marketing-site components to inspire mobile components

Use these as **visual DNA**, not layout templates.

| Marketing source | Mobile component inspired | What to carry over |
|------------------|---------------------------|-------------------|
| **Nav** (`index.tsx` — sticky header, pill CTA) | Welcome primary CTA | Pill-shaped berry/raspberry button, Inter semibold, soft shadow |
| **Hero** (eyebrow + headline + dual CTAs) | Welcome screen | Approved mobile headline: Inter + Cormorant italic on *yours.* only; eyebrow, subhead, tagline per §3.1 |
| **HeroPaperBackground** + gradient washes | Welcome background only | Approved: static rose→raspberry radial wash on `#F7F4F1` — **no WebGL** (marketing paper shader is web-only) |
| **WaitlistModal** | Auth form container | `rounded-[32px]` card, generous padding, inline validation errors |
| **StayTunedSection** success state | Auth success / onboarding confirmation | Rose-soft icon circle + reassuring confirmation copy |
| **Card** (`ui/card.tsx`) | Profile sections, Pia Coming Soon card | White card, light border, soft shadow |
| **PhoneMockup** — goal card | Future goal rows; empty Home placeholder | Progress bar (surface track, raspberry fill), goal name + % |
| **PhoneMockup** — quick action circles | Empty Home quick actions (disabled/placeholder OK in Phase 2) | Rose circle + raspberry icon, label below |
| **PhoneMockup** — balance card (dark) | **Defer to Phase 3** — empty Home should not lead with dark balance hero | Note for later: inverted card is marketing preview only for funded state |
| **GoalsSection / EmpoweringCards** feature cards | Onboarding benefit bullets (if used) | Icon in raspberry ring circle, Inter headings |
| **PiaSection + ChatPreview** | Profile Pia “Coming Soon” card only | Messaging-style card shape, Pia avatar — **one static incoming bubble only**; no user bubble, no input bar |
| **FAQ accordion** | Profile settings rows (future) | Dividers, chevrons — not needed in Phase 2 beyond sign out row |
| **SiteFooter** | Profile support / legal links | Muted ink text, raspberry link accent |
| **Button** (`ui/button.tsx`) | All CTAs | Primary = raspberry fill; outline = border + card bg; ghost for tertiary |
| **Input** (`ui/input.tsx`) | Auth email/phone/OTP fields | Border `#E8E1DA`, focus ring raspberry |

**Do not import from marketing:**

- 5-tab phone mockup navigation (Home · Card · Save · Pia · Learn) — **product uses 4 tabs** per PRD  
- Pia bubble on Home dashboard in hero mockup — **Pia is Profile-only Coming Soon in Phase 2**  
- Dark `#111` balance card as empty-state hero — conflicts with calm, anxiety-reducing empty Home  
- DeFi-forward hero copy on current marketing homepage — **app uses neobank copy per §1.4**; marketing site unchanged

---

## 3. Screen-by-screen layout notes

### 3.1 Welcome

**Route:** Pre-auth stack root (A1)  
**Reference:** Marketing Hero + Stay Tuned emotional tone; **not** full marketing hero layout  

**Scope note:** Welcome copy below is **mobile Phase 2 only**. The marketing website hero headline and copy remain unchanged (`apps/marketing`).

**Approved copy (founder):**

| Element | Copy | Typography |
|---------|------|------------|
| Eyebrow | Financial freedom, designed for women | Inter semibold, uppercase, tracking ~0.18em, raspberry |
| Headline | Money that feels like yours. | **Inter:** *Money that feels like* · **Cormorant Garamond italic:** *yours.* |
| Subhead | Save, spend, and grow your money with confidence. | Inter body-lg, ink-muted |
| Tagline | More choices. More freedom. | Inter body-sm, raspberry |
| Primary CTA | Get started | Inter, raspberry pill button |
| Secondary CTA | Sign in | Inter, ghost/text button |

**Headline typography rule:** Cormorant Garamond italic applies **only** to the word *yours.* (including its period). All other headline words use Inter. Optional raspberry accent on *yours.* per marketing joy-word pattern — default to foreground ink if contrast testing prefers.

**Approved visual direction (founder — mobile Phase 2 Welcome only):**

Abstract **static gradient only**. The background supports the approved copy and CTA stack — it never competes with the headline.

| Use | Detail |
|-----|--------|
| **Base** | `#F7F4F1` (primary background) — full screen |
| **Gradient wash** | Soft **rose → raspberry** radial gradient(s) over the base — inspired by marketing `hero-bg-gradient-drift` palette (`--rose`, `--rose-soft`, `--raspberry`, `--raspberry-soft`) at **low opacity** (approx. 12–28% color mix) |
| **Placement** | Hero zone behind eyebrow/headline/subhead — gradient anchored upper-center or upper-left; fades to clean `#F7F4F1` before CTA stack |
| **Sparkle dots** | **Optional** — very subtle, **static** only (no animation); small white/rose points at low opacity; **omit entirely** if they compete with headline legibility |
| **Mood** | Light · premium · calm · airy (70% approachable / 30% premium) |

**Do not use on Welcome:**

- Photography or stock imagery  
- Character illustration or mascots (except wordmark typography)  
- Product mockup or phone frame  
- Decorative 3D objects (coins, cards, etc.)  
- WebGL, paper shader, or `@paper-design/shaders-react`  
- Animated gradients, parallax, Lottie, or motion loops  
- Full-screen illustration that pushes copy below the fold  

**Onboarding confirmation screen:** May reuse the same static gradient treatment at reduced intensity — no separate illustration direction for Phase 2.

**Layout (top → bottom):**

1. **Safe area top** — no cluttered header; optional small wordmark top-center or top-left (Cormorant “Olimpia”)  
2. **Hero zone** (~45% vertical) — approved static gradient wash + optional subtle sparkle dots (see visual direction above)  
3. **Eyebrow** — see approved copy table  
4. **Headline** — see approved copy table  
5. **Subhead** — see approved copy table  
6. **Tagline** — see approved copy table  
7. **Bottom CTA stack** (pinned above safe area inset):  
   - Primary pill: **Get started** → Auth (sign up)  
   - Secondary text button: **Sign in** → Auth (sign in)  
8. **Legal microcopy** (optional footer): Terms · Privacy — caption size, ink-muted

**Visual weight:** 70% approachable / 30% premium. Light, airy, no dark panels.

---

### 3.2 Sign up / Login (Auth)

**Route:** A2 — single flow, mode toggled by entry path  
**Reference:** WaitlistModal form + Privy SDK sheets

**Layout — shared chrome:**

- Top: Back → Welcome  
- Title: **Create your account** (sign up) or **Welcome back** (sign in)  
- Subtitle: *Takes about a minute. No complicated setup.*

**Sign-up steps (inline / Privy-managed):**

1. Email or phone input (single field with toggle or segmented control)  
2. OTP verification / passkey prompt (Privy native UI themed where possible)  
3. **Account sync loading** — full-width calm loader: *Setting up your account…* (no wallet/chain language)  
4. Error inline below field or banner — friendly retry

**Sign-in steps:** Same without “new account” framing; route directly to empty Home — **no Pia greeting or introduction**.

**Pia exclusion (Auth → Home path):** No Pia avatar, bubble, modal, or copy anywhere on Welcome, Auth, or post-auth onboarding. ScreenInventory A3 / UserFlows §2 Pia introduction is **out of scope for Phase 2** — deferred until functional Pia ships.

**Layout rules:**

- Form fields: full width, 48pt height, white or background fill, border surface  
- Primary continue button: raspberry pill, disabled until valid input  
- Keyboard-safe scroll; CTA remains visible (sticky footer or `KeyboardAvoidingView`)

**Privy theming direction:** Map primary to `--raspberry`, background to `--background`, text to `--ink`, border-radius to pill/rounded-xl.

---

### 3.3 Onboarding (post-auth first-run) — dedicated confirmation screen

**Route:** Full-screen confirmation (A3-equivalent) shown **after successful sign-up and account sync**, **before** Empty Home — **not** a Pia screen; **no Pia content anywhere in this flow  
**Reference:** StayTuned success card + Brand.md confirmation tone  
**Build Plan Phase 2:** Sign-up path only; sign-in skips this screen and routes directly to Empty Home

**Founder approved:** Dedicated Pia-free **“You're in.”** confirmation screen for Phase 2. No modal, no banner substitute, no Pia greeting or chat preview.

**Entry:** Auth sign-up → account sync success  
**Exit:**

| CTA | Action |
|-----|--------|
| **Add money** (primary) | Push shared **Add funds screen** (Phase 2 stub — copy §3.3; full funding in Phase 4) |
| **Explore the app** (secondary) | Empty Home (A4) with bottom tabs visible |

**Pia rule (founder approved):** Pia appears **only** as the static “Coming Soon” card inside Profile. Do **not** add Pia content, chat preview, modal, or navigation to this flow.

**Layout — dedicated full screen (Pia-free):**

1. **Celebration icon** — rose-soft circle, heart or checkmark, raspberry accent  
2. **Headline (Inter h2):** *You're in.*  
3. **Body (body):** *Your Olimpia account is ready. Add money when you're ready — or explore the app first.*  
4. **Primary CTA (pinned):** **Add money** → shared Add funds screen (see below)  
5. **Secondary CTA:** **Explore the app** → Empty Home with tabs  
6. Optional dismiss (X) — same behavior as **Explore the app**

**Add funds screen (Phase 2 — shared stub, founder approved):**

**One screen, two entry points:** onboarding confirmation **Add money** (after “You're in.”) and Empty Home **Add money** CTA open the **same** shared Add funds screen — identical copy and layout.

| Element | User-facing copy |
|---------|------------------|
| **Title** | Add funds |
| **Body** | Choose how you'd like to add funds to your Olimpia balance. |
| **Primary action** | Continue |

**Phase 2 UI — do not mention:** bank account · debit card · Bridge · USDC · Base · wallet  

Available funding methods will be determined by the live Bridge flow at launch — not shown or named in Phase 2 stub UI.

**Copy constraints — do not use:**

- “Add money to Olimpia”  
- “Connect your bank account or card to add money to Olimpia”  
- “Coming soon”  
- Any wording that suggests funds belong to Olimpia rather than the user  

**Layout:**

- Stack screen or simple full view — **not** a tab destination  
- Calm, on-brand — no error tone  
- Title (h2), body (body, ink-muted), primary **Continue** pill (raspberry)  
- Stack **Back** → previous screen (Home or onboarding confirmation)  
- **No** amount input, funding-method selector, or processing states in Phase 2 stub UI  

**Implementation note (internal — not user-facing):** Before launch, **Continue** opens the Bridge-hosted funding flow. Funding method options (e.g. bank vs card) come from the live Bridge integration at launch — USD converts to USDC and settles to the user’s embedded wallet on Base. None of this appears in Phase 2 user-facing copy.

**Phase 2 stub behavior:** Continue may remain unwired until Phase 4 — user-facing copy stays as approved above regardless.

**Sign-in path:** Auth sign-in → sync success → **Empty Home directly** (skip confirmation screen).

---

### 3.4 Empty Home dashboard

**Route:** A4 — Home tab root  
**State:** NavigationMap **State 1 — New User** (account created, $0, no goals, no growth)  
**Reference:** UserFlows §4 empty state; ScreenInventory State 1; marketing goal card for future slots

**Visual hierarchy (founder approved):** The **encouraging headline** and **Add money CTA card** are the main focus. Balance is present but quiet — never the hero.

**Approved balance treatment (Phase 2 empty state):**

| Rule | Detail |
|------|--------|
| **Copy** | *Money available · $0.00* |
| **Typography** | Inter **body-sm** or **caption**, **ink-muted** — same weight as helper text, not semibold |
| **Placement** | Single inline text row **below the Add money CTA card**, above quick actions — not inside a card |
| **Do not use** | Large balance hero card · dark `#111` balance panel · oversized `$0.00` display type · display/h1/h2 sizing for the amount |

**Layout (top → bottom):**

1. **Header row:** Greeting + avatar placeholder  
   - *Hi {firstName} ✨* (body-sm muted + h3 semibold)  
   - Circular avatar: rose → raspberry gradient (marketing phone mockup pattern)  
2. **Encouraging headline (primary visual focus):**  
   - *Let's get started.* (h2)  
   - Subline (body, ink-muted): *Add funds to begin building toward the life you choose.*  
3. **Primary CTA card (co-primary visual focus)** — white card, soft shadow, full width:  
   - Icon: Plus in rose circle  
   - **Add money** — routes to shared **Add funds screen** (same screen as onboarding path — §3.3)  
   - Chevron or button treatment  
4. **Balance line (quiet secondary only):** *Money available · $0.00* — see approved balance treatment above  
5. **Quick actions row** (tertiary — visually de-emphasized): Send · Receive  
   - Rose circle icons, raspberry glyphs, labels body-sm  
   - Tappable but may route to stub screens in Phase 2  
6. **Placeholder slots** (ghost / dashed optional):  
   - *Your first savings goal will live here* — muted card, no fake progress  
   - *Growth earnings appear here* — muted, no APY jargon  
7. **Recent activity:** Empty state — illustration-free:  
   - *No activity yet* + *Your first deposit will show up here*  
8. **No Pia entry on Home** in Phase 2

**Funded Home (Phase 3+):** Dark or elevated balance treatments from marketing phone mockup remain **deferred** — not part of Phase 2 empty state.

---

### 3.5 Bottom navigation

**Route:** Persistent tab bar — 4 tabs per PRD / NavigationMap  
**Reference:** Marketing phone mockup tab styling (colors/icons) — **not** 5-tab structure

**Tabs:**

| Tab | Icon direction | Label | Phase 2 behavior |
|-----|----------------|-------|------------------|
| **Home** | Home outline/filled | Home | Active default; empty dashboard |
| **Savings** | Piggy bank / target | Savings | Phase 2 empty state per §3.6 |
| **Card** | Credit card | Card | Phase 2 empty state per §3.7 |
| **Profile** | User | Profile | Account info + Pia Coming Soon |

**Visual spec:**

- Bar background: `#FFFFFF` or `#F7F4F1` with top border `#E8E1DA`  
- Height: 56pt + safe area inset (iOS home indicator)  
- Active tab: raspberry icon + semibold raspberry label  
- Inactive: ink-muted at ~70% opacity  
- No labels in serif; no Pia tab; no Learn tab  
- Active tab re-tap: pop stack to tab root (NavigationMap rule)

**Savings and Card tabs:** Phase 2 uses approved simple empty states (§3.6 · §3.7) — not skeleton shimmer, fake data, or phase labels.

---

### 3.6 Savings tab (Phase 2 empty state)

**Route:** A10 — Savings tab root (shell only in Phase 2)  
**Component:** Shared **EmptyState** — calm, centered, visually consistent across Savings and Card

**Founder approved:** Simple, transparent empty state. **No** skeleton shimmer, fake data, fake balances, or “Phase 3” labels.

**Layout (centered vertically in safe area, 16px horizontal padding):**

1. **Icon** — savings/target icon inside **rose circle** (`bg-rose/70`, raspberry glyph) — matches quick-action pattern on Home  
2. **Title (body or h3, ink):** *Your savings goals will live here.*  
3. **Supporting line (body-sm, ink-muted, optional):** *You'll be able to create and track goals here.*  
4. **No** CTA button, fake goal rows, progress bars, or “coming in Phase X” copy in Phase 2

**UX goal:** Tab feels intentional and complete — user understands goals arrive later, not that the app is broken.

---

### 3.7 Card tab (Phase 2 empty state)

**Route:** A14 — Card tab root (shell only in Phase 2)  
**Component:** Shared **EmptyState** — same centered layout and styling as Savings (§3.6)

**Founder approved:** Simple, transparent empty state. **No** skeleton shimmer, fake card PAN, fake balances, or “Phase 3” labels.

**Layout (centered vertically in safe area, 16px horizontal padding):**

1. **Icon** — credit card icon inside **rose circle** (`bg-rose/70`, raspberry glyph)  
2. **Title (body or h3, ink):** *Your virtual debit card will live here.*  
3. **Supporting line (body-sm, ink-muted, optional):** *Your card details and spending tools will appear here.*  
4. **No** virtual card visual, masked PAN, freeze toggle, or spend list in Phase 2

**UX goal:** Tab feels intentional — user knows card features are forthcoming without mock financial data.

---

### 3.8 Profile (with Pia “Coming Soon” card)

**Route:** A16 — Profile tab root  
**Reference:** SiteFooter restraint + PiaSection ChatPreview (static only)

**Layout (scrollable single column, 16px horizontal padding):**

1. **Profile header**  
   - Avatar (same gradient as Home)  
   - Display name (h3)  
   - Email (body-sm, ink-muted)  
   - Username / receive handle (body-sm, raspberry) — placeholder if not set  

2. **Pia “Coming Soon” card** (inline — **only Pia surface in Phase 2**; founder approved)  
   - White card, `rounded-2xl`, shadow-card, border border/40  
   - Header row: Pia avatar (`pia-raspberry.png`), name **Pia**, badge **Coming Soon** (rose-soft pill, raspberry text)  
   - **One static message bubble only** (surface bg, rounded-2xl rounded-tl-md; Inter body text):  
     *Pia will help you understand saving, growth, and financial confidence — supportive, never judgmental.*  
   - **Do not add:** decorative user-question bubble · text input · send button · suggested prompts · chat interaction · navigation to a Pia screen  
   - **No** “Ask Pia” row elsewhere on Profile  

3. **Account section** (grouped list, white card or inset grouped style)  
   - Notifications (stub)  
   - Security (stub)  
   - Help / Support → mailto support email  

4. **Sign out** — destructive-adjacent but not red; raspberry or berry text button at bottom  

**Data (Phase 2):** Read-only from `GET /me` — name, email; stubs OK for prefs.

---

## 4. UX goal per screen

| Screen | UX goal | Success feeling |
|--------|---------|-----------------|
| **Welcome** | Communicate women-first financial confidence in one glance; reduce fear of “another finance app” | *This feels made for me — I can try this.* |
| **Sign up / Login** | Fast, familiar auth with zero crypto or technical steps | *That was easy. I'm not stupid.* |
| **Onboarding** | Mark account creation as a win; offer choice without pressure | *I'm set up. I can go at my own pace.* |
| **Empty Home** | Orient new user; one clear next step (add money) without blank ledger anxiety | *I know what to do next.* |
| **Savings (Phase 2)** | Set expectation that goals come here — no fake progress or loading theatrics | *I know where goals will go.* |
| **Card (Phase 2)** | Set expectation that the card lives here — no mock card or balances | *The card feature is coming — the app isn't broken.* |
| **Bottom navigation** | Predictable mental model for the full app; confidence the product is real | *This is a complete app, not a demo fragment.* |
| **Profile** | Account ownership + trust; tease future Pia value without implying chat works today | *My account is mine — and something helpful is coming.* |

**Phase 2 acceptance alignment (Build Plan):**

- Reach Home in under 3 minutes  
- Zero crypto, DeFi, or protocol vocabulary on any Phase 2 app screen (§1.4)  
- Light-only theme — no dark mode (§1.5)  
- Pia Coming Soon visible on Profile only — no chat  
- Sign out returns to Welcome  
- iOS and Android visual parity

---

## 5. Copy and content placeholders

### Welcome (mobile Phase 2 — approved)

| Element | Copy | Typography |
|---------|------|------------|
| Eyebrow | Financial freedom, designed for women | Inter · label/eyebrow · raspberry |
| Headline | Money that feels like yours. | Inter + Cormorant Garamond italic on **yours.** only |
| Subhead | Save, spend, and grow your money with confidence. | Inter body-lg · ink-muted |
| Tagline | More choices. More freedom. | Inter body-sm · raspberry |
| Primary CTA | Get started | Inter · primary button |
| Secondary CTA | Sign in | Inter · ghost button |

*Marketing website headline unchanged — this copy applies to the mobile Welcome screen only.*

### Auth — Sign up

| Element | Placeholder copy |
|---------|------------------|
| Title | Create your account |
| Subtitle | Takes about a minute. No complicated setup. |
| Email label | Email |
| Phone label | Phone number |
| Continue | Continue |
| OTP prompt | Enter the code we sent you |
| Loading | Setting up your account… |
| Error (generic) | Something didn't work. Try again. |
| Error (verification) | That code didn't match. Check and try again. |

### Auth — Sign in

| Element | Placeholder copy |
|---------|------------------|
| Title | Welcome back |
| Subtitle | Sign in to pick up where you left off. |

### Onboarding (post sign-up) — dedicated confirmation screen

| Element | Placeholder copy |
|---------|------------------|
| Headline | You're in. |
| Body | Your Olimpia account is ready. Add money when you're ready — or explore the app first. |
| Primary CTA | Add money |
| Secondary CTA | Explore the app |

### Add funds screen (Phase 2 — shared stub, approved)

| Element | Copy |
|---------|------|
| Title | Add funds |
| Body | Choose how you'd like to add funds to your Olimpia balance. |
| Primary action | Continue |

**Entry points:** Onboarding confirmation **Add money** · Empty Home **Add money** CTA — **same screen**

**Phase 2 UI — do not mention:** bank account · debit card · Bridge · USDC · Base · wallet

**Do not use:** “Add money to Olimpia” · “Connect your bank account or card to add money to Olimpia” · “Coming soon” · copy implying funds belong to Olimpia rather than the user

*Implementation note (internal — not user-facing):* Before launch, **Continue** opens the Bridge-hosted funding flow; available methods come from live Bridge at launch (USD → USDC → user wallet on Base). Never surface those terms in Phase 2 user-facing copy.

### Empty Home (State 1 — approved)

| Element | Copy | Typography / placement |
|---------|------|------------------------|
| Greeting | Hi {firstName} ✨ | body-sm muted + h3 name |
| Headline | Let's get started. | h2 — **primary focus** |
| Subhead | Add funds to begin building toward the life you choose. | body · ink-muted |
| Primary CTA | Add money | CTA card — **co-primary focus** |
| Balance | Money available · $0.00 | body-sm/caption · ink-muted · **quiet secondary only** — below CTA card, no hero panel |
| Quick actions | Send · Receive | de-emphasized row |
| Goal placeholder | Your first savings goal will appear here | muted ghost card |
| Growth placeholder | Growth earnings will show here when you're ready | muted ghost card |
| Activity empty | No activity yet · Your first deposit will show up here | EmptyState |

### Bottom tabs

| Tab | Label |
|-----|-------|
| 1 | Home |
| 2 | Savings |
| 3 | Card |
| 4 | Profile |

### Savings tab (Phase 2 empty state — approved)

| Element | Copy | Notes |
|---------|------|-------|
| Icon | Savings / target in rose circle | raspberry glyph |
| Title | Your savings goals will live here. | body or h3 · ink |
| Supporting line (optional) | You'll be able to create and track goals here. | body-sm · ink-muted |

### Card tab (Phase 2 empty state — approved)

| Element | Copy | Notes |
|---------|------|-------|
| Icon | Credit card in rose circle | raspberry glyph |
| Title | Your virtual debit card will live here. | body or h3 · ink |
| Supporting line (optional) | Your card details and spending tools will appear here. | body-sm · ink-muted |

**Do not use:** skeleton shimmer · fake data · fake balances · “Phase 3” labels

### Profile (Pia Coming Soon card — approved)

| Element | Copy / spec | Typography |
|---------|-------------|------------|
| Pia avatar | `pia-raspberry.png` | — |
| Pia name | Pia | Inter body semibold |
| Badge | Coming Soon | rose-soft pill · raspberry text |
| Static message (one bubble only) | Pia will help you understand saving, growth, and financial confidence — supportive, never judgmental. | Inter body · surface bubble |

**Do not add:** user message bubble · input · send · suggested prompts · navigation

| Element | Copy |
|---------|------|
| Notifications | Notifications |
| Security | Security |
| Help | Help & support |
| Sign out | Sign out |

---

## 6. Components needed (Phase 2)

### Design system primitives

| Component | Variants | Notes |
|-----------|----------|-------|
| **Color tokens** | background, surface, card, ink, ink-muted, berry, deep-berry, raspberry (`#E54B7A`), berry-dark (`#C73E72`), raspberry-soft, rose, rose-soft, success, border | Map to React Native theme per §1.1 |
| **Typography styles** | display, h1–h3, body-lg, body, body-sm, caption, label/eyebrow | Inter default; Cormorant **wordmark + *yours.* only** (§1.2) |
| **FontLoader** | Inter + Cormorant Garamond | Preload before Welcome/Profile wordmark render — no visible swap |
| **PrimaryButton** | default, loading, disabled | Raspberry pill, white text, min height 48 |
| **SecondaryButton** | outline, ghost | Border foreground/15 or text-only |
| **TextInput** | email, phone, error | Focus ring raspberry |
| **WelcomeBackground** | static radial gradient | Rose→raspberry wash on `#F7F4F1`; optional static sparkle layer — no animation |
| **ScreenContainer** | scroll, keyboard-aware | bg background, horizontal padding 16 |
| **Card** | elevated, inset | rounded-2xl, shadow-card, white fill |
| **Avatar** | sm, md | Gradient rose → raspberry |
| **Badge** | coming-soon, neutral | Rose-soft pill |
| **ListRow** | chevron, value, button | Profile settings |
| **EmptyState** | centered · with-subtitle | Activity (Home), **Savings tab**, **Card tab** — rose-circle icon + title + optional supporting line |
| **LoadingOverlay** | auth sync | Calm copy, no technical details |
| **TabBar** | 4 items | Custom or themed React Navigation tab bar |
| **StaticMessageBubble** | incoming only | Pia card — single bubble; Inter body; not tappable |
| **PiaComingSoonCard** | static | Avatar, name, Coming Soon badge, **one** StaticMessageBubble — no user bubble, no input |
| **QuickActionButton** | icon + label | Rose circle + raspberry icon |
| **ProgressPlaceholder** | ghost | Dashed goal/growth slot on empty Home |
| **BalanceSecondaryLine** | empty · funded (future) | body-sm/caption ink-muted inline text — Phase 2: *Money available · $0.00* only |

### Screen-level compositions

| Screen | Composed from |
|--------|---------------|
| Welcome | ScreenContainer, **WelcomeBackground** (static radial gradient), eyebrow, headline, PrimaryButton, SecondaryButton |
| Auth | ScreenContainer, TextInput, PrimaryButton, LoadingOverlay, inline ErrorBanner |
| Onboarding confirmation | Full-screen confirmation, PrimaryButton, SecondaryButton — Pia-free |
| Add funds screen (shared) | Title, body copy, PrimaryButton **Continue** — onboarding + Empty Home entry points |
| Empty Home | GreetingHeader, headline block, Primary CTA Card, **BalanceSecondaryLine**, QuickAction row, Placeholder cards, EmptyState activity |
| Savings (Phase 2) | EmptyState — target icon, approved copy |
| Card (Phase 2) | EmptyState — card icon, approved copy |
| Tab shell | TabBar + 4 tab roots |
| Profile | ProfileHeader, PiaComingSoonCard (single bubble), ListRow group, SignOutButton |

### Assets

| Asset | Source | Usage |
|-------|--------|-------|
| Pia avatar | `apps/marketing/src/assets/pia-raspberry.png` | Profile Coming Soon card |
| Wordmark | Cormorant Garamond “Olimpia” (bundled) | Welcome; optional Profile header |
| Body/UI font | Inter (bundled) | All other Phase 2 UI |
| Tab icons | Lucide-style outline icons (match marketing) | Home, Savings, Card, User |

---

## 7. Mobile-specific adaptations

| Marketing pattern | Mobile adaptation |
|-------------------|-------------------|
| Wide two-column hero | Single column; headline + CTA stacked; **approved static gradient only** — no mockup or illustration |
| Sticky marketing nav | No top nav on app screens — system status bar + stack back only pre-tabs |
| `rounded-[32px]` marketing cards | Use 16–24px radius on small screens for density |
| Paper shader / WebGL hero | **Not on mobile** — static radial gradients only (Welcome approved direction) |
| Hover states, flip cards | Pressed states (opacity 0.9); no flip interactions |
| Marketing 5-tab mockup | **4 tabs:** Home · Savings · Card · Profile |
| Pia on Home / dedicated tab | **Profile-only Coming Soon card** |
| Dark balance hero card | **Not on Phase 2 empty Home** — quiet *Money available · $0.00* line only; dark/inverted card deferred to funded Home (Phase 3+) |
| Serif display headlines everywhere | Inter for mobile UI; Cormorant on Welcome wordmark + italic *yours.* only |
| Shadow-card depth | Reduce shadow on Android; use elevation API; optional subtle border |
| Marketing DeFi-forward copy | **App:** neobank language per §1.4 · **Marketing:** educational DeFi/USDC content allowed — do not change marketing copy in Phase 2 |
| Dark / system appearance | **Light-only MVP** — ignore system dark mode; no dark theme (§1.5) |
| Smooth scroll / parallax | Respect `prefers-reduced-motion`; simple fade/slide only |
| px-6 (24px) marketing padding | 16px phone horizontal padding; 24px for tablet if supported later |
| Touch targets | Minimum 44×44pt for all actions |
| Safe areas | Respect notch, Dynamic Island, home indicator |
| Auth | Privy native sheets; brand-colored where SDK allows |
| Keyboard | Auth fields scroll; primary CTA visible above keyboard |

**Platform parity:** Same component specs on iOS and Android; tab bar respects each platform safe area without visual drift.

---

## 8. Founder decisions (approved)

| # | Decision | Resolution |
|---|----------|------------|
| 1 | **Raspberry / berry palette** | **Primary raspberry:** `#E54B7A` (matches marketing site). **Supporting berry dark:** `#C73E72` (Brand.md accent — pressed states, depth, secondary emphasis). |
| 2 | **Pia scope (Phase 2)** | **No Pia in onboarding.** Pia appears **only** as the static “Coming Soon” card inside Profile. No Pia greeting, chat preview, modal, tab, input, “Ask Pia” entry, or navigation destination anywhere else in the app. ScreenInventory A3 / UserFlows §2 Pia introduction deferred. |
| 3 | **Post-sign-up onboarding** | **Dedicated confirmation screen** after sign-up + account sync, before Empty Home. Pia-free **“You're in.”** layout per §3.3. **Primary CTA:** Add money → shared **Add funds screen** (§3.3). **Secondary CTA:** Explore the app → Empty Home. Sign-in skips confirmation screen. No Pia content, chat preview, modal, or Pia navigation in this flow. |
| 4 | **Welcome copy (mobile only)** | **Headline:** *Money that feels like yours.* — Inter for all words except **Cormorant Garamond italic** on *yours.* **Subhead:** *Save, spend, and grow your money with confidence.* **Eyebrow:** *Financial freedom, designed for women* **Tagline:** *More choices. More freedom.* Marketing website hero headline **unchanged** — mobile Welcome only. |
| 5 | **Welcome visual (mobile only)** | **Abstract static gradient only** on `#F7F4F1` — soft rose→raspberry radial wash; light, premium, calm, airy. Optional very subtle **static** sparkle dots only if they do not compete with the headline. **No** photography, character illustration, product mockup, decorative 3D objects, WebGL, animation, or full-screen illustration. Visual supports approved copy + CTA stack. Marketing site visuals **unchanged**. |
| 6 | **Empty Home balance (Phase 2)** | Show *Money available · $0.00* as **quiet secondary text only** (body-sm/caption, ink-muted) — below Add money CTA card. **No** large balance hero, dark balance panel, or oversized `$0.00`. Main focus: encouraging headline + Add money CTA card. |
| 7 | **Savings / Card tabs (Phase 2)** | **Simple transparent empty states** via shared EmptyState — centered, calm, rose-circle icon. **Savings:** *Your savings goals will live here.* + optional *You'll be able to create and track goals here.* **Card:** *Your virtual debit card will live here.* + optional *Your card details and spending tools will appear here.* **No** skeleton shimmer, fake data, fake balances, or “Phase 3” labels. |
| 8 | **Add funds screen routing + copy (Phase 2)** | Empty Home **Add money** CTA opens the **same shared Add funds screen** as onboarding **Add money**. **Title:** *Add funds* · **Body:** *Choose how you'd like to add funds to your Olimpia balance.* · **Primary:** *Continue*. **Phase 2 UI must not mention:** bank account, debit card, Bridge, USDC, Base, or wallet. Funding methods from live Bridge flow at launch (internal only). |
| 9 | **Cormorant Garamond (mobile)** | Ship **actual Cormorant Garamond** for brand fidelity — **only** Olimpia wordmark (Welcome + optional Profile header) and italic *yours.* in Welcome headline. **Inter everywhere else.** No system serif fallback except on custom font load failure. **Implementation:** bundle/load Inter + Cormorant before rendering Welcome so there is **no visible font swap**. |
| 10 | **Pia Coming Soon card (Profile)** | **One static Pia message bubble only** — no decorative user-question bubble. Keep: Pia avatar · name **Pia** · **Coming Soon** badge · message: *Pia will help you understand saving, growth, and financial confidence — supportive, never judgmental.* No input, send, suggested prompts, user bubble, chat interaction, or navigation. |
| 11 | **Dark mode (MVP)** | **Light-only.** Approved warm light theme: background `#F7F4F1`, primary raspberry `#E54B7A`, supporting berry dark `#C73E72`, white cards, warm neutral surfaces. **Do not** design, build, document, or test dark mode for MVP. Future enhancement post-launch only. |
| 12 | **Marketing vs app copy tone** | **Mobile app** uses simple consumer-friendly **neobank language** as in-app source of truth (§1.4). Preferred terms: *Add funds*, *your balance*, *save*, *spend*, *grow your money*, *savings goals*, *financial confidence*. **Banned in app Phase 2 UI:** crypto, DeFi, Base, USDC, wallet, yield, blockchain, protocol. **Marketing website** may keep USDC/DeFi educational content — unchanged in this phase. |

---

## 9. Open design questions

**None.** All Phase 2 design questions are resolved in §8 Founder decisions (approved).

## Appendix: Phase 2 navigation flow

```
Welcome (A1)
  ├─ Get started → Auth sign up (A2)
  │     └─ Sync success → Onboarding confirmation (“You're in.”) [Pia-free]
  │           ├─ Add money → Add funds screen (shared) → back → prior screen
  │           └─ Explore the app → Empty Home (A4) [tabs visible]
  └─ Sign in → Auth sign in (A2)
        └─ Sync success → Empty Home (A4) [skip confirmation screen]

Empty Home ←→ Bottom tabs → Savings (empty state) · Card (empty state) · Profile (A16)
Empty Home “Add money” → Add funds screen (shared — same as onboarding path)
Profile → Sign out → Welcome (A1)

Pia: Profile inline Coming Soon card ONLY — no navigation target
```

---

## Appendix: Pia rules (Phase 2 — non-negotiable)

- Pia visible **only** as static “Coming Soon” card inside **Profile**  
- **No** Pia in onboarding — no greeting, introduction moment, or “Meet Pia” step after sign-up  
- **No** separate Pia screen, tab, stack destination, or deep link  
- **No** chat preview UI outside Profile (including Home hero-style Pia bubbles)  
- **No** decorative user-message bubble on Profile Pia card — **one Pia bubble only**  
- **No** chat input, send button, suggested prompts, or AI responses  
- **No** “Ask Pia” on Home, Savings, Card, Welcome, Auth, or onboarding  
- **No** API integration, database tables, or live functionality in Phase 2  
- Marketing `#pia` section and ChatPreview inform **Profile card visual style only** — with “Coming Soon” label instead of “Chat with Pia”

---

*End of Mobile Phase 2 Screen Design Brief v2.0 — approved*
