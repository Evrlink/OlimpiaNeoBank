# Olimpia — User Flows

**Version:** 1.3  
**Status:** Draft for review  
**Purpose:** Define what the user experiences — and **why it matters** — before implementation planning (`BuildPlan.md`)  
**Source of truth:** [PRD.md](./PRD.md) (v2.0) · [Brand.md](../brand/Brand.md) (approved) · [Architecture.md](../architecture/Architecture.md) (v2.0)
**Scope:** Experience definition only — no code, no build tasks, no product redesign

**V1 launch (see [V1Scope.md](./V1Scope.md) · [V1Architecture.md](../V1Architecture.md)):** Active V1 funding is **Receive USDC on Base** into the Privy embedded wallet. Working **Receive USDC**, **real USDC balance**, **real wallet activity**, and **Grow** (deposit + withdraw back to the Privy wallet) are V1 goals. **Coinbase Headless / Apple Pay Add Money** is **post-V1** (code preserved, not mounted in the live app). **Pia** chat and **virtual card** are **post-V1**. Do not treat Add Money as the V1 funding path.

---

## Document conventions

| Term | Meaning |
|------|---------|
| **Marketing website** | Static landing page (`/`) + `/learn/usdc` — not the product |
| **Mobile app** | React Native app for **iOS and Android** (simultaneous launch) |
| **Screen** | PRD screen inventory (12 screens) or marketing section |
| **Inline state** | Processing, success, or error shown on the same screen — not a new screen |
| **Stack / modal** | Flow opened on top of a tab; user dismisses to return |

**Platform note:** **Base App** is explicitly **later** — out of MVP user flows.

**User-facing rule:** Balances, amounts, and actions are in **dollars**. No wallets, gas, chains, tokens, or protocol names in the mobile app.

**Async money flows** use the normalized backend states from Architecture §9: `pending` · `processing` · `completed` · `failed` · `cancelled` · `reversed`. The UI may combine pending and processing, and only shows cancelled/reversed where a rail can emit them.

**Outcome-driven framing:** Each flow includes **Why This Matters** — the benefit to the user, not what the product does. Copy connects actions to the brand mission: *More choices. More freedom.*

---

## Flow index

| # | Flow | Surface |
|---|------|---------|
| 1 | [Marketing website visitor](#1-marketing-website-visitor-flow) | Website |
| 2 | [Registration and onboarding](#2-registration-and-onboarding) | Mobile app |
| 3 | [Login](#3-login) | Mobile app |
| 4 | [Dashboard](#4-dashboard) | Mobile app |
| 5 | [Add money](#5-add-funds) | Mobile app — **post-V1** Coinbase Headless |
| 6 | [Withdraw money](#6-withdraw-money) | Mobile app — **post-V1** bank off-ramp |
| 7 | [Send money](#7-send-money) | Mobile app — **not V1** (P2P) |
| 8 | [Receive USDC](#8-receive-money) | Mobile app — **V1 funding** |
| 9 | [Create savings goal](#9-create-savings-goal) | Mobile app |
| 10 | [Add funds to savings goal](#10-add-funds-to-savings-goal) | Mobile app |
| 11 | [Remove funds from savings goal](#11-remove-funds-from-savings-goal) | Mobile app |
| 12 | [Growth account / USDC yield](#12-growth-account--usdc-yield) | Mobile app |
| 13 | [Virtual debit card](#13-virtual-debit-card) | Mobile app |
| 14 | [Transaction history](#14-transaction-history) | Mobile app |
| 15 | [Profile](#15-profile) | Mobile app |
| 16 | [Pia AI chat agent (post-V1)](#16-pia-ai-chat-agent-post-v1) | Mobile app — **not V1** |

---

## 1. Marketing website visitor flow

### Why This Matters

A visitor wants to know whether this is a place where **her** financial life could feel clearer, calmer, and more within reach — without wading through jargon or feeling talked down to. She may be looking for:

- Hope that saving, spending, and growing money can fit into real life
- Proof that the experience is built for women, not generic "users"
- A low-pressure way to learn more before committing — or to join a waitlist and stay in the loop
- Reassurance that this is about **confidence and progress**, not crypto speculation

Every step should move her toward a simple question: *Could this help me create more choices for myself over time?*

**User goal:** Understand what Olimpia is, build trust, and take a next step — download the app, join the waitlist, or learn about USDC.

**Entry point:** Direct visit, search, social link, or referral to `olimpia` marketing URL (`/`).

**Screens / sections involved:**

| Step | Location |
|------|----------|
| Landing page | `/` — Navigation, Hero, Product Preview, Built Around Real Life, Pia preview, Trusted Infrastructure, Features, How It Works, FAQ, Final CTA, Footer |
| USDC education (optional) | `/learn/usdc` — linked from Hero **USDC** text |
| Waitlist modal | Overlay — triggered by Download / Waitlist CTAs |

**User actions:**

1. Scroll or use nav links: **Features** · **How It Works** · **FAQ**
2. Read hero, product mockup, goal examples, feature pillars, 4-step How It Works
3. Optionally tap **USDC** → read `/learn/usdc` (stablecoins, why Olimpia uses USDC, beginner yield explanation)
4. Tap **Learn More** → scroll to `#features`
5. Tap **Download the App** or nav **Download / Join Waitlist** → enter email in waitlist modal → **Join waitlist**
6. When live: tap App Store or Google Play badges in footer or modal
7. Optionally expand FAQ accordion; follow links to `/learn/usdc` from USDC/stablecoin answers

**Success state:**

- Visitor understands Olimpia is a financial app for women focused on save, spend, and grow — not a crypto trading product
- Pre-launch: waitlist confirmation shown inline in modal (*You're on the list*)
- Post-launch: visitor reaches correct store listing (iOS or Android)

**Failure state:**

- Waitlist submit fails → inline error with retry and support email link
- Broken anchor or mobile layout → visitor can still reach footer and primary CTA

**Exit state:**

- Visitor leaves site, returns to scroll, or navigates to App Store / Google Play
- From `/learn/usdc`, visitor returns to homepage via back link or logo

**Notes:** No account, wallet, or live Pia chat on the website. Pia section is a static preview of the in-app coach.

---

## 2. Registration and onboarding

### Why This Matters

Starting should feel possible — not like signing up for something complicated or intimidating. A new user wants to:

- Take the first step toward managing money in one clear place
- Feel welcomed, not judged for what she doesn't know yet
- Meet a supportive guide (Pia) teased on Profile as **Coming soon** — functional coach is post-V1
- Reach a calm home base quickly, without technical overwhelm

Getting started is about **opening a door** — not mastering a system. The sooner she feels "I can do this," the closer she is to building real financial momentum. *More choices. More freedom* begins with feeling capable enough to begin.

**User goal:** Create an Olimpia account quickly and reach the app without seeing crypto mechanics.

**Entry point:** First app open after install from App Store or Google Play → **Welcome** screen.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Welcome | 1 | Value proposition + primary CTA to create account |
| Auth | 2 | Sign up: email/phone + verification (passkey or OTP per Privy) |
| You're in (sign-up) | — | Optional post-sign-up confirmation before Home |
| Home | 3 | Dashboard — first landing after auth |

**User actions:**

1. Open app → view Welcome copy
2. Tap create account / get started → Auth flow
3. Enter email or phone → complete verification (OTP or passkey)
4. *(Automatic)* Invisible wallet and Olimpia account provisioned — **no user step**
5. See brief confirmation moment (sign-up path) or land directly on Home (sign-in path)
6. **V1 — Pia:** No onboarding chat or introduction. User discovers Pia later as a static **Coming soon** card on **Profile** (no interaction).
7. Choose **Add Funds** or **Explore app** (sign-up path)
8. Arrive on Home dashboard

**Success state:**

- Account created; user is authenticated
- User has seen optional sign-up confirmation; Pia teased on Profile as Coming soon only
- Zero-balance Home leads with **Your account is ready** and **Add your first funds to begin using Olimpia**; `$0.00` may appear as secondary information
- Zero crypto vocabulary shown during onboarding
- Target: reach Home in under ~3 minutes (PRD)

**Failure state:**

- Verification fails or times out → clear error on Auth; retry or change contact method
- Network error during account sync → retry CTA; do not expose technical errors

**Exit state:**

- User on **Home** tab (explore path) or **Add Funds** stack (fund-now path)
- Returning users with existing session may skip Welcome → see [Login](#3-login)

---

## 3. Login

### Why This Matters

Returning should feel seamless — like picking up a conversation, not starting over. A returning user wants to:

- Get back to her balance, goals, and progress without friction
- Feel continuity: *my money is still here, my plan is still intact*
- Resume daily life — check in, send, save, or grow savings — without re-explaining herself

Reliable access supports the habit of staying engaged with money on her own terms. That ongoing connection is what turns a one-time signup into **lasting confidence**.

**User goal:** Sign back into an existing account securely.

**Entry point:** App open with expired or no local session → **Welcome** → **Sign in** on Auth screen.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Welcome | 1 | Entry; sign-in path |
| Auth | 2 | Sign in: email/phone + verification |
| Home | 3 | Dashboard after successful auth |

**User actions:**

1. Open app → Welcome
2. Tap **Sign in** → Auth
3. Enter registered email or phone → complete verification
4. *(Automatic)* Session restored; wallet linked to existing user
5. Land on Home with current balance and activity

**Success state:**

- User authenticated; Home shows live balance and recent activity
- No re-onboarding, Pia introduction, or wallet setup steps

**Failure state:**

- Unknown account → friendly message; offer sign-up path
- Verification failed → retry on Auth screen
- Session sync error → retry; support link if persistent

**Exit state:**

- User on **Home** tab with bottom navigation available
- Sign out from Profile returns user to Welcome (see [Profile](#15-profile))

---

## 4. Dashboard

### Why This Matters

The dashboard answers one quiet question: **"How am I doing?"**

It should feel encouraging and motivating — not like a cold ledger. A user opens Home to sense:

- Progress toward personal goals — *Am I getting closer to the trip, the home, the fund I named?*
- Growth on savings — *Is part of my money working for me?*
- Recent wins — a deposit, a milestone, money moved toward something meaningful
- Overall momentum — *Am I building something, or just watching numbers?*

Home is a **confidence check-in**, not a transaction terminal. When it feels supportive, she is more likely to take the next step that expands her options. *More choices. More freedom.*

**User goal:** See where money stands at a glance and start a common action.

**Entry point:** **Home** tab after login/onboarding; or return visit opening app to last session.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Home | 3 | Balance, quick actions, recent activity |

**User actions:**

1. View total balance (dollars)
2. Scan recent activity list (deposits, sends, receives, card spends, goal moves, growth)
3. Tap quick action: **Add Money** · **Send** · **Receive** *(V1: no Ask Pia — Pia Coming soon card on Profile only)*
4. Tap activity row → Transaction Detail
5. Switch tabs: Savings · Card · Profile

**Example dashboard state (directional):**

Home should read like a **progress check-in**, not a bank statement. Illustrative copy for a returning user with an active goal and growth:

```
Hi Sarah ✨
You're making progress.

Girls Trip Fund
43% complete

Growth earnings this month
+$12.48

Money available
$1,245
```

| Element | Intent |
|---------|--------|
| **Personal greeting** | Warm, human — uses first name; light sparkle acceptable (playfulness 6/10) |
| **Encouraging headline** | Answers *How am I doing?* before showing numbers |
| **Featured goal + %** | Connects money to something meaningful; progress feels visible |
| **Growth earnings this month** | Recent win — plain dollars; ties to *potentially earn more over time*, not technical yield jargon |
| **Money available** | Spendable clarity — not "available balance" jargon on first read |

Quick actions (Add · Send · Receive) and recent activity sit below this encouraging summary. Multiple goals may rotate or list on Savings; Home highlights **momentum**, not every ledger line.

**Success state:**

- Balance and activity reflect latest completed transactions
- User feels oriented and encouraged — greeting, headline, goal progress, growth earnings, and money available visible as in example above where applicable
- Empty state (new user): friendly prompt that invites a first meaningful step, not a blank wall
- Processing items show clear in-progress copy in activity feed

**Failure state:**

- Balance or activity fails to load → inline error with pull-to-refresh or retry
- Stale processing item → continues showing *Processing…* until backend resolves; user can leave and return

**Exit state:**

- User remains on Home or navigates to another tab or stack flow
- Default resting surface for day-to-day use

---

## 5. Add Funds

> **Post-V1.** Coinbase Headless / Apple Pay Add Money is preserved in the repo and **must not** control the V1 user journey. Active V1 funding is [Receive USDC](#8-receive-money). Do not treat this flow as a launch dependency.

### Why This Matters

Funding is the moment money becomes **real and usable** — and the starting point for everything she wants to build. A user adds money because she wants to:

- Add funds so the account is ready to use
- Choose a method based on what she already has and how quickly she needs it
- Start working toward named goals — a trip, a cushion, a dream she actually cares about
- Create more **financial flexibility** over time — to spend, save, send, or adapt when life shifts

Adding money is not about "activating a product." It is about **giving future-you more options**. *More choices. More freedom.*

**User goal (post-V1 only):** Add funds via **Add Money** (Coinbase Headless). V1 users fund with **Receive USDC**, not this chooser.

**Entry point (post-V1):** Home → **Add Funds** quick action. Not mounted in the current V1 tab shell.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Add Funds | 4 | Provider-neutral method selection and inline async states |
| Home | 3 | Updated balance after success |

**User actions:**

1. Tap **Add Funds** on Home.
2. Choose **Add Money** or **Transfer USDC**.
3. **Add Money:** enter/confirm amount; continue to Coinbase Headless Onramp; review the provider's final USDC quote and fee; complete any required identity verification. Coinbase delivers USDC to the user's Privy wallet on Base.
4. **Transfer USDC:** open **Receive USDC**; view the authenticated address, QR, Copy Address, and prominent **Base network** label; follow beginner Coinbase instructions or send from another compatible wallet.
5. Wait through normalized inline states; the backend distinguishes pending/processing and may also return failed, cancelled, or reversed.
6. See success → updated balance on Home; new activity row.

**Method chooser hierarchy (post-V1):** If Add Money ships later, keep provider names out of primary labels. V1 does not show this chooser.

**Disclosure rules:**

- Never hardcode unverified arrival estimates; use confirmed provider / network data.
- Never promise an exact USDC amount before the Coinbase quote or guarantee instant wallet arrival.
- Funds become eligible for Growth only after settlement, compliance checks, and required authorization; no automatic earning claim.
- Keep normal navigation unless user testing validates focus mode. Provider checkout/confirmation always has cancel, close, or return.

> Wireframe copy and layout are conceptual requirements, not final spacing, visual design, or pixel-perfect screens.

**Success state:**

- Status `completed` — *Money added*
- Available balance increased
- Activity shows deposit; confirmation email sent (Resend)

**Failure state:**

- Status `failed` — *We couldn't complete this deposit*
- Retry CTA + support link
- User can cancel during review before confirm

**Exit state:**

- Dismiss Add Funds → return to **Home** with success or neutral state
- User may chain into Send, Goals, or Growth flows

---

## 6. Withdraw money

> **Deferred — not App Store V1.** No off-ramp provider is selected ([ADR-014](../architecture/ArchitectureDecisionLog.md)). Do not implement this flow for the current sprint. Spec retained for a later release.

### Why This Matters

Life happens outside any app — rent, bills, emergencies, opportunities. A user withdraws because she needs:

- Access to **her** money when the real world requires it
- Flexibility to move funds back to a familiar bank account
- Peace of mind that savings are not trapped when priorities change

Withdrawal is an act of **control**, not exit. When it feels straightforward, she trusts that her money supports her life — not the other way around. That trust is what makes saving and growing feel safe in the first place.

**User goal:** Move available dollars from Olimpia back to a linked bank account.

**Entry point:** Home or Profile → **Withdraw** (stack/modal flow — Architecture §14 — deferred).

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Withdraw | — | Amount, bank destination, review, inline async states (stack from Home/Profile) |
| Home | 3 | Updated balance after success |

**User actions:**

1. Tap **Withdraw**
2. Enter amount
3. Select linked bank destination (off-ramp provider TBD when this ships)
4. Review summary (*$X will be sent to your bank*)
5. Confirm
6. Wait: *Preparing your withdrawal* → *Sending money to your bank*
7. See success; balance and activity update

**Success state:**

- Status `completed` — *Withdrawal complete*
- Available balance decreased
- Activity shows withdrawal; confirmation email sent

**Failure state:**

- Insufficient **available** balance (funds in goals or growth are not withdrawable directly) → friendly error explaining how to move money back first
- Status `failed` — *We couldn't complete this withdrawal* + retry + support
- No linked bank → prompt to link destination via Profile/funding settings

**Exit state:**

- Return to **Home** or **Profile**
- User may open Goal Detail or Growth to free available balance first

---

## 7. Send money

### Why This Matters

Money between people should feel **normal and easy** — not awkward, slow, or stressful. A user sends money because she wants to:

- Pay someone back without friction or follow-up messages
- Handle shared costs, gifts, or help without juggling multiple apps
- Feel capable in social money moments — dinner splits, favors, family support

Sending is about **relationships and everyday life**, not rails or protocols. When it works like she expects, money stops being a source of small anxieties and becomes something she handles with confidence.

**User goal:** Pay another Olimpia user by handle, phone, or email.

**Entry point:** Home → **Send** quick action.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Send Money | 5 | Recipient → amount + note → review → confirm → success |
| Transaction Detail | 7 | Optional — tap outgoing transfer from activity |
| Home | 3 | Updated balance |

**User actions:**

1. Tap **Send**
2. Find or enter recipient (username, phone, or email)
3. Enter amount and optional note
4. Review transfer details
5. Confirm (biometric / PIN if enabled)
6. Wait: *Preparing transfer* → *Sending*
7. See success confirmation

**Success state:**

- Status `completed` — *Sent*
- Sender available balance decreased
- Recipient receives funds and email notification
- Activity shows outgoing transfer

**Failure state:**

- Recipient not found (MVP: Olimpia users only) → validation error before confirm
- Insufficient available balance → clear error
- Status `failed` — *Couldn't send* + retry + support

**Exit state:**

- Return to **Home** or view **Transaction Detail**
- Recipient side: see [Receive money](#8-receive-money)

---

## 8. Receive money

> **V1 funding path.** This is Receive USDC on Base into the Privy embedded wallet — not Olimpia-user P2P receive. P2P receive remains out of V1.

### Why This Matters

Funding should feel like sending dollars she already has — from Coinbase or another wallet — not like opening a bank onramp. A user receives USDC because she wants to:

- Move money she already owns into Olimpia
- See a clear address and network so she does not send the wrong asset
- Watch the balance appear once the transfer arrives

Receive USDC is how V1 becomes **real and usable**. *More choices. More freedom.*

**User goal:** Fund Olimpia by sending **USDC on Base** to the Privy wallet address.

**Entry point:** Home → **Receive USDC**, or You’re In → **Receive USDC**.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Receive USDC | 6 | Privy address, QR, copy, Base + USDC instructions |
| Home | 3 | Real USDC balance and activity after inbound confirmation |

**User actions:**

1. Tap **Receive USDC**.
2. View the authenticated Privy wallet address, QR code, and **Base + USDC** warning.
3. Copy the address (or scan the QR) from Coinbase or another compatible Base wallet.
4. Send **USDC on Base only**.
5. *(Passive)* Wait until Olimpia detects the inbound Base transfer.
6. Home refreshes the real USDC balance; Recent Activity shows the wallet transaction.

**Success state:**

- Inbound USDC confirmed once
- Home shows the Privy Base USDC balance
- Activity shows the actual wallet transfer

**Failure state:**

- Unsupported asset or network does not credit the balance
- Clear warning remains on the Receive screen: transfers on the wrong network or asset may be unrecoverable

**Exit state:**

- Back → **Home**
- User can receive again anytime

**Notes:** Olimpia-user P2P receive and request-money are **not V1**.

---

## 9. Create savings goal

### Why This Matters

Goals turn vague intentions into **something she can see and feel progressing**. A user creates a goal because she wants to connect money to something meaningful — for example:

- **Girls Trip Fund** — joy and connection with friends
- **First Home Fund** — stability and a place of her own
- **Education Fund** — investing in herself and her future
- **Emergency Fund** — breathing room when life surprises her
- **Business Launch Fund** — independence and something she builds

Naming a target gives saving a **why**. Progress bars and milestones make abstract dollars feel like movement toward a life she is choosing — not deprivation. That is how intentions become progress. *More choices. More freedom.*

**User goal:** Name a savings target and start tracking progress.

**Entry point:** **Savings** tab → **New Goal** (bottom sheet).

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Savings | 8 | Goals list; opens New Goal sheet |
| New Goal | — | Bottom sheet: name, target, optional date, optional initial allocation |
| Goal Detail | 9 | Progress view after creation |
| Pia | 11 | **Post-V1** — functional coach (V1: Coming soon preview on Profile only) |

**User actions:**

1. Open **Savings** tab
2. Tap **New Goal**
3. Enter goal name (e.g. *Girls Trip Fund*)
4. Enter target amount (USD)
5. Optionally set target date
6. Optionally allocate initial amount from available balance, or choose *add later*
7. Confirm → goal created
8. View Goal Detail with progress bar and allocated amount

**Pia (V1):** Static **Coming soon** card on **Profile** only — no chat from Savings or Growth at V1. **Post-V1:** optional **Ask Pia** entry opens [Pia chat](#16-pia-ai-chat-agent-post-v1).

**Success state:**

- Goal appears on Savings list with progress %
- If initial allocation: available balance reduced; goal allocated amount increased
- Milestone celebration copy may appear per Brand.md (first goal, etc.)

**Failure state:**

- Initial allocation exceeds available balance → error on sheet; adjust amount
- Missing required fields → inline validation on sheet

**Exit state:**

- **Goal Detail** screen or back to **Savings** list
- User may add more funds via [flow 10](#10-add-funds-to-savings-goal)

---

## 10. Add funds to savings goal

### Why This Matters

Allocating to a goal is a small act of **commitment to herself**. A user adds funds because she wants to:

- See visible progress — the bar moves, the dream feels closer
- Build momentum week by week instead of hoping it happens someday
- Reinforce that this goal is real, not just a name on a list
- Feel the satisfaction of choosing her future over impulse

Every allocation is proof she is **showing up for something she cares about**. That rhythm of progress builds confidence that carries into other parts of her financial life.

**User goal:** Move money from available balance into a specific goal.

**Entry point:** **Savings** → **Goal Detail** → **Add funds**.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Goal Detail | 9 | Progress, add/withdraw controls, goal activity |
| Savings | 8 | List reflects updated allocation |
| Pia | 11 | **Post-V1** — V1: Coming soon preview on Profile only |

**User actions:**

1. Open goal from Savings list
2. Tap **Add funds** (or equivalent allocate-in action)
3. Enter amount to move from available balance
4. Confirm
5. See updated progress bar and allocated amount
6. View goal-specific activity entry
7. *(Post-V1)* Tap **Ask Pia** for goal coaching — not available at V1 launch

**Success state:**

- Goal `allocatedUsd` increased; progress % updated
- Available balance decreased by same amount
- Goal activity shows allocation in

**Failure state:**

- Amount exceeds available balance → friendly error; suggest lower amount or Add Money first
- Network error → retry on Goal Detail

**Exit state:**

- Remain on **Goal Detail** or navigate to **Savings** / **Home**

---

## 11. Remove funds from savings goal

### Why This Matters

Priorities change — and money should move with life, not punish it. A user removes funds from a goal because she needs to:

- Free money for something urgent or more important right now
- Adjust when a timeline, plan, or circumstance shifts
- Keep control without guilt — goals serve her, not the other way around

Flexibility is not failure. Being able to reallocate without shame helps her stay honest about what she needs today while still believing she can save again tomorrow. **More choices** means money can adapt when she does.

**User goal:** Move money from a goal back to available balance for spending, sending, or withdrawing.

**Entry point:** **Savings** → **Goal Detail** → **Withdraw from goal** (or remove funds).

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Goal Detail | 9 | Progress, add/withdraw controls |
| Home | 3 | Available balance increased — optional check |

**User actions:**

1. Open goal from Savings list
2. Tap **Remove funds** / **Withdraw from goal**
3. Enter amount (up to goal allocated amount)
4. Confirm
5. See progress bar and allocated amount decrease
6. Available balance increases
7. *(Post-V1)* Tap **Ask Pia** for guidance — not available at V1 launch

**Success state:**

- Goal allocation reduced; progress % updated
- Available balance increased
- Goal activity shows allocation out

**Failure state:**

- Amount exceeds goal allocated balance → validation error
- Network error → retry

**Exit state:**

- **Goal Detail**, **Savings**, or **Home**
- Freed funds available for Send, Card, Withdraw, or Growth

---

## 12. Growth account / USDC yield

### Why This Matters

Growth is for the user who wants part of her savings to **work quietly in the background** — without becoming an investor overnight. She may want to:

- Put part of her savings to work while she focuses on life
- Potentially earn more over time on money she is not spending right now
- Create more opportunities and choices in the future — a cushion that compounds calm, not anxiety
- Feel that idle dollars are not wasted dollars

Growth is about **expanding options over time**, not chasing returns or learning DeFi. The user-facing promise is simple: **potentially earn more over time** — not jargon about variable earnings. The emotional outcome is hope and forward motion, not speculation. *More choices. More freedom.*

**User goal:** Put part of savings to work and potentially earn more over time — without managing crypto or learning investing.

**Entry point:** **Savings** tab or **Home** → **Growth account** / **Grow your savings** (inline surface per Architecture — not a separate PRD screen).

**Growth surface copy (directional):**

The Growth screen should lead with plain, motivating language — not technical disclaimers first:

```
Put your savings to work.

Earn estimated yield while keeping the experience simple.
```

Supporting copy (below headline/subhead) may note that earnings are **estimated** and **not guaranteed** — but the hero message stays human and outcome-focused. Avoid leading with *estimated variable earnings* as the primary phrase; users respond more to **potentially earn more over time**.

**Screens involved:**

| Surface | Role |
|---------|------|
| Growth account view | Headline copy above; amount in growth; earnings this month / over time; simple disclaimer |
| Growth deposit / withdraw | Inline or stack — amount entry and confirm |
| Home / Savings | Balance buckets updated after move |
| Pia | 11 | **Post-V1** — V1: Coming soon preview on Profile only |

**User-facing name:** *Grow your savings* or *Growth account* — never protocol names or APY optimization language.

**Pia (Growth, V1):** No Ask Pia on Growth at V1. User sees static **Coming soon** card on **Profile**. **Post-V1:** Ask Pia entry opens [Pia chat](#16-pia-ai-chat-agent-post-v1) with growth context.

**User actions — deposit to growth:**

1. Open Growth account from Savings or Home
2. Read plain-language headline — *Put your savings to work* — and subhead; disclaimer present but not dominant
3. Tap **Grow** / **Add to growth**
4. Enter amount from available balance
5. Confirm
6. Wait: *Moving to growth* → *Growing* → *In growth account*
7. View amount in growth and earnings summary (e.g. *Growth earnings this month*)

**User actions — withdraw from growth:**

1. Open Growth account
2. Tap **Withdraw from growth**
3. Enter amount
4. Confirm
5. Wait: *Withdrawing from growth* → *Processing* → *Back in balance*
6. Funds return to available balance

**Success state:**

- Deposit: funds in growth; user sees plain-language confirmation and earnings summary — potentially earn more over time, with estimated disclaimer available
- Withdraw: funds back in available balance
- Brand-aligned celebration on first growth milestone (*You earned your first passive income*)

**Failure state:**

- Insufficient available balance (deposit) or growth balance (withdraw) → clear error
- Status `failed` on deposit/withdraw → retry + support
- Provider delay → extended *Processing…* with expectation-setting copy

**Exit state:**

- Return to **Home** or **Savings**
- Goals do **not** auto-earn yield — growth is separate from goal envelopes

**Notes:** Aave is the intended provider behind one Growth Account (Architecture §13). User never sees provider or DeFi mechanics in this flow.

---

## 13. Virtual debit card

### Why This Matters

A card bridges saving and **real life** — coffee, groceries, rent, the things she actually buys. A user wants a virtual debit card because she needs to:

- Spend from the same balance she saves and grows — without mental accounting gymnastics
- Pay like she already does everywhere else — tap, buy, move on
- Feel that her money is **part of daily life**, not locked in an abstract account
- Stay in control (freeze, review spends) without carrying stress into every purchase

When spending feels ordinary and safe, she is more likely to trust the whole system — and to keep building toward goals knowing life can still happen today.

**User goal:** View and control a virtual debit card and spend from available balance.

**Entry point:** **Card** tab.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Card | 10 | Virtual card display, freeze toggle, recent card spends |
| Transaction Detail | 7 | Tap a card spend row |

**User actions — card management:**

1. Open **Card** tab
2. First visit: card issued automatically or via activate action
3. View masked card number
4. Reveal CVV (auth-gated: biometric / PIN)
5. Toggle **Freeze** / **Unfreeze** card
6. Review recent card transactions

**User actions — spend at merchant:**

1. Use virtual card at merchant (Gnosis Pay rails)
2. Receive email notification (*You spent $X at…*)
3. See spend in Card recent activity and Home feed
4. Optional: tap spend → Transaction Detail

**Success state:**

- Card active and unfrozen; spend authorized and settled
- Status `completed` — *Spent at {merchant}*
- Available balance debited; activity updated on Home and Card

**Failure state:**

- Insufficient available balance → decline at merchant; *Declined* in activity
- Card frozen → spend blocked; user unfreezes on Card tab
- Card unavailable (Gnosis Pay not available in user's region) → gated tab with plain-language explanation; availability is provider-driven, not US-only by default
- CVV reveal fails auth → remain masked

**Exit state:**

- User on **Card** tab or **Transaction Detail**
- Card draws from **available balance** only — not goal or growth allocations

---

## 14. Transaction history

### Why This Matters

Clarity reduces anxiety. A user reviews activity because she wants to:

- Know what happened with her money — no mysteries, no nagging doubt
- Confirm a payment landed, a send went through, or a goal move looks right
- Feel **in control** instead of avoiding her account
- Spot patterns that help her feel smarter about next steps

History is not about auditing every cent. It is about **peace of mind** — the sense that her financial life is legible and manageable.

**User goal:** Review what happened with my money — recent activity and transaction details.

**Entry point:** **Home** recent activity list; **Card** recent spends; **Goal Detail** goal-specific activity.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Home | 3 | Recent activity preview (not full paginated history) |
| Card | 10 | Recent card spends |
| Goal Detail | 9 | Goal-specific movements |
| Transaction Detail | 7 | Single transaction: type, amount, status, counterparty, date |

**User actions:**

1. Scroll recent activity on Home (or Card / Goal Detail)
2. Tap any transaction row
3. View Transaction Detail: amount, type (deposit, send, receive, card spend, goal move, growth move), status, timestamp, note/counterparty where applicable
4. Dismiss back to originating screen

**Success state:**

- User understands what a transaction was and its final status
- Processing transactions show normalized in-progress copy
- Completed transactions show plain-language labels in Brand voice

**Failure state:**

- Detail fails to load → retry on Transaction Detail
- Unknown or stale status → show last known status; refresh on focus

**Exit state:**

- Return to **Home**, **Card**, or **Goal Detail**

**Notes:** Dedicated full transaction history screen is deferred (PRD §21). V1 uses Home preview + Transaction Detail.

---

## 15. Profile

### Why This Matters

Profile is where a user tends to the **container** around her money — identity, security, notifications, help. She visits because she wants to:

- Feel her account is hers — correct info, clear settings
- Stay secure without complexity
- Reach a human or helpful resource when something feels off
- Adjust how the app reaches her on her terms

Taking care of account basics supports the deeper outcome: **trusting** that this is a safe place to keep showing up. Trust is what makes saving, growing, and spending feel sustainable.

**User goal:** View account info, adjust preferences, get help, or sign out.

**Entry point:** **Profile** tab.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Profile | 12 | Account info, notifications, security, help, **Pia Coming soon** card (static), sign out |
| Welcome | 1 | After sign out |

**User actions:**

1. Open **Profile** tab
2. View name, email, username (receive handle)
3. Adjust notification preferences
4. Toggle security options (e.g. biometric)
5. View linked withdrawal destination (replacement off-ramp provider TBD)
6. Tap **Help / Support** → support email or link
7. View inline **Pia Coming soon** card (static — no chat, input, or navigation at V1)
8. Tap **Sign out** → confirm → Privy logout

**Success state:**

- Profile fields loaded from account
- Preference changes saved
- Sign out clears session; Welcome screen shown

**Failure state:**

- Profile load fails → retry with inline error
- PATCH preferences fails → error toast; previous values retained

**Exit state:**

- Remain on **Profile**, navigate to another tab, or **Welcome** after sign out
- Withdraw entry may also live here (Architecture §14)

---

## 16. Pia AI chat agent (post-V1)

> **V1 launch:** Pia appears only as a static **Coming soon** card on **Profile** — visible, non-interactive. No Ask Pia buttons, no chat thread, no AI responses, no Anthropic API. This flow applies **after V1** when functional Pia ships.
### Why This Matters (post-V1 functional coach)

- **Understand money more clearly** — concepts, tradeoffs, what something actually means for her life
- **Build confidence** — especially when finance has felt intimidating or exclusionary before
- **Get support when unsure** — a next step, a reframing, encouragement without judgment
- **Learn without feeling intimidated** — plain language, patience, no dumb questions

Pia is not there to impress her with expertise. She is there so money feels **talkable** — and so every answer points toward more agency, not more dependence. *More choices. More freedom.*

**User goal:** Get supportive, plain-language help — education, product guidance, goal coaching, or progress celebration — without financial advice.

**Entry point (post-V1):** Home → **Ask Pia** · Profile → **Ask Pia** · **Savings** / **Goal Detail** / **Growth** → **Ask Pia**.

**Context-aware entry (post-V1):** When opened from Savings or Growth, Pia receives relevant context (goals, growth summary) and may surface domain-specific suggested prompts.

**Screens involved:**

| Screen | PRD # | Role |
|--------|-------|------|
| Pia | 11 | Message thread, suggested prompts, text input, disclaimer footer |
| Home / Profile / Savings / Goal Detail / Growth | — | Entry points |

**User actions:**

1. Tap **Ask Pia**
2. See existing thread history (if any) and disclaimer (*Pia is your money coach, not a financial advisor*)
3. Tap suggested prompt chip or type a question
4. Send message
5. Read Pia reply in conversational bubbles
6. Continue conversation or navigate back

**Example user questions (in scope):**

- *How do savings goals work?*
- *What is growth?*
- *Am I on track for my trip fund?*
- *How do I add money?*

**Pia may:**

- Explain USDC/stablecoins and growth at beginner level
- Guide Olimpia features (add money, goals, growth, card, send/receive)
- Reference user's goals and progress from context
- Celebrate milestones (first goal, growth started)

**Pia must not (guardrails):**

- Recommend specific investments or assets
- Provide personalized financial, tax, or legal advice
- Suggest trading, swapping, or speculation
- Instruct wallet, key, or gas management

**Success state:**

- Helpful on-brand reply within a few seconds
- User feels more confident about next step
- Refusal responses are friendly when question is out of scope (*I'm your coach, not an advisor — here's what I can help with…*)

**Failure state:**

- Network or API timeout → *Pia couldn't respond right now* + retry
- Rate limit reached → gentle message to try again later
- Blocked output (guardrail) → safe refusal copy returned to user

**Exit state:**

- Back to **Home** or **Profile** via back navigation or tab switch
- Conversation persisted for return visits (one thread per user, MVP)

**Notes:** Anthropic API is server-side only. No Pia chat on marketing website. Functional Pia and AI advisory are post-V1 (PRD §21).

---

## Future product opportunities (not MVP)

The following concepts are **documented for future consideration only**. They are **not** in MVP flows, screens, or build scope.

### Your Growth

A friendly, non-judgmental way to celebrate milestones and progress over time.

**What it is:**

- A future engagement layer that highlights meaningful moments in the user's Olimpia journey
- Reinforces the mission: helping women gain more choices and more freedom over time
- Celebrates progress — not performance

**What it is not:**

- **Not** a score, ranking, grade, or leaderboard
- **Not** a "Financial Confidence Score" or "Financial Confidence Progression System"
- **Not** judgmental, competitive, or gamified in a way that creates shame or pressure

**Example milestones (future):**

| Milestone | Celebration direction |
|-----------|----------------------|
| First goal created | Acknowledge intention and first step |
| First $100 saved | Recognize momentum |
| First growth allocation | Introduce growth journey calmly |
| First month of earnings | Variable-earnings milestone — estimated, not guaranteed |
| Goal milestone reached | Celebrate target progress or completion |

**Relationship to MVP:**

- MVP may show **inline celebration copy** on individual flows (e.g. first goal, first growth deposit) per Brand.md
- **Your Growth** as a dedicated progression experience is **Future** — a cohesive view of milestones over time, separate from Pia chat and separate from any scoring mechanic

---

## Cross-flow reference

### Bottom navigation (mobile app)

```
[ Home ]  [ Savings ]  [ Card ]  [ Profile ]
```

### Pia at V1 vs post-V1

| Location | V1 launch | Post-V1 (functional coach) |
|----------|-----------|----------------------------|
| **Profile** | Static **Coming soon** card — visible, no chat | **Ask Pia** opens chat |
| **Home** | No Ask Pia quick action | **Ask Pia** quick action |
| **Savings / Goal Detail** | No Ask Pia entry | Context-aware prompts |
| **Growth account** | No Ask Pia entry | Growth-context prompts |
| **Onboarding** | No Pia introduction or chat | Optional intro moments (TBD) |

### Balance buckets (user mental model)

| Bucket | Used for |
|--------|----------|
| **Available** | Send, withdraw, allocate to goals/growth *(card spend post-V1)* |
| **Savings goals** | Named goal envelopes (logical allocations) |
| **Growth account** | Optional — put savings to work; potentially earn more over time |

**Total displayed balance** = available + goals allocated + growth allocated.

### Document flow

```
PRD.md (approved)
    ↓
Brand.md (approved)
    ↓
Architecture.md (approved / in review)
    ↓
UserFlows.md (this document)
    ↓
BuildPlan.md (implementation phases)
    ↓
ScreenInventory.md (screen-level spec)
    ↓
NavigationMap.md (navigation validation)
```

---

## Approval checklist

Before `BuildPlan.md`:

- [ ] **Why This Matters** sections reviewed — outcome-driven, not product-centric
- [ ] All 16 flows reviewed against PRD screen inventory and Architecture flows
- [ ] V1 Pia preview on Profile accepted (static Coming soon — no chat at V1)
- [ ] Functional Pia entry points in Savings and Growth deferred to post-V1 (flow 16)
- [ ] **Your Growth** documented as future only — not a score or ranking
- [ ] Pia AI chat agent confirmed as **post-V1** (flow 16 — not required for V1 launch)
- [ ] Marketing website flow aligned with Brand.md section map
- [ ] Async failure and success copy direction accepted (Architecture §9)
- [ ] Growth account entry surface confirmed (Savings vs Home — implementation detail)
- [ ] Withdraw entry confirmed (Home and/or Profile)
- [ ] Base App explicitly out of scope

---

*End of UserFlows.md v1.3*
