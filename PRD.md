# Olimpia — Product Requirements Document (PRD)

**Version:** 1.7  
**Status:** Approved  
**Approved by:** Founder  
**Approved on:** 2026-06-16  
**Scope:** Consumer finance prototype  
**Platform:** React Native mobile app (iOS + Android) + marketing website  
**Distribution:** App Store + Google Play (MVP)  
**Next artifacts:** Architecture.md (system design)

---

## 1. Product Vision

Olimpia is a consumer-facing financial experience that helps women save, spend, learn, and build wealth — with crypto operating entirely behind the scenes.

Users interact with a clear, trustworthy mobile app that presents a single balance, simple goals, transaction history, and a debit card they can use every day. Under the hood, proven fiat, card, and stablecoin infrastructure is orchestrated into one seamless experience.

The long-term vision is to become the financial home women trust when traditional finance feels cold, confusing, or exclusionary — where money feels approachable, empowering, and under their control.

**Platform strategy (founder decision):**

| Layer | MVP scope |
|-------|-----------|
| **Mobile frontend** | React Native — **iOS and Android** (simultaneous launch) |
| **Distribution** | **App Store** + **Google Play** (same release) |
| **Backend** | Node.js (orchestration layer; not user-visible) |
| **Marketing website** | Acquisition, education, support, and app downloads |
| **Later** | Base App adaptation and additional platform packaging |

The MVP follows the same general architecture approach as the reference neobank stack and advisor guiding this project.

---

## 2. Mission Statement

**To make financial confidence accessible by wrapping invisible crypto infrastructure in a supportive, easy-to-use experience designed for how women actually manage money.**

We exist to remove friction, jargon, and intimidation — not to teach users about blockchain.

---

## 3. Product Description

Olimpia is a **React Native** financial app prototype for **iOS and Android** (with a supporting marketing website) that gives users:

- A **stablecoin-backed spending and savings account** (presented as dollars, not tokens)
- **Send and receive money** like a modern P2P payment app
- **Savings goals** with optional yield (post-minimal demo scope)
- A **debit card** for everyday purchases
- **Profile and account management**

The product is a **wrapper and orchestration layer**. It does not issue banking licenses, mint stablecoins, operate card networks, or run yield protocols. It integrates existing providers into a unified UX.

**What users see:** "My balance," "My goals," "My card," "Send to Sarah."  
**What users never see:** Wallets, gas, networks, approvals, DeFi, or crypto terminology.

**Experience goals (non-visual):** Trustworthy, safe, empowering, approachable, financially intelligent, emotionally supportive, modern, and calm under pressure.

---

## 4. Product Principles

| Principle | What it means |
|-----------|----------------|
| **Invisible infrastructure** | Crypto is plumbing. Every screen speaks in dollars, people, and goals. |
| **Wrapper, not builder** | Integrate proven providers; optimize UX, not rails. |
| **Cross-platform mobile** | Ship the MVP as a React Native app on iOS and Android via the App Store and Google Play; **launch both platforms simultaneously**. |
| **Confidence over complexity** | Reduce cognitive load. One clear action per moment. |
| **Empowerment, not patronizing** | Supportive without being condescending. Intelligence without jargon. |
| **Trust through transparency** | Plain-language explanations of where money is and what happens when they act. |
| **Prototype honesty** | Ship flows that validate emotion and behavior; avoid fake completeness. |
| **Women-first, not women-only** | Designed around underserved needs; inclusive without stereotyping. |
| **Safety as a feeling** | Guardrails, clear confirmations, and predictable outcomes build trust. |
| **Learn in context** | Education appears when relevant, not as a separate crypto academy. |
| **Brand deferred** | Visual design, motion, and aesthetic decisions live in Brand.md — not this document. |

**Challenge to custom infrastructure:** Building proprietary wallet, ramp, card, or yield infrastructure would delay learning whether women want *this experience*. Default to providers unless a prototype flow cannot be demonstrated credibly without a custom layer.

---

## 5. Core User Problem

Women often experience finance as:

1. **Emotionally cold** — Products built for generic "users," not how many women think about security, family, and long-term goals.
2. **Intimidating to invest** — Wealth tools assume prior knowledge; mistakes feel costly and shameful.
3. **Overwhelming in crypto** — Wallets, seed phrases, and volatility create fear, not opportunity.
4. **Fragmented** — Checking, savings, P2P, investing, and learning live in separate apps with inconsistent UX.
5. **Low confidence** — Not lack of capability, but lack of tools that make money feel manageable and dignified.

**Core problem statement:**  
*"I want a single, clear place to manage my money and grow it — without feeling stupid, scared, or sold to."*

---

## 6. User Personas

> **Status: Draft assumptions — pending founder validation**  
> The personas below are **working hypotheses** for prototype planning and prioritization. They are **not** based on completed user research, interviews, or validated segmentation.  
> **Do not treat these as approved user personas.** Flows, copy, and MVP scope should not be locked to these profiles until the founder validates or replaces them with research-backed personas.

### Persona 1: Maya — The Cautious Builder *(draft)*

- **Age:** 28 | **Role:** Marketing coordinator
- **Income:** Steady but not high | **Crypto exposure:** None
- **Behavior:** Uses P2P payment apps and a traditional bank app; has a savings account she rarely checks
- **Pain:** Wants to save for a trip and an emergency fund but loses motivation; investing feels "for other people"
- **Goal:** Automated-feeling progress toward goals with zero jargon
- **Quote:** *"I just want to see my money growing without reading a textbook."*
- **Validation needed:** Is this the primary acquisition profile? Is "trip + emergency fund" the right goal framing?

### Persona 2: Jordan — The Independent Earner *(draft)*

- **Age:** 34 | **Role:** Freelance designer
- **Income:** Variable | **Crypto exposure:** Bought Bitcoin once, got confused, stopped
- **Pain:** Irregular cash flow; splits bills with friends; needs a card that "just works"
- **Goal:** One balance for spending and saving; easy P2P; insights without judgment
- **Quote:** *"I don't care how it works — I care that it works when I tap my card."*
- **Validation needed:** How important is variable income / freelancer positioning vs. salaried users?

### Persona 3: Elena — The Wealth-Curious Learner *(draft)*

- **Age:** 41 | **Role:** Nurse practitioner
- **Income:** Stable, growing | **Crypto exposure:** Curious but skeptical
- **Pain:** Feels behind on retirement; wealth apps feel aggressive or exclusionary
- **Goal:** Gentle path from saving to "growing" money with education she can trust
- **Quote:** *"Teach me without making me feel late to the party."*
- **Validation needed:** Is wealth-building / growth a day-one message or a later activation moment?

### Persona 4: Priya — The Community Connector *(draft)*

- **Age:** 26 | **Role:** Grad student + part-time work
- **Income:** Limited | **Crypto exposure:** None
- **Pain:** Frequently sends and receives small amounts; fees and delays frustrate her
- **Goal:** Easy P2P, simple receive flows, micro-goals
- **Quote:** *"Money between friends shouldn't be this annoying."*
- **Validation needed:** Is P2P a core wedge or a supporting feature for the prototype?

### Prototype prioritization note *(draft — not approved)*

Until founder validation, **do not anchor MVP decisions to any single persona**. Current **tentative** hypothesis: flows that serve **onboard → fund → dashboard → save → send → receive → card → profile** should be built first because they stress-test the core neobank loop — regardless of which persona ultimately proves primary.

### Founder validation checklist (personas)

Before personas can be marked **approved**, confirm:

- [ ] Target age range and life stage
- [ ] Income profile (salaried vs. freelance vs. mixed)
- [ ] Primary wedge: saving, spending, P2P, or growth
- [ ] Crypto familiarity (none vs. curious vs. burned)
- [ ] Whether "women-first" implies specific segments (e.g., young professionals, mothers, entrepreneurs)
- [ ] Which persona(s) to recruit for prototype testing — or whether new personas replace these entirely

---

## 7. Jobs To Be Done

| When… | I want to… | So I can… |
|-------|------------|-----------|
| I open the app | Get set up in minutes without technical steps | Feel capable immediately |
| I get paid | Move money into my account easily | Start using the app as my financial hub |
| I need to pay someone back | Send money by name or contact | Handle social money without awkwardness |
| Someone owes me | Receive money through a simple link or handle | Get paid without chasing people |
| I'm planning a goal | Put money aside with a clear target | See progress and stay motivated |
| I'm shopping | Pay with a card from the same balance | Not think about which "pot" money is in |
| I check the app | Understand where I stand | Feel in control, not anxious |
| I feel unsure | Get a short, human explanation | Learn and act with confidence |
| Something goes wrong | Know what happened and what to do | Trust the product |

---

## 8. MVP Feature List

Features required to demonstrate the prototype's emotional and functional value in the **React Native mobile app** (iOS and Android).

**Marketing website (separate from app screen inventory):** Public site for acquisition, education, support, and App Store / Google Play download links — not a substitute for the mobile product experience.

### P0 — Must demonstrate in prototype

| Feature | User-facing description |
|---------|-------------------------|
| **Onboarding** | Welcome → auth → account creation → optional funding |
| **Invisible wallet creation** | Automatic; user never sees keys or wallet UI |
| **Account funding** | Add money via bank/card (fiat → stablecoin, invisible) |
| **Home dashboard** | Total balance, recent activity, quick actions |
| **Send money** | To phone/email/username; amount + note + confirm |
| **Receive money** | Shareable link or username; incoming payment notification |
| **Transaction history (recent)** | Recent activity on Home; detail view on tap |
| **Savings goals** | Create goal, name, target, optional deadline, allocate funds |
| **Goal progress view** | Visual progress, add/withdraw from goal |
| **Debit card (prototype)** | Virtual card view, card controls, link to spending balance |
| **Profile** | Name, notifications, support, sign out |

### P1 — Strong prototype enhancers (if time allows)

| Feature | User-facing description |
|---------|-------------------------|
| **Request money** | Request from contact with amount and message |
| **Yield opportunity (simplified)** | "Grow your savings" toggle with plain-language earning explanation |
| **Full transaction history** | Dedicated activity list beyond Home preview |
| **Spending insight (lite)** | Simple weekly spend summary |
| **Recurring savings** | Auto-allocate to goals on schedule |

### P2 — Defer unless core loop is polished

| Feature | Reason to defer |
|---------|-----------------|
| Joint goals | Adds complexity before solo loop is validated |
| Bill split | Nice social feature; not core to neobank hypothesis |
| Credit/lending | Out of prototype scope |
| Full curriculum | Risk of becoming "education app" not "financial home" |
| International multi-currency | Complexity without validating domestic loop |
| Base App packaging | Post-mobile launch |

---

## 9. Feature Prioritization

**Framework:** Impact on emotional value proposition × feasibility in cross-platform mobile prototype × dependency order.

**Note:** Prioritization follows core loop validation (onboard → fund → dashboard → save → send → receive → card → profile) **pending persona approval.**

### Phase 1 — "I exist and I'm funded"

1. Onboarding + invisible account creation
2. Home dashboard (balance shell)
3. Fund account

**Validates:** Trust, simplicity, first completion moment.

### Phase 2 — "I move money like a normal app"

4. Send money
5. Receive money
6. Transaction detail (from Home activity)

**Validates:** P2P as daily utility; social money without crypto friction.

### Phase 3 — "I'm building toward something"

7. Savings goals (create + detail)

**Validates:** Long-term motivation and neobank mental model beyond P2P.

### Phase 4 — "I spend with it"

8. Virtual debit card experience

**Validates:** Full neobank loop — not just savings/P2P.

### Phase 5 — "I manage my account"

9. Profile (account info, settings, support)

**Validates:** Account ownership and ongoing use.

### Explicitly not in MVP

- Custom infrastructure builds
- Advanced portfolio analytics
- Tax reporting
- Business accounts
- Native token / loyalty points
- Trading, swapping UI exposed to user
- Multi-chain selection
- Visual design system (owned by Brand.md — approved)

---

## 10. User Flows

All flows are designed for the **React Native mobile app** (iOS and Android). Multi-step flows use native stack navigation, modals, and bottom sheets — not separate inventory screens unless listed in Section 11.

### Flow A: First-time onboarding

```
App Store or Google Play download → App open → Welcome (value prop) → Create account (email/phone + passkey or OTP)
→ Invisible wallet/account provisioned (no user step)
→ Confirmation moment → Prompt: Add money now or Explore app
→ Home dashboard
```

**Success criteria:** User reaches Home in under 3 minutes; zero crypto vocabulary on any screen.

### Flow B: Fund account

```
Home → Add Money → Enter amount → Select funding method (bank/card)
→ Review ("$200 will be added to your balance")
→ Processing state with clear copy
→ Success → Updated balance + transaction entry
```

**Edge states:** Processing delay, failed payment, retry with support link — handled as **inline states** on the Add Money screen.

### Flow C: Send money

```
Home → Send → Select/create contact (phone, email, username)
→ Enter amount → Optional note → Review
→ Confirm (biometrics, PIN, or provider auth if enabled)
→ Success confirmation → Receipt
```

**Recipient experience:** Push notification or email → Opens mobile app (or store install if new) → Funds in balance.

### Flow D: Receive money

```
Home → Receive → Share link, QR code, or username
→ Payer completes send flow (registered or claim flow)
→ Recipient sees incoming payment in activity + updated balance
```

### Flow E: Create savings goal

```
Savings → New Goal (bottom sheet) → Name + target amount + optional date
→ Choose funding: one-time allocation or "add later"
→ Goal created → Progress on Goal Detail
```

### Flow F: Manage savings goal

```
Savings → Goal Detail → View progress
→ Add or withdraw funds
→ See goal-specific activity
```

### Flow G: Debit card (prototype)

```
Card → View virtual card (masked PAN, CVV reveal, freeze toggle)
→ User taps card at merchant (Gnosis Pay rails)
→ Push notification: "You spent $14.50 at…"
→ Activity updates on Home and Card
```

### Flow H: Profile and account management

```
Profile → View account info
→ Manage notifications and security preferences
→ Access support → Sign out
```

---

## 11. Screen Inventory

**Scope:** Minimum viable set to demonstrate onboarding, funding, dashboard, savings goals, send money, receive money, card experience, and profile.

**Approach:** Consolidate multi-step flows; use inline states, modals, and sheets instead of dedicated screens where possible.

**Total: 11 screens**

| # | Screen | Demonstrates | Consolidation notes |
|---|--------|--------------|---------------------|
| 1 | **Welcome** | Onboarding | Single value-prop screen with primary CTA. |
| 2 | **Auth** | Onboarding | Sign up / sign in + verification as one multi-step flow. Invisible wallet creation on completion — no separate screen. |
| 3 | **Home** | Dashboard | Balance, quick actions (Add · Send · Receive), recent activity. Processing and empty states are inline components. |
| 4 | **Add Money** | Funding | Amount + funding method on one screen. Processing, success, and error are inline states. |
| 5 | **Send Money** | Send money | Recipient → amount/note → review/confirm as one stacked flow. Success is a confirmation state or modal. |
| 6 | **Receive Money** | Receive money | Share link, QR code, and username on one screen. Copy/share actions inline. |
| 7 | **Transaction Detail** | Send / receive / card | Single reusable detail view for all transaction types. |
| 8 | **Savings** | Savings goals | Goals list + total saved. **New Goal** opens as a bottom sheet — not a separate screen. |
| 9 | **Goal Detail** | Savings goals | Progress, add/withdraw, goal-specific activity. |
| 10 | **Card** | Card experience | Virtual card (masked PAN, reveal CVV, freeze toggle), recent card spends inline. Tap spend → Transaction Detail (#7). |
| 11 | **Profile** | Profile | Account info, notifications, security, help/support, sign out. Settings merged here — no separate Settings screen. |

### Deferred from minimal screen set

- Full transaction history screen (Home preview + Transaction Detail suffice for MVP)
- Request money (P1 — can extend Receive or Home actions later)
- Yield / "Grow savings" flows
- Spending insights
- Education / confidence modules
- Notifications center (push/email + Profile entry sufficient for prototype)
- Physical card order flow
- Separate Settings screen

### Entry points

```
Welcome → Auth → Home

Home ─┬─ Add Money
      ├─ Send Money → Transaction Detail
      ├─ Receive Money
      └─ Transaction Detail (from recent activity)

[Savings] → Goal Detail (+ New Goal sheet from Savings)
[Card] → Transaction Detail (from spend row)
[Profile]
```

---

## 12. Navigation Structure

**Primary navigation (React Native mobile app — iOS and Android):**

Bottom tab bar (4 tabs):

```
[ Home ]  [ Savings ]  [ Card ]  [ Profile ]
```

| Tab | Contains |
|-----|----------|
| **Home** | Balance, quick actions (Add, Send, Receive), recent activity |
| **Savings** | Goals list, total saved, create goal (sheet) |
| **Card** | Virtual card, recent card spend, card controls |
| **Profile** | Account info, settings, help, sign out |

**Modal / stack flows (not tabs):** Add Money, Send Money, Receive Money, Transaction Detail, Goal Detail, New Goal sheet

**Marketing website (out of app navigation):** Standalone site for acquisition, education, support, and App Store / Google Play download links. Not part of the 11-screen app inventory.

**What we avoid:**

- Hamburger-heavy IA for core destinations
- Separate "Crypto" or "Invest" tab
- More than 4 primary tab destinations in MVP

---

## 13. User Journey

### Illustrative journey *(draft persona: Maya — not validated)*

> For narrative purposes only. Not a validated user journey. Persona is a draft assumption pending founder validation.

| Stage | Touchpoint | User thought | Emotional target |
|-------|------------|--------------|------------------|
| **Discover** | Marketing site or friend referral → App Store / Google Play | "Another finance app?" | Curiosity |
| **Onboard** | Welcome + auth (mobile app) | "That was actually easy" | Relief |
| **First fund** | Add $100 | "Okay, it's real money" | Trust |
| **First send** | Pay friend for dinner | "Same as apps I already use" | Familiarity |
| **First receive** | Friend pays her back via link | "That was painless" | Confidence |
| **First goal** | "Italy trip" $2,000 | "I can actually picture this" | Motivation |
| **First card spend** | Coffee shop | "This is my real spending account" | Integration |
| **Return visit** | Opens app from home screen | "I'm in control" | Confidence |

**Critical moments of truth:**

1. Onboarding completion without confusion (mobile app)
2. First successful fund
3. First send without support
4. First receive without support
5. First card notification feeling instant and normal

---

## 14. Infrastructure Assumptions

These are **product-level assumptions** about what providers enable. Architecture and implementation are deferred to Architecture.md.

**Wrapper model (unchanged):** This product does not build banking rails, wallet infrastructure, debit card infrastructure, yield protocols, blockchain infrastructure, or fiat on/off ramps. It orchestrates existing providers into a unified experience.

| Capability | Provider | Product assumption |
|------------|----------|------------------|
| Wallet & auth | **Privy** | Users sign in with familiar methods; wallets created silently |
| Chain | **Base** | Single network; users never choose a chain |
| Fiat on/off ramp | **BridgeXYZ** | Users fund and withdraw in USD; conversion is invisible |
| Debit card | **Gnosis Pay** | Card spends against stablecoin balance; feels like a bank card |
| Gas / tx fees | **EIP-7702 sponsorship** | Users never see gas or network fees |
| Swaps (if needed) | **LI.FI** | Any asset movement happens invisibly |
| Yield | **Aave, Morpho, Compound** | Presented as a unified "Growth" product when enabled; not in minimal screen set |
| Email | **Resend** | Receipts, magic links, notifications |
| Backend | **Node.js** | Orchestrates providers; not user-visible |

**Product constraints from stack:**

- USD-stablecoin mental model (presented as "dollars" in UI)
- Card availability may be geography-dependent — prototype should define a single launch geography for demo purposes
- Yield rates fluctuate — UI must show estimates, not guarantees (when yield is enabled)
- Funding/settlement may not be instant — copy must set expectations

**No redesign of this stack** unless a user flow cannot be demonstrated credibly.

**Platform constraint (MVP):**

| Component | Technology | Role |
|-----------|------------|------|
| Mobile frontend | **React Native** | Primary product experience; iOS and Android |
| Backend | **Node.js** | Orchestrates providers; not user-visible |
| Distribution | **App Store** + **Google Play** | MVP launch channels |
| Marketing | **Website** | Acquisition, education, support, and downloads; not the core product shell |

Provider SDKs and auth flows must support the React Native app on both iOS and Android.

---

## 15. Success Metrics

### Prototype validation metrics (qualitative + behavioral)

**Primary — Experience validation**

| Metric | Target (prototype) | How measured |
|--------|-------------------|--------------|
| Onboarding completion rate | ≥ 70% of starts | Funnel analytics |
| Time to first fund | Median < 5 min after signup | Event timestamps |
| "Feels like a bank, not crypto" | ≥ 4/5 agree | Post-session survey |
| "I would trust this with my money" | ≥ 3.5/5 | Survey (prototype caveat) |
| Send flow completion | ≥ 80% of starts | Funnel |
| Receive flow completion | ≥ 80% of share-link opens that intent to pay | Funnel |
| Goal creation rate | ≥ 40% of funded users | Events |
| Mobile app usability (iOS + Android) | ≥ 4/5 agree "easy to use" | Post-session survey |
| Store listing → install | Track conversion from marketing site (App Store + Google Play) | Analytics |

**Secondary — Engagement signals**

| Metric | Signal |
|--------|--------|
| D7 return rate | Habit potential |
| Sessions per week | Stickiness |
| % users with ≥1 goal + card view | Full-loop adoption |
| Push notification open rate | Informs P2P and card engagement |

**Anti-metrics (watch for failure)**

- Users asking "what's a wallet?" in testing → invisible infra failing
- Drop-off at confirm screens → trust or clarity issue
- Confusion between spend balance vs. savings → IA problem
- Users think they're "buying crypto" → positioning failure
- Platform-specific friction on iOS or Android (auth, funding, card reveal, push permissions) → mobile UX gap
- App Store or Google Play review or distribution delay → launch risk

**Recruitment note:** Tester criteria **TBD after founder validates personas.**

---

## 16. Risks and Assumptions

### Risks

| Risk | Impact | Mitigation (product-level) |
|------|--------|----------------------------|
| Crypto leakage in UX | Breaks neobank positioning | Copy audit; banned word list; user testing |
| Funding delays | Erodes trust | Honest processing states; email/in-app notifications |
| Yield variability | Feels like bait-and-switch | Ranges, "estimated," easy opt-out (when enabled) |
| Card geo limits | Demo fails for some testers | Define prototype geography upfront |
| Provider outage | Flow breaks | Graceful degradation messaging |
| Patronizing positioning | Alienates target users | Validate with diverse testers; brand expression in Brand.md |
| Over-scoped MVP | Shallow everything | Ruthless 11-screen discipline |
| Security perception | Users fear new fintech | Clear confirmations, freeze card, support access |
| iOS / Android device fragmentation | Auth, passkeys, or card UX differs by device or OS | Test on representative iPhone and Android devices; document gaps |
| App Store or Google Play rejection / review delays | Blocks launch | Early review of fintech/crypto-adjacent positioning; TestFlight / internal testing beta paths |
| Persona misalignment | Wrong flows prioritized | Treat personas as draft until founder validates |

### Assumptions

- **React Native mobile app** distributed via the **App Store** and **Google Play** is the primary validation surface; **iOS and Android launch simultaneously**.
- A **marketing website** supports acquisition, education, support, and store conversion but is not the primary product experience.
- Users will fund a prototype if onboarding feels trustworthy (real or staged demo — see Open Questions).
- Stablecoin-as-dollars is acceptable for prototype testers when copy is clear.
- P2P receive can work via shareable link or in-app handle; recipient may need to install the mobile app (flow TBD in Architecture.md).
- Gnosis Pay virtual card is sufficient for "debit card experience" without physical card in MVP.
- Single currency (USD) is enough to validate core hypothesis.
- Women-first positioning resonates without excluding other users.
- Infrastructure providers support React Native integration paths on iOS and Android for MVP flows.

---

## 17. Future Features (Out of Scope)

Explicitly deferred past mobile MVP:

- Base App packaging
- Licensed bank charter or FDIC-insured positioning
- Physical card fulfillment at scale
- Multi-currency accounts
- International remittance
- Joint accounts and family wallets
- Bill pay and ACH payees
- Credit products, loans, BNPL
- Stock/ETF brokerage
- Crypto trading, NFTs, or token rewards
- Budgeting with bank aggregation (external account linking)
- AI Financial Advisor
- Community forums or social investing
- Payroll direct deposit
- Tax documents and reporting
- Business banking
- White-label / B2B API

**Visual and brand design** (color, typography, motion, imagery, aesthetic direction) — defined in **Brand.md**, not this PRD.

---

## 18. Open Questions

### Product & positioning

1. ~~**Brand name:**~~ **Resolved:** Public-facing brand name is **Olimpia**.
2. **Positioning line:** One sentence for landing page?
3. **Geography for prototype:** US-only? Which states for card and ramp demos?
4. **Real money vs. simulated:** Real fiat/stablecoin flows or staged balances for demos?

### User model

5. **Persona validation:** Which draft personas reflect the intended user? Merge, cut, or rewrite before testing?
6. **Research plan:** Founder validation via interviews, surveys, or lived experience — and by when?
7. **Username system:** Phone, email, @handle — primary identity for P2P?
8. **KYC depth for prototype:** Minimum verification for funding and card?
9. **Age floor:** 18+ only?

### Money model

10. **Balance structure:** Single pooled balance vs. sub-accounts? MVP recommendation: **single balance with goal envelopes** — confirm?
11. **Withdrawals:** Off-ramp to bank in MVP or "coming soon"?

### Card

12. **Virtual-only for MVP** or show physical card order?
13. **Spend funding order:** Card draws from spend pool only, or any balance?

### Founder decisions (resolved)

- **Brand name:** Public-facing name is **Olimpia**.
- **Platform launch:** iOS and Android launch **simultaneously** on App Store and Google Play.

### Brand (deferred to Brand.md)

25. **Visual design, motion, typography, palette, imagery, tone-of-voice craft** — defined in **Brand.md** (approved).

### Platform

14. **Minimum OS versions:** Which iOS and Android versions must be supported for MVP?
15. **Beta distribution:** TestFlight and/or Google Play internal testing before public store listings?
16. **Store metadata:** Category, screenshots, and review narrative for App Store and Google Play — who owns?
17. **Marketing website scope:** Which pages at launch (education, support, FAQ, legal)?
18. **Deep links:** Required for receive-money and referral flows on both platforms?
19. **Push notifications:** Required at MVP or email-only fallback acceptable initially?

### Demo & testing

21. **Target testers:** How many, what recruitment criteria (pending persona validation)?
22. **Success bar for Architecture.md:** Which metrics or qualitative gates?

### Partnerships

23. **Co-branding:** Any provider logos shown or fully white-labeled?
24. **Support:** Human chat, email only, or FAQ for prototype?

---

## Approval Checklist

PRD approved 2026-06-16. **Brand.md** approved. **Architecture.md** drafted — review and approve before implementation.

- [x] Vision, mission, and principles
- [x] Personas reviewed as **draft assumptions** — approved as working hypotheses pending validation
- [x] MVP P0 feature list and **11-screen inventory**
- [x] Platform strategy: React Native (iOS + Android simultaneous launch), App Store + Google Play, Node.js backend, marketing website
- [x] Phase prioritization
- [x] Navigation structure
- [x] Infrastructure assumptions accepted as-is (wrapper model unchanged)
- [x] PRD contains **no** color, typography, motion, imagery, or brand/visual recommendations
- [x] Brand.md approved as source of truth for brand direction
- [x] Open questions resolved or explicitly deferred (see Section 18)
- [ ] Success metrics and prototype geography *(deferred — resolve during Architecture.md or pre-build planning)*

---

## Document Ownership

| Topic | Document |
|-------|----------|
| Product behavior, flows, features, metrics | **PRD.md** (approved) |
| Brand and visual identity | **Brand.md** (approved) |
| System design, integrations, implementation | **Architecture.md** |

---

*End of PRD v1.7*
