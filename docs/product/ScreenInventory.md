# Olimpia — Screen Inventory

**Version:** 1.1  
**Status:** Draft for review  
**Purpose:** Complete MVP screen and surface inventory for developers — no UI designs, no code  
**Source of truth:** [PRD.md](./PRD.md) (v2.0) · [Brand.md](../brand/Brand.md) (approved) · [Architecture.md](../architecture/Architecture.md) (v2.0) · [UserFlows.md](./UserFlows.md) · [NavigationMap.md](./NavigationMap.md) · [BuildPlan.md](../build/BuildPlan.md) (v2.0)

---

## Document conventions

| Term | Meaning |
|------|---------|
| **Screen** | Full view in mobile stack or marketing route |
| **Sheet** | Bottom sheet overlay (e.g. Create Goal) — not a tab |
| **Modal** | Overlay (e.g. Waitlist, success confirmations) |
| **Surface** | Any user-visible destination: screen, sheet, modal, or inline onboarding moment |
| **Inline state** | Processing / success / error on the same screen — not a new route |

**Platforms:** Marketing website (static) · React Native mobile app (**iOS + Android**, single codebase).

**Settings:** PRD merges settings into **Profile** — there is **no separate Settings screen** in MVP.

**V1 launch scope:** See [V1Scope.md](./V1Scope.md) · [V1Architecture.md](../V1Architecture.md). **Receive USDC on Base** is the only active V1 funding path. **Grow** is in V1 scope. **Coinbase Headless / Apple Pay Add Money** is **post-V1** (code preserved, not mounted in the live app). **Functional Pia** and **virtual card** are **post-V1**.

**Card management:** Virtual debit card viewing and controls (freeze, CVV reveal) live on the **Card** tab — **post-V1**; not a separate screen.

---

## Inventory index

### Marketing website

| ID | Surface | MVP |
|----|---------|-----|
| M1 | [Landing Page](#m1-landing-page) | Yes |
| M2 | [What is USDC (`/learn/usdc`)](#m2-what-is-usdc-learnusdc) | Yes |
| M3 | [Waitlist / Email Capture (modal)](#m3-waitlist--email-capture-modal) | Yes |

*FAQ is a **section** on M1 (`#faq`), not a separate route.*

### Mobile app

| ID | Surface | PRD screen # | MVP | V1 launch |
|----|---------|--------------|-----|-----------|
| A1 | [Welcome (Onboarding)](#a1-welcome-onboarding) | 1 | Yes | Yes |
| A2 | [Authentication (Privy)](#a2-authentication-privy) | 2 | Yes | Yes |
| A3 | [Pia Introduction (onboarding moment)](#a3-pia-introduction-onboarding-moment) | — | Yes | No — Pia-free onboarding; preview on Profile only |
| A4 | [Home Dashboard](#a4-home-dashboard) | 3 | Yes | Yes |
| A5 | [Add Funds](#a5-add-funds) | 4 | Yes | No — **post-V1** Coinbase Headless |
| A6 | [Withdraw Money](#a6-withdraw-money) | — | Yes | No — **post-V1** bank off-ramp |
| A7 | [Send Money](#a7-send-money) | 5 | Yes | No — **not V1** P2P |
| A8 | [Receive Money](#a8-receive-money) | 6 | Yes | Yes — **V1 funding** (Receive USDC) |
| A9 | [Transaction Detail](#a9-transaction-detail) | 7 | Yes | Yes |
| A10 | [Savings Goals (list)](#a10-savings-goals-list) | 8 | Yes | Yes |
| A11 | [Create Goal (sheet)](#a11-create-goal-sheet) | — | Yes | Yes |
| A12 | [Goal Detail](#a12-goal-detail) | 9 | Yes | Yes |
| A13 | [Growth Account](#a13-growth-account) | — | Yes | Yes — USDC yield |
| A14 | [Virtual Debit Card (Card tab)](#a14-virtual-debit-card-card-tab) | 10 | Yes | No — **post-V1** |
| A15 | [Pia AI Chat](#a15-pia-ai-chat) | 11 | Future | No — static preview on A16 Profile only at V1 |
| A16 | [Profile (includes Settings)](#a16-profile-includes-settings) | 12 | Yes | Yes |

---

## Marketing website

### M1: Landing Page

| Field | Detail |
|-------|--------|
| **Screen name** | Landing Page |
| **Route** | `/` |
| **MVP / Future** | **MVP** |
| **Purpose** | Acquisition, trust, product understanding, conversion to waitlist or app download |
| **User flow** | UserFlows §1 — Marketing website visitor |

**Entry point(s):**

- Direct URL, search, social link, referral

**Exit point(s):**

- Scroll to in-page anchors (`#features`, `#how-it-works`, `#faq`, `#preview`, `#pia`, etc.)
- Navigate to `/learn/usdc` (Hero USDC link)
- Open **Waitlist modal** (M3)
- App Store / Google Play (when live)
- Footer: Privacy, Terms, support email

**Components on screen:**

| Section | Anchor | Notes |
|---------|--------|-------|
| Navigation | — | Logo · Features · How It Works · FAQ · Download/Waitlist CTA |
| Hero | — | Eyebrow, headline, subheadlines, tagline, Download + Learn More |
| Product Preview | `#preview` | Mobile mockup — balance, growth, goals, actions |
| Built Around Real Life | `#real-life` | 4 goal cards with progress UI |
| Your Money Bestie (Pia) | `#pia` | Static preview of in-app coach |
| Trusted Infrastructure | `#infrastructure` | Logo strip |
| Features | `#features` | Save · Spend · Grow · Learn · Own |
| How It Works | `#how-it-works` | 4-step flow |
| **FAQ** | `#faq` | Accordion, 6–8 questions, real HTML |
| Final CTA | — | Download / waitlist |
| Footer | — | Store badges, support, legal, © |

**Primary user goal:** Understand what Olimpia offers and join waitlist or download the app.

**Success state:** Visitor grasps women-first save/spend/grow positioning; waitlist signup succeeds or store link opens.

**Empty state:** N/A (static content).

**Error state:** Waitlist failure handled in M3 modal, not on page body.

**Architecture modules:** Marketing static deploy only; waitlist → `api/waitlist` handler.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/waitlist` | Email capture (optional if third-party form) |

**SEO:** Title, meta, Open Graph, JSON-LD, semantic HTML, one H1; marketing details remain in Brand/DesignReferences.

---

### M2: What is USDC (`/learn/usdc`)

| Field | Detail |
|-------|--------|
| **Screen name** | What is USDC (education page) |
| **Route** | `/learn/usdc` |
| **MVP / Future** | **MVP** |
| **Purpose** | Beginner education on USDC, stablecoins, why Olimpia uses them, growth basics |
| **User flow** | UserFlows §1 (optional branch) · supports FAQ links |

**Entry point(s):**

- Hero **USDC** link on M1
- FAQ answers linking to `/learn/usdc`

**Exit point(s):**

- Back to M1 (logo / home link)
- M1 `#faq` or Download CTA

**Components on screen:**

| Section | Notes |
|---------|-------|
| H1 | e.g. *Understanding USDC — stable, simple, behind the scenes* |
| What USDC is | H2 + body |
| What a stablecoin is | H2 + body |
| Why Olimpia uses USDC | H2 + body — invisible infrastructure |
| How yield/growth works (beginner) | H2 + body — estimated, not guaranteed |
| No crypto experience needed | H2 + reassurance |
| Optional CTA | Return to home / download |

**Primary user goal:** Learn what USDC means without crypto intimidation.

**Success state:** User understands stablecoins in plain language and returns to main journey.

**Empty state:** N/A.

**Error state:** N/A (static); 404 if route missing.

**Architecture modules:** Marketing static only.

**APIs:** None.

---

### M3: Waitlist / Email Capture (modal)

| Field | Detail |
|-------|--------|
| **Screen name** | Waitlist Modal |
| **Route** | Overlay on M1 (no dedicated URL) |
| **MVP / Future** | **MVP** |
| **Purpose** | Pre-launch email capture for app notification |
| **User flow** | UserFlows §1 |

**Entry point(s):**

- Hero **Download the App**
- Nav **Download App / Join Waitlist**
- Final CTA on M1

**Exit point(s):**

- Close modal → return to M1 scroll position
- Success confirmation → dismiss

**Components on screen:**

- Title: *Get the Olimpia App*
- Body copy (launching soon)
- Email input
- **Join waitlist** button
- Success inline message
- Coming soon store badges / QR placeholder
- Error message + retry + support link

**Primary user goal:** Join waitlist with email.

**Success state:** Inline confirmation (*You're on the list*); modal closable.

**Empty state:** Email field empty — submit disabled or validation message.

**Error state:** Submit failed — inline error, retry, support link.

**Architecture modules:** `api/waitlist` · optional Resend confirmation.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/waitlist` | `{ email }` |

---

## Mobile app

### A1: Welcome (Onboarding)

| Field | Detail |
|-------|--------|
| **Screen name** | Welcome |
| **PRD #** | 1 |
| **MVP / Future** | **MVP** |
| **Purpose** | Value proposition and entry to sign up or sign in |
| **User flow** | UserFlows §2 · §3 |

**Entry point(s):**

- First app open (unauthenticated)
- After sign out from Profile

**Exit point(s):**

- **Create account / Get started** → A2 Auth (sign up)
- **Sign in** → A2 Auth (sign in)

**Components on screen:**

- Brand wordmark / hero visual
- Value proposition copy (Brand.md)
- Primary CTA: create account
- Secondary CTA: sign in

**Primary user goal:** Decide to create an account or sign in.

**Success state:** User proceeds to Auth.

**Empty state:** N/A.

**Error state:** N/A.

**Architecture modules:** None (client-only).

**APIs:** None.

**Providers:** None.

---

### A2: Authentication (Privy)

| Field | Detail |
|-------|--------|
| **Screen name** | Auth |
| **PRD #** | 2 |
| **MVP / Future** | **MVP** |
| **Purpose** | Sign up or sign in via Privy; trigger invisible wallet + account provisioning |
| **User flow** | UserFlows §2 · §3 |

**Entry point(s):**

- A1 Welcome

**Exit point(s):**

- Sign up success → You're in confirmation (optional) → A4 Home (or Add Money stack) — **no A3 Pia intro at V1**
- Sign in success → A4 Home

**Components on screen:**

- Email or phone input
- OTP / passkey verification (Privy SDK)
- Loading state during account sync
- Error / retry messaging

**Primary user goal:** Authenticate securely without crypto steps.

**Success state:** Privy session established; `POST /auth/sync` completes; user proceeds.

**Empty state:** N/A.

**Error state:** Verification failed, timeout, sync error — retry + support path.

**Architecture modules:** `auth/` · `users/` · `wallets/` · `ledger/` (init).

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/auth/sync` | User + wallet provision |

**Providers:** Privy (mobile SDK + server verify) · Base (wallet on chain, internal).

---

### A3: Pia Introduction (onboarding moment) — **Not V1**

| Field | Detail |
|-------|--------|
| **Screen name** | Pia Introduction |
| **V1 launch** | **Not shipped** — V1 uses Pia-free onboarding; static Coming soon card on A16 Profile only |
| **Type** | Inline card / modal — **not** a separate flow |
| **MVP / Future** | **Post-V1** (broader prototype spec) |
| **Purpose** | Brief first-time introduction to Pia before Home |
| **User flow** | UserFlows §2 |

**Entry point(s):**

- A2 Auth — **first registration only** (skipped on login)

**Exit point(s):**

- **Continue** → fund-now prompt or A4 Home
- **Add Funds** → A5 Add Funds
- **Explore app** → A4 Home

**Components on screen:**

- Pia greeting card, e.g. *Hi, I'm Pia. I'll help you understand your money, answer questions, and support your goals along the way.*
- Continue button
- Optional: Add Funds / Explore app choice

**Primary user goal:** Feel welcomed; know Pia exists as a coach.

**Success state:** User dismisses moment; no chat required.

**Empty state:** N/A.

**Error state:** Skipped only if auth sync fails before display.

**Architecture modules:** None (static UI; chat is A15).

**APIs:** None.

---

### A4: Home Dashboard

| Field | Detail |
|-------|--------|
| **Screen name** | Home (Dashboard) |
| **PRD #** | 3 |
| **Tab** | Home |
| **MVP / Future** | **MVP** |
| **Purpose** | Answer *What is the most helpful next step right now?* — state-aware progress check-in, not a traditional banking dashboard |
| **User flow** | UserFlows §4 · [NavigationMap.md § Dynamic Home Dashboard States](./NavigationMap.md#dynamic-home-dashboard-states) |

**Entry point(s):**

- A2/A3 onboarding completion
- A2 login
- Default tab on return visit
- Back navigation from stack flows

**Exit point(s):**

- **State-emphasized actions** (see [Dynamic Home Dashboard States](#dynamic-home-dashboard-states)) — primary CTAs vary by lifecycle state
- Quick actions → A5 Add Funds · A7 Send · A8 Receive · A15 Pia (Send/Receive always reachable; emphasis shifts by state)
- State-specific → A10 Savings · A11 Create Goal · A12 Goal Detail · A13 Growth Account
- Activity row → A9 Transaction Detail
- Bottom tabs → A10 Savings · A14 Card · A16 Profile
- Withdraw → A6 (from quick action or menu if exposed on Home)

**Components on screen:**

- **State-aware content block** — greeting, headline, and hero metric driven by active dashboard state (NavigationMap § Dynamic Home Dashboard States)
- Personal greeting + encouraging headline (UserFlows §4; copy varies by state — progress over balance)
- Featured goal + progress % (State 3 Goal Builder; State 5 Mature User)
- Growth earnings summary (State 4 Growth User; State 5 Mature User)
- Money available (secondary — not hero in States 1, 3, 4)
- **Primary actions** — state-dependent: Add Funds · Send · Receive · Create Goal · Growth Account · Add to goal · View goal · Review progress · *(Pia: Coming soon card on Profile at V1 — no Ask Pia)*
- Secondary quick actions: Send · Receive (de-emphasized when not the next best step)
- Recent activity list (preview)
- Processing / inline state components

**Primary user goal:** Understand momentum and take the most helpful next step for where she is in her journey.

**Success state:** Correct dashboard state resolved; data loaded; user feels guided — not lectured by balances.

**Empty state:** Maps to **State 1 — New User**. Lead with **Your account is ready**, **Add your first funds to begin using Olimpia**, and **Add Funds**. `$0.00` may remain visible only as secondary information. Do not promise immediate earning or automatic Growth enrollment.

**Error state:** Balance/activity load fail — retry / pull-to-refresh.

**Architecture modules:** `ledger/` · `users/` · `goals/` (read) · `growth/` (read).

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/balance` | Available, goals, growth, total |
| GET | `/api/v1/activity` | Recent transactions |

---

### A5: Add Funds

| Field | Detail |
|-------|--------|
| **Screen name** | Add Funds |
| **PRD #** | 4 |
| **Type** | Stack / modal |
| **MVP / Future** | **Post-V1** — Coinbase Headless preserved, not mounted in the V1 tab shell |
| **Purpose** | Fiat Add Money (Coinbase Headless / Apple Pay) for a later release. **Not** the V1 funding path. |
| **User flow** | UserFlows §5 |

**Entry point(s):**

- Not shown on V1 Home. Preserved code: `AddMoneyScreen` / `CoinbaseCheckoutWebView`.
- Post-V1: A4 Home — Add Funds

**Exit point(s):**

- Success / dismiss → A4 Home
- Cancel → A4 Home

**Components on screen (post-V1, preserved):**

- Amount / review / Coinbase Guest Checkout ToS
- Email / SMS verification
- Apple Pay WebView (`paymentLink`); never a hidden background WebView
- **Inline states:** pending · processing · completed · failed · cancelled · reversed

**V1 note:** Active funding is **A8 Receive USDC**. Do not treat A5 as a launch dependency. Do not delete this screen.

**Yield rule:** Funding does not automatically start Growth.

**Primary user goal (post-V1):** Add dollars via Apple Pay / card when fiat onramp ships.

**Success state:** `completed` — *Money added*; balance updated.

**Empty state:** N/A (amount defaults empty).

**Error state:** `failed` — retry + support; validation on amount/method.

**Architecture modules:** `funding/` · `ledger/` · `webhooks/` · `notifications/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/funding/deposits` | Start deposit / onramp session (post-V1) |
| GET | `/api/v1/funding/deposits/:id` | Poll status |

**Providers:** Coinbase Headless Onramp (post-V1 only).

---

### A6: Withdraw Money

| Field | Detail |
|-------|--------|
| **Screen name** | Withdraw Money |
| **Type** | Stack / modal (not a PRD numbered screen) |
| **MVP / Future** | **Deferred** — not App Store V1 ([ADR-014](../architecture/ArchitectureDecisionLog.md)); no off-ramp provider selected |
| **Purpose** | Off-ramp available balance to linked bank (post-V1) |
| **User flow** | UserFlows §6 |

**Entry point(s):**

- A4 Home
- A16 Profile

**Exit point(s):**

- Success / dismiss → A4 Home or A16 Profile
- Insufficient available → prompt to A12 Goal Detail or A13 Growth to free funds

**Components on screen:**

- Amount input
- Bank destination selector (`GET /funding/destinations`)
- Review summary
- Confirm
- **Inline states:** pending · processing · completed · failed

**Primary user goal:** Move money to bank when life requires it.

**Success state:** `completed` — *Withdrawal complete*.

**Empty state:** No linked bank — prompt to link through the selected off-ramp provider flow.

**Error state:** Insufficient **available** balance; `failed` — retry + support.

**Architecture modules:** `funding/` · `ledger/` · `webhooks/` · `notifications/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/funding/withdrawals` | Start withdrawal |
| GET | `/api/v1/funding/withdrawals/:id` | Poll status |
| GET | `/api/v1/funding/destinations` | Linked banks |

**Providers:** Off-ramp provider **TBD** · Resend.

---

### A7: Send Money

| Field | Detail |
|-------|--------|
| **Screen name** | Send Money |
| **PRD #** | 5 |
| **Type** | Stack / modal (multi-step on one flow) |
| **MVP / Future** | **MVP** |
| **Purpose** | P2P send to Olimpia user by handle, phone, or email |
| **User flow** | UserFlows §7 |

**Entry point(s):**

- A4 Home — Send

**Exit point(s):**

- Success → A4 Home or A9 Transaction Detail
- Cancel → A4 Home

**Components on screen:**

- Recipient search / entry
- Amount input
- Optional note
- Review / confirm step
- Biometric / PIN confirm (if enabled)
- Success confirmation (inline or modal)
- **Inline states:** pending · processing · completed · failed

**Primary user goal:** Pay someone easily.

**Success state:** `completed` — *Sent*.

**Empty state:** N/A.

**Error state:** Recipient not found; insufficient balance; `failed` send.

**Architecture modules:** `transfers/` · `users/` · `ledger/` · `wallets/` · `notifications/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/transfers` | Send |
| GET | `/api/v1/users/lookup?q=` | Resolve recipient |

**Providers:** Base (sponsored tx) · Resend (recipient email).

---

### A8: Receive Money

| Field | Detail |
|-------|--------|
| **Screen name** | Receive USDC |
| **PRD #** | 6 |
| **Type** | Stack / modal |
| **MVP / Future** | **V1 funding** |
| **Purpose** | Show the Privy wallet address so the user can send **USDC on Base** from Coinbase or another compatible wallet |
| **User flow** | UserFlows §8 |

**Entry point(s):**

- A4 Home — Receive USDC
- You’re In — Receive USDC

**Exit point(s):**

- Back → A4 Home

**Components on screen:**

- Authenticated Privy address
- QR code
- Copy Address
- Prominent **Base** network + **USDC** warning
- Beginner instructions for sending from Coinbase or another Base wallet

**Primary user goal:** Fund Olimpia by receiving USDC on Base.

**Success state:** Inbound USDC is detected; Home shows the real Privy USDC balance and the wallet transaction in Recent Activity. (Inbound detection and activity wiring are still unfinished.)

**Empty state:** Address unavailable — cannot copy or show QR until wallet sync succeeds.

**Error state:** Unsupported asset/network does not credit. Warning copy stays on screen.

**Architecture modules:** Privy wallet · `/me` · planned Privy Get Transactions / Base inbound confirmation.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/me` | Wallet address + `privyWalletId` |
| GET | `/api/v1/balance` | Home balance (intended: Privy USDC on Base) |

---

### A9: Transaction Detail

| Field | Detail |
|-------|--------|
| **Screen name** | Transaction Detail |
| **PRD #** | 7 |
| **Type** | Stack |
| **MVP / Future** | **MVP** |
| **Purpose** | Single transaction clarity — amount, type, status, counterparty |
| **User flow** | UserFlows §14 |

**Entry point(s):**

- A4 Home — activity row
- A14 Card — spend row
- A12 Goal Detail — goal activity row
- A7 Send — success (optional)

**Exit point(s):**

- Back → originating screen

**Components on screen:**

- Amount (USD)
- Type label (deposit, send, receive, card spend, goal move, growth move, etc.)
- Status (pending · processing · completed · failed)
- Date / time
- Counterparty or merchant (if applicable)
- Note (if applicable)

**Primary user goal:** Understand what happened with one transaction.

**Success state:** Detail loaded; plain-language labels.

**Empty state:** N/A.

**Error state:** Load fail — retry.

**Architecture modules:** `ledger/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/activity/:id` | Transaction detail |

---

### A10: Savings Goals (list)

| Field | Detail |
|-------|--------|
| **Screen name** | Savings |
| **PRD #** | 8 |
| **Tab** | Savings |
| **MVP / Future** | **MVP** |
| **Purpose** | List goals, total saved, entry to create and detail |
| **User flow** | UserFlows §9 |

**Entry point(s):**

- Bottom tab — Savings
- A13 Growth (related savings context)

**Exit point(s):**

- Goal row → A12 Goal Detail
- New Goal → A11 Create Goal sheet
- Pia Coming soon card on A16 Profile (static; **post-V1:** Ask Pia → A15)
- Growth entry → A13 Growth Account
- Tabs → A4 Home · A14 Card · A16 Profile

**Components on screen:**

- Total saved summary
- Goals list (name, progress %, allocated amount)
- **New Goal** button
- **Pia Coming soon** card (A16 Profile — static; no chat at V1)
- Link/surface to **Growth Account** (A13)
- Empty state when no goals

**Primary user goal:** See all goals and start or continue saving.

**Success state:** Goals list loaded with progress.

**Empty state:** No goals — CTA to create first goal (A11).

**Error state:** List load fail — retry.

**Architecture modules:** `goals/` · `ledger/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/goals` | List goals |

---

### A11: Create Goal (sheet)

| Field | Detail |
|-------|--------|
| **Screen name** | Create Goal |
| **Type** | Bottom sheet (not a full screen per PRD) |
| **MVP / Future** | **MVP** |
| **Purpose** | Name a goal, set target, optional date and initial allocation |
| **User flow** | UserFlows §9 |

**Entry point(s):**

- A10 Savings — **New Goal**

**Exit point(s):**

- Success → A12 Goal Detail
- Dismiss → A10 Savings

**Components on screen:**

- Goal name input
- Target amount (USD)
- Optional target date
- Initial allocation (optional) or *add later*
- Confirm / Cancel
- Validation errors inline

**Primary user goal:** Connect money to something meaningful (e.g. Girls Trip, First Home).

**Success state:** Goal created; celebration copy optional (Brand.md).

**Empty state:** Form fields empty — defaults.

**Error state:** Allocation exceeds available balance; missing required fields.

**Architecture modules:** `goals/` · `ledger/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/v1/goals` | Create goal |

---

### A12: Goal Detail

| Field | Detail |
|-------|--------|
| **Screen name** | Goal Detail |
| **PRD #** | 9 |
| **Type** | Stack |
| **MVP / Future** | **MVP** |
| **Purpose** | Progress, add/remove funds, goal-specific activity |
| **User flow** | UserFlows §9 · §10 · §11 |

**Entry point(s):**

- A10 Savings — goal row
- A11 Create Goal — on success

**Exit point(s):**

- Back → A10 Savings
- Add funds / Remove funds (inline on A12)
- Activity row → A9 Transaction Detail
- Pia Coming soon card on A16 Profile (static; **post-V1:** Ask Pia → A15)

**Components on screen:**

- Goal name + target
- Progress bar + %
- Allocated amount
- **Add funds** / **Remove funds** actions
- Goal-specific activity list
- **Pia Coming soon** card (A16 Profile — static; no chat at V1)

**Primary user goal:** Track and fund progress toward one goal.

**Success state:** Progress updated after allocate in/out.

**Empty state:** Goal with $0 allocated — prompt to add funds.

**Error state:** Allocate amount invalid; network error.

**Architecture modules:** `goals/` · `ledger/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/goals/:id` | Goal detail |
| PATCH | `/api/v1/goals/:id` | Update metadata |
| POST | `/api/v1/goals/:id/allocate` | Add/remove funds |

---

### A13: Growth Account

| Field | Detail |
|-------|--------|
| **Screen name** | Growth Account |
| **Type** | Surface on Savings tab or Home (inline / stack — not separate PRD #) |
| **MVP / Future** | **MVP** |
| **Purpose** | Put savings to work; view growth balance and estimated earnings; deposit/withdraw |
| **User flow** | UserFlows §12 |

**Entry point(s):**

- A10 Savings
- A4 Home (growth summary / CTA)

**Exit point(s):**

- Back → A10 or A4
- Deposit / withdraw inline flows on A13
- Pia Coming soon card on A16 Profile (static; **post-V1:** Ask Pia → A15)

**Components on screen:**

- Headline: *Put your savings to work.*
- Subhead: *Earn estimated yield while keeping the experience simple.*
- Amount in growth
- Estimated earnings (e.g. this month)
- Disclaimer (estimated, not guaranteed) — below headline, not dominant
- **Grow** / **Add to growth** action
- **Withdraw from growth** action
- **Inline states** for deposit/withdraw async
- **Pia Coming soon** card (A16 Profile — static; no chat at V1)

**Primary user goal:** Potentially earn more over time on part of savings.

**Success state:** Funds in growth; earnings visible; or withdraw back to available.

**Empty state:** $0 in growth — CTA to add from available balance.

**Error state:** Insufficient available (deposit) or growth balance (withdraw); provider `failed`.

**Architecture modules:** `growth/` · `ledger/` · `webhooks/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/growth` | Summary + earnings |
| POST | `/api/v1/growth/deposit` | Allocate to growth |
| POST | `/api/v1/growth/withdraw` | Withdraw from growth |

**Providers:** Aave intended behind the provider-neutral Growth Account (Architecture §13) · Base · LI.FI only if needed server-side.

---

### A14: Virtual Debit Card (Card tab)

| Field | Detail |
|-------|--------|
| **Screen name** | Card (Virtual Debit Card + Card Management) |
| **PRD #** | 10 |
| **Tab** | Card |
| **MVP / Future** | **MVP** (broader prototype) |
| **V1 launch** | **No — post-V1** (Gnosis Pay; deferred from BuildPlan v2.0) |
| **Purpose** | View virtual card, manage controls, see recent spends |
| **User flow** | UserFlows §13 |

*Card management (freeze, CVV reveal) is on this screen — no separate management screen.*

**Entry point(s):**

- Bottom tab — Card

**Exit point(s):**

- Spend row → A9 Transaction Detail
- Tabs → A4 Home · A10 Savings · A16 Profile

**Components on screen:**

- Virtual card visual (masked PAN)
- **Reveal CVV** (biometric / PIN gated)
- **Freeze / Unfreeze** toggle
- Card status (active / frozen)
- Recent card transactions
- First-visit card issuance (auto or activate)

**Primary user goal:** Spend from balance in real life; stay in control.

**Success state:** Card active; spends appear in activity.

**Empty state:** No spends yet — card still issuable/viewable.

**Error state:** Card unavailable (provider geography — Gnosis Pay); gated tab with plain copy; CVV auth fail; decline on spend (shown in activity).

**Architecture modules:** `card/` · `ledger/` · `webhooks/` · `notifications/`.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/card` | Card metadata |
| POST | `/api/v1/card/issue` | Issue virtual card |
| POST | `/api/v1/card/freeze` | Freeze / unfreeze |
| GET | `/api/v1/card/transactions` | Spend history |

**Providers:** Gnosis Pay · Resend (spend email).

---

### A15: Pia AI Chat

| Field | Detail |
|-------|--------|
| **Screen name** | Pia |
| **PRD #** | 11 |
| **Type** | Stack |
| **MVP / Future** | **Future** — functional coach **post-V1** |
| **V1** | Static **Coming soon** preview inline on A16 Profile only — not this stack screen |
| **Purpose** | Educational coach — guidance, goal coaching, progress reinforcement |
| **User flow** | UserFlows §16 |

**Entry point(s):**

- A16 Profile — Pia Coming soon card (static preview; **post-V1:** Ask Pia from Home/Savings/Growth)

**Exit point(s):**

- Back → entry screen
- Tab switch → any tab (conversation persisted)

**Components on screen:**

- Message thread (user + Pia bubbles)
- Suggested prompt chips (context-aware per entry)
- Text input + send
- Disclaimer footer (*Pia is your money coach, not a financial advisor*)
- Loading / error on send

**Primary user goal:** Understand money, build confidence, get support when unsure.

**Success state:** Helpful reply; user knows next step.

**Empty state:** No history — show suggested prompts.

**Error state:** Timeout, rate limit, network — retry message.

**Architecture modules:** `pia/` · `goals/` (context) · `growth/` (context) · `ledger/` (context).

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/pia/thread` | History + prompts |
| POST | `/api/v1/pia/messages` | Send message |

**Providers:** Anthropic API (server-side only).

---

### A16: Profile (includes Settings)

| Field | Detail |
|-------|--------|
| **Screen name** | Profile |
| **PRD #** | 12 |
| **Tab** | Profile |
| **MVP / Future** | **MVP** |
| **Purpose** | Account info, preferences, security, help, sign out — **settings merged here** |
| **User flow** | UserFlows §15 |

*There is no separate **Settings** screen in V1 (PRD §12). Notification, security, and linked bank preferences live on this screen.*

**Entry point(s):**

- Bottom tab — Profile

**Exit point(s):**

- Pia Coming soon card on A16 Profile (static; **post-V1:** Ask Pia → A15)
- Withdraw → A6 Withdraw
- Sign out → A1 Welcome
- Tabs → A4 Home · A10 Savings · A14 Card

**Components on screen:**

| Section | Notes |
|---------|-------|
| Account info | Name, email, username (receive handle) |
| **Settings: Notifications** | Preferences — `PATCH /me` |
| **Settings: Security** | Biometric toggle, etc. |
| Linked withdrawal destination | Bank via replacement off-ramp provider (TBD) |
| Help / Support | Email or link |
| **Pia Coming soon** | Static card on Profile — visible at V1; no chat, input, or navigation (**post-V1:** Ask Pia → A15) |
| Sign out | Privy logout |

**Primary user goal:** Manage account and feel secure.

**Success state:** Profile loaded; preference saves succeed.

**Empty state:** N/A.

**Error state:** Load or PATCH fail — retry / toast.

**Architecture modules:** `users/` · `funding/destinations` (read) · Privy sign-out.

**APIs:**

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/v1/me` | Profile |
| PATCH | `/api/v1/me` | Update prefs / display name |

**Providers:** Privy · replacement off-ramp provider TBD (linked bank display).

---

## Navigation (canonical reference)

Screen-to-screen navigation, per-screen parent/child tables, user journey maps, and navigation audit live in **[NavigationMap.md](./NavigationMap.md) (v1.1)** — including:

- §1 Screen navigation map (mermaid flowchart)
- §2–§10 Marketing, mobile, onboarding, tab, modal, deep link, error, and empty-state navigation
- §11 Per-screen navigation reference (M1–M3, A1–A16)
- § Dynamic Home Dashboard States
- §12 User journey maps · §13 Navigation audit

This document (ScreenInventory) defines **what each screen contains**; NavigationMap defines **how screens connect**.

---

## 3. MVP screen count

| Category | Count | Notes |
|----------|-------|-------|
| **Marketing routes** | 2 | M1 Landing · M2 `/learn/usdc` |
| **Marketing overlays** | 1 | M3 Waitlist modal |
| **PRD mobile screens** | **12** | Existing inventory retained; canonical requirements are PRD §§12–18 |
| **Additional MVP mobile surfaces** | 4 | A3 Pia intro · A6 Withdraw · A11 Create Goal sheet · A13 Growth Account |
| **Total MVP surfaces** | **19** | 3 marketing + 16 mobile (A1–A16; A3/A6/A11/A13 beyond PRD # but required for MVP) |

**Consolidated PRD discipline:** 12 full screens + 4 sheets/modals/inline surfaces + 3 marketing = **19 user-facing surfaces**.

**Not counted as screens:** `llms.txt` (static file) · FAQ (section on M1) · async inline states on A5/A6/A7/A13 · Settings (sections inside A16).

---

## 4. Screens deferred to Future scope

Documented in PRD §21, Architecture §18, UserFlows — **not in V1 build**:

| Surface | Source | Reason |
|---------|--------|--------|
| **Full transaction history** | PRD §21 | Home preview + A9 Transaction Detail suffice |
| **Request money** | PRD §21 | Extend Receive later |
| **Separate Settings screen** | PRD §12 | Merged into A16 Profile |
| **Notifications center** | PRD deferred | Email + Profile prefs sufficient |
| **Physical card order** | Architecture §18 | Card deferred |
| **Pia thread delete** | PRD §21 | Functional Pia deferred |
| **Push notification UI** | Architecture §18 | Deferred |
| **Your Growth** progression view | UserFlows Future | Milestone system — not a screen in MVP |
| **AI Financial Advisor** | PRD §21 | Deferred |
| **Base App** | PRD / UserFlows | Later platform |
| **Claim-link receive** (unregistered payer) | Architecture §13 | Olimpia-to-Olimpia only for V1 |
| **Multi-provider yield picker** | Architecture §18 | Aave intended for V1 |

---

## Dynamic Home Dashboard States

A4 Home is **state-aware** — not always the same content. Each visit answers: **What is the most helpful next step right now?**

Home behaves as a **personal guide**, not a traditional banking dashboard. Progress and momentum take priority over raw balances. States describe **product behavior** — not visual design. Full state resolution, transition diagram, and navigation emphasis: [NavigationMap.md § Dynamic Home Dashboard States](./NavigationMap.md#dynamic-home-dashboard-states).

**No new screens.** All states render on A4 using existing stack destinations (A5, A10, A11, A12, A13). **Ask Pia → A15** is **post-V1**; at V1 launch, Pia appears only as the static Coming soon card on A16 Profile.

### State resolution (summary)

| Priority | State | Conditions |
|----------|-------|------------|
| 1 | **Mature User** | Multiple goals **and** growth allocation **and** regular activity |
| 2 | **Growth User** | Growth allocation exists (and not Mature) |
| 3 | **Goal Builder** | One or more goals (and not Growth or Mature) |
| 4 | **Funded User** | Has balance; no goals; no growth |
| 5 | **New User** | Account created; no funds; no goals; no growth |

### State 1: New User

**Conditions:** account created, no funds, no goals, no growth

**Example:**

```
Hi Sarah ✨
Let's get started.
Add funds to begin...
```

**Primary actions:** Add Funds, Send, Receive *(Pia: static Coming soon card on Profile — no Ask Pia at V1)*

**Goal:** first deposit

**A4 components emphasized:** onboarding-style greeting · first-deposit CTA · Pia Coming soon card on Profile (visible, non-interactive)  
**A4 components de-emphasized:** goal progress · growth earnings · balance-as-hero · Send · Receive

---

### State 2: Funded User

**Conditions:** has balance, no goals, no growth

**Example:**

```
Hi Sarah ✨
Your money is ready...
Create first goal or put savings to work
```

**Primary actions:** Create Goal, Growth Account, Send, Receive

**Goal:** move from holding to intentional use

**A4 components emphasized:** funded headline · Create Goal + Growth Account CTAs · Send · Receive  
**A4 components de-emphasized:** empty goal/growth slots · Send · Receive as primary CTAs

---

### State 3: Goal Builder

**Conditions:** one or more goals

**Example:**

```
Hi Sarah ✨
You're making progress.
Girls Trip Fund 43%
```

**Primary actions:** Add funds to goals, View goal details, Send, Receive

**Goal:** reinforce progress

**A4 components emphasized:** featured goal + progress % · add-to-goal / view-detail CTAs · Send · Receive  
**A4 components de-emphasized:** growth-first narrative · money available as hero

---

### State 4: Growth User

**Conditions:** growth allocation exists

**Example:**

```
Hi Sarah ✨
Your money is working for you.
Growth earnings +$12.48
```

**Primary actions:** View Growth, Add to Growth, Send, Receive

**Goal:** understand benefit of growth

**A4 components emphasized:** growth earnings summary · View Growth / Add to Growth CTAs · Send · Receive  
**A4 components de-emphasized:** goal-creation CTAs · available balance as hero

---

### State 5: Mature User

**Conditions:** multiple goals, growth, regular activity

**Example:**

```
Hi Sarah ✨
You're building more choices...
3 active goals, $42.18 growth
```

**Primary actions:** Review progress, Manage goals, Send, Receive

**Goal:** celebrate progress, mission

**A4 components emphasized:** multi-goal + growth summary · Review progress / Manage goals CTAs · Send · Receive · Pia Coming soon card on Profile (visible, non-interactive)  
**A4 components de-emphasized:** first-deposit or setup prompts · single-metric focus

---

## Document flow

```
PRD.md → Brand.md → Architecture.md → UserFlows.md → BuildPlan.md → ScreenInventory.md (this document) → NavigationMap.md → Implementation
```

Navigation structure and journey maps: [NavigationMap.md](./NavigationMap.md). Per-screen components and APIs: this document.

---

## User flow cross-reference

| UserFlows § | Surfaces |
|-------------|----------|
| §1 Marketing visitor | M1, M2, M3 |
| §2 Registration / onboarding | A1, A2, A3, A4, A5 (optional) |
| §3 Login | A1, A2, A4 |
| §4 Dashboard | A4, A9 |
| §5 Add money | A5 |
| §6 Withdraw | A6 |
| §7 Send money | A7, A9 |
| §8 Receive money | A8 |
| §9 Create savings goal | A10, A11, A12 |
| §10 Add funds to goal | A12 |
| §11 Remove funds from goal | A12 |
| §12 Growth account | A13, A4 (summary) |
| §13 Virtual debit card | A14, A9 |
| §14 Transaction history | A4, A9, A12, A14 |
| §15 Profile | A16 |
| §16 Pia AI chat | A15 (**post-V1**; V1 = Coming soon card on A16 only) |

---

## Approval checklist

- [ ] All MVP surfaces accounted for — no orphan screens
- [ ] Settings correctly merged into Profile (no separate screen)
- [ ] Create Goal documented as sheet, not full screen
- [ ] Card management on Card tab — no duplicate screen
- [x] Growth, savings goals, and Withdraw included as V1 launch requirements — see [V1Scope.md](./V1Scope.md)
- [x] Virtual card (A14) documented as **post-V1**
- [x] Pia AI chat (A15) documented as **post-V1**; V1 uses static preview on Profile only
- [ ] API mapping respects the mobile/backend boundary in Architecture §16
- [ ] Future deferrals aligned with PRD and Architecture
- [ ] Navigation map matches UserFlows entry/exit points — see [NavigationMap.md](./NavigationMap.md)
- [ ] Dynamic Home Dashboard States reviewed — five lifecycle states, no new screens

---

*End of ScreenInventory.md v1.1*
