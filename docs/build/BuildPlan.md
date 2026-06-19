# Olimpia — Build Plan

**Version:** 1.1  
**Status:** Draft for review  
**Purpose:** Implementation phases for MVP — optimized for the **fastest path to a working prototype**  
**Source of truth:** [PRD.md](../product/PRD.md) (v1.10) · [Brand.md](../brand/Brand.md) (approved) · [Architecture.md](../architecture/Architecture.md) (v1.5) · [UserFlows.md](../product/UserFlows.md) (v1.3) · [NavigationMap.md](../product/NavigationMap.md) (v1.1) · [ScreenInventory.md](../product/ScreenInventory.md) (v1.1)

---

## MVP scope

| Surface | Technology | MVP |
|---------|------------|-----|
| **Marketing website** | Static site (e.g. Astro / Next static export) | `/`, `/learn/usdc`, `/llms.txt`, waitlist |
| **Mobile app** | React Native monorepo | **iOS + Android simultaneous** — same codebase |
| **Backend** | Node.js orchestrator | REST API, webhooks, provider integrations |
| **Pia AI coach** | Anthropic API (server-side) | In-app chat — education, guidance, coaching only |

**Wrapper model unchanged:** Integrate Privy, Base, Bridge, Gnosis Pay, LI.FI, yield layer (single provider), Resend, Anthropic. Do not build custom rails.

**Explicitly out of MVP:** Base App · AI Financial Advisor · request money · multi-provider yield · physical card · push notifications · full transaction history screen · Your Growth progression system · trading / investment advice.

---

## Build principles

1. **One vertical slice at a time** — each phase produces a demoable increment on **both iOS and Android**.
2. **Backend before provider complexity** — ledger and auth first; external integrations in dependency order.
3. **Parallel marketing** — static site does not block mobile; start early for waitlist and SEO.
4. **Ledger-first features before chain-heavy features** — goals before P2P; P2P before card.
5. **Pia after auth + goals** — coach needs user context; Anthropic integration is isolated and can ship without blocking money rails.
6. **Single yield provider** — Architecture §11A Option A (e.g. Aave on Base).
7. **UserFlows is acceptance** — each phase maps to flows in [UserFlows.md](../product/UserFlows.md); copy and outcomes from Brand.md.

---

## Phase overview

| Phase | Name | Primary outcome |
|-------|------|-----------------|
| **0** | [Foundation](#phase-0-foundation) | Runnable repo, API skeleton, RN on iOS + Android |
| **1** | [Marketing website](#phase-1-marketing-website) | Public landing, education, waitlist live |
| **2** | [Auth, shell & onboarding](#phase-2-auth-shell--onboarding) | Sign up, Pia intro, tab navigation, empty Home |
| **3** | [Dashboard & activity](#phase-3-dashboard--activity) | Encouraging Home, balance, activity, transaction detail |
| **4** | [Add money](#phase-4-add-money) | Bridge on-ramp end-to-end |
| **5** | [Savings goals](#phase-5-savings-goals) | Create goals, allocate, progress UI |
| **6** | [Send & receive](#phase-6-send--receive) | Olimpia-to-Olimpia P2P |
| **7** | [Pia AI chat agent](#phase-7-pia-ai-chat-agent) | Coach chat with guardrails |
| **8** | [Growth account](#phase-8-growth-account) | Single-provider yield deposit/withdraw |
| **9** | [Withdraw & virtual card](#phase-9-withdraw--virtual-card) | Off-ramp + Gnosis Pay virtual card |
| **10** | [MVP hardening & release](#phase-10-mvp-hardening--release) | Polish, parity, store submission |

**Parallel track:** Phase **1** can start as soon as Phase **0** repo exists — it does not wait for mobile money flows.

---

## Phase 0: Foundation

### Goal

Establish a single monorepo, deployable backend skeleton, and React Native app running on **iOS and Android** simulators/devices — no product flows yet.

### Deliverables

- Monorepo layout: `apps/mobile` (React Native), `apps/api` (Node.js), `apps/marketing` (static site), root `llms.txt`
- PostgreSQL schema migration v0: `users`, `wallets`, `transactions` (stub)
- API: `GET /health`, `/api/v1` router, Privy auth middleware stub, env/secrets pattern
- Privy dashboard: app created for mobile (iOS + Android bundle IDs)
- React Native: bottom tab scaffold (Home · Savings · Card · Profile), stack navigator, Brand.md theme tokens (colors, Cormorant Garamond + Inter)
- CI: lint + typecheck on PR; optional API smoke test
- Staging deploy: API host + DB; marketing deploy target (Vercel/Netlify)
- **Launch geography assessment** — review Privy, BridgeXYZ, Gnosis Pay, LI.FI, and yield provider sandbox/docs; produce provider restriction matrix (on-ramp, off-ramp, card, KYC); recommend initial supported countries (TBD until founder confirms); document in [launch-geography.md](../architecture/launch-geography.md)

### Dependencies

- Approved PRD, Architecture, Brand
- Provider sandbox accounts: Privy (minimum for Phase 2); Bridge, Gnosis Pay, yield provider access for geography assessment
- Apple Developer + Google Play Console access (for later phases)

### Acceptance criteria

- [ ] `apps/mobile` builds and runs on **iOS simulator and Android emulator**
- [ ] `apps/api` responds `200` on `/health` in staging
- [ ] Database migrations apply cleanly
- [ ] No secrets in git; `.env.example` documents required keys
- [ ] README with local dev setup for all three apps
- [ ] **Launch geography assessment complete** — provider restriction matrix documented in [launch-geography.md](../architecture/launch-geography.md); initial supported countries marked **TBD** pending founder launch strategy

---

## Phase 1: Marketing website

### Goal

Ship a conversion-ready public site — acquisition, trust, education, and waitlist — **independent of mobile app completion**.

### Deliverables

- Landing page: all sections per Brand.md / Architecture §3A (Hero through Footer)
- `/learn/usdc` education page (five H2 topics, beginner copy)
- `/llms.txt` at site root (from repo `llms.txt`)
- SEO: semantic HTML, metadata, Open Graph, Twitter card, canonical URLs, JSON-LD (Organization, WebSite, SoftwareApplication, FAQPage)
- FAQ: 6–8 questions as real HTML; accordion accessible
- Waitlist modal on all Download CTAs → `POST /api/v1/waitlist`
- Responsive layout; WCAG AA contrast; alt text on images
- Pia marketing section: static preview (no live chat)

### Dependencies

- Phase 0 repo and API deploy (for waitlist endpoint) **or** third-party form fallback documented in Architecture
- Brand.md copy and palette approved for implementation
- Support email and legal URLs (Privacy, Terms) — placeholders acceptable for prototype

### Acceptance criteria

- [ ] UserFlows §1 (marketing visitor) completable on staging URL
- [ ] Waitlist submit succeeds and stores email; error + retry on failure
- [ ] `/learn/usdc` linked from Hero USDC text
- [ ] Rich Results Test passes for FAQPage JSON-LD
- [ ] Mobile-responsive; one H1 per page
- [ ] Lighthouse/accessibility spot-check — no critical failures

---

## Phase 2: Auth, shell & onboarding

### Goal

A new user can sign up on **iOS and Android**, meet Pia briefly, and land on an empty Home with working navigation.

### Deliverables

**Backend**

- `POST /auth/sync` — Privy token verify, user + wallet create, ledger init
- Privy server SDK integration
- `GET /me` (read profile)

**Mobile (12-screen scaffold)**

- Welcome, Auth (Privy RN SDK: email/phone + OTP/passkey)
- Pia introduction moment (inline card after signup — UserFlows §2)
- Bottom tabs + stack flows wired (empty content OK)
- Profile tab (read-only `GET /me`)

### Dependencies

- Phase 0
- Privy mobile + server credentials configured

### Acceptance criteria

- [ ] UserFlows §2 and §3: register and login on **both iOS and Android**
- [ ] Pia greeting shown once after registration; skipped on login
- [ ] User reaches Home in &lt; 3 minutes; **zero crypto vocabulary** on onboarding screens
- [ ] `POST /auth/sync` creates user + wallet records; wallet address not shown in UI
- [ ] Sign out returns to Welcome

---

## Phase 3: Dashboard & activity

### Goal

Home answers *"How am I doing?"* — encouraging, outcome-driven dashboard with balance and activity feed.

### Deliverables

**Backend**

- Ledger module: `available`, `goalsAllocated`, `growthAllocated`, `totalDisplay`
- `GET /balance`, `GET /activity`, `GET /activity/:id`
- Normalized transaction model + status field (Architecture §21)

**Mobile**

- Home dashboard per UserFlows §4 example (greeting, progress headline, featured goal slot, growth earnings slot, money available)
- Quick actions: Add · Send · Receive · Ask Pia (Pia opens empty state until Phase 7)
- Transaction Detail screen
- Empty states for new users (friendly, not transactional)
- Inline `pending` / `processing` / `completed` / `failed` components

### Dependencies

- Phase 2

### Acceptance criteria

- [ ] UserFlows §4: Home feels encouraging; directional copy matches example where data exists
- [ ] Activity feed renders transaction types with plain-language labels
- [ ] Transaction Detail shows amount, type, status, date
- [ ] Balance displays in USD only (two decimals)
- [ ] **iOS and Android** visual parity on Home and Transaction Detail

---

## Phase 4: Add money

### Goal

First real money moment — user adds funds via Bridge on-ramp and sees updated balance.

### Deliverables

**Backend**

- BridgeXYZ client: `POST /funding/deposits`, `GET /funding/deposits/:id`
- `deposits` table + webhook `POST /webhooks/bridge` (idempotent)
- Ledger credit on deposit `completed`
- Resend email on deposit complete

**Mobile**

- Add Money screen: amount, method, review, inline async states (UserFlows §5)
- Poll deposit status while `processing`

### Dependencies

- Phase 3 (ledger + activity)
- Bridge sandbox / staging credentials
- Resend API key

### Acceptance criteria

- [ ] UserFlows §5 completable end-to-end in Bridge test mode on **iOS and Android**
- [ ] States: *Preparing deposit* → *Adding money* → *Money added* / failure + retry
- [ ] Home balance and activity update on success
- [ ] Confirmation email sent
- [ ] No crypto/network language in UI

---

## Phase 5: Savings goals

### Goal

User creates named goals and moves money into progress envelopes — intentions become visible progress.

### Deliverables

**Backend**

- `GET/POST /goals`, `GET /goals/:id`, `PATCH /goals/:id`, `POST /goals/:id/allocate`
- `goals`, `goal_movements` tables
- Ledger: available ↔ goals_allocated moves

**Mobile**

- Savings tab: goals list, total saved, New Goal bottom sheet
- Goal Detail: progress bar, add/remove funds, goal activity
- **Ask Pia** entry on Savings and Goal Detail (navigates to Pia — functional in Phase 7)
- Inline celebration on first goal (Brand.md)

### Dependencies

- Phase 3 (ledger)
- Phase 4 recommended (users need funds to allocate) — or demo seed balance in staging

### Acceptance criteria

- [ ] UserFlows §9, §10, §11: create goal, add funds, remove funds on **iOS and Android**
- [ ] Progress % = allocated / target
- [ ] Insufficient available balance shows friendly error
- [ ] Goal examples align with Brand (Girls Trip, First Home, etc.)
- [ ] Goals do not earn yield unless user later uses Growth (Phase 8)

---

## Phase 6: Send & receive

### Goal

Olimpia-to-Olimpia P2P works — send by handle; receive via share link / QR / username.

### Deliverables

**Backend**

- `POST /transfers`, `GET /users/lookup`, `GET /receive/link`
- Base sponsored USDC transfer (EIP-7702 relayer)
- Transfer records + ledger debit/credit
- Resend email to recipient
- MVP default: **registered recipients only** (Architecture §8)

**Mobile**

- Send Money: recipient → amount → note → review → confirm (biometric if enabled)
- Receive Money: username, link, QR, share sheet

### Dependencies

- Phase 4 (funded users)
- Base RPC + relayer funded
- Two test users for QA

### Acceptance criteria

- [ ] UserFlows §7 and §8: send and receive between two accounts on **iOS and Android**
- [ ] Recipient balance and activity update without manual refresh (poll or focus refresh)
- [ ] Send fails gracefully: recipient not found, insufficient balance
- [ ] No wallet addresses shown; recipient identified by handle/phone/email
- [ ] Transfer states normalized per Architecture §21

---

## Phase 7: Pia AI chat agent

### Goal

In-app Pia coach — education, product guidance, goal coaching, progress reinforcement — with hard guardrails against financial advice.

### Deliverables

**Backend** (Architecture §12B)

- `pia/` module: Anthropic Messages API client
- `GET /pia/thread`, `POST /pia/messages`
- `pia_threads`, `pia_messages` tables
- Context snapshot: displayName, balanceSummary, goals[], growthSummary, productFacts
- System prompt + output guardrails + rate limits
- API key server-only

**Mobile**

- Pia screen: thread, input, suggested prompts, disclaimer footer
- Entry points: Home, Profile, Savings, Goal Detail, Growth (Growth UI may ship Phase 8 — entry wired here)
- Context-aware suggested prompts per UserFlows cross-flow table

### Dependencies

- Phase 2 (auth)
- Phase 5 recommended (goal context for coaching demos)
- Anthropic API key

### Acceptance criteria

- [ ] UserFlows §16: chat works on **iOS and Android**
- [ ] Pia introduction (Phase 2) separate from chat; login does not repeat intro
- [ ] Pia refuses investment advice, trading, tax/legal — friendly redirect
- [ ] Responses use plain language; Brand voice (supportive, not advisor)
- [ ] Conversation persists across sessions (one thread per user)
- [ ] No Anthropic key in mobile binary; no protocol/crypto jargon unless user asks for education

---

## Phase 8: Growth account

### Goal

User puts part of savings to work — plain-language Growth surface, single-provider yield, estimated earnings visible.

### Deliverables

**Backend**

- `growth/` module: single provider (Architecture §11A Option A)
- `GET /growth`, `POST /growth/deposit`, `POST /growth/withdraw`
- `growth_allocations` table + yield webhook handler
- Earnings estimate polling or webhook update

**Mobile**

- Growth surface from Savings or Home
- Directional copy (UserFlows §12):

  ```
  Put your savings to work.
  Earn estimated yield while keeping the experience simple.
  ```

- Deposit/withdraw inline states; disclaimer below headline (not dominant)
- **Ask Pia** on Growth view
- Home dashboard: *Growth earnings this month* when applicable

### Dependencies

- Phase 4 (available balance to allocate)
- Yield provider sandbox on Base
- Phase 7 for Pia Growth prompts (optional same sprint)

### Acceptance criteria

- [ ] UserFlows §12: deposit to growth and withdraw back on **iOS and Android**
- [ ] User never sees Aave/Morpho/Compound, APY optimization, or wallet mechanics
- [ ] Earnings shown as estimated; not guaranteed disclaimer present
- [ ] Growth separate from goal envelopes
- [ ] Celebration copy on first growth milestone (Brand.md)

---

## Phase 9: Withdraw & virtual card

### Goal

Complete the money loop — cash out to bank and spend with a virtual debit card.

### Deliverables

**Backend — withdraw**

- `POST /funding/withdrawals`, `GET /funding/withdrawals/:id`, `GET /funding/destinations`
- Bridge off-ramp webhooks; ledger debit
- Withdraw from **available balance only**

**Backend — card**

- Gnosis Pay: `GET /card`, `POST /card/issue`, `POST /card/freeze`, `GET /card/transactions`
- Card spend webhooks → `card_transactions`, ledger debit
- Resend email on card spend

**Mobile**

- Withdraw stack from Home / Profile (UserFlows §6)
- Card tab: virtual card, masked PAN, CVV reveal (biometric), freeze toggle, recent spends
- Card spend → Transaction Detail

### Dependencies

- Phase 4 (Bridge relationship)
- Phase 6 (funded available balance for spend/withdraw QA)
- Gnosis Pay staging access
- Phase 0 launch geography assessment complete; card-eligible regions documented (founder confirmation of launch countries before release — Phase 10)
- KYC path via Bridge/Gnosis for test users

### Acceptance criteria

- [ ] UserFlows §6: withdraw to linked bank in test mode
- [ ] UserFlows §13: virtual card issued; freeze/unfreeze works
- [ ] Test purchase or simulated spend updates activity on Home and Card
- [ ] Insufficient available balance declines spend with clear copy
- [ ] Card draws from available only — not goal or growth allocations
- [ ] **iOS and Android** parity on Withdraw and Card flows

---

## Phase 10: MVP hardening & release

### Goal

Production-quality prototype ready for TestFlight, Google Play internal testing, and public marketing site — **simultaneous iOS + Android release**.

### Deliverables

- End-to-end QA script covering all 16 UserFlows
- Webhook retry + stuck-`processing` polling job
- Error copy audit (Brand.md voice; no raw provider errors)
- Security pass: auth on all routes, rate limits, webhook signatures, Pia guardrails
- Privacy Policy + Terms linked from app and site
- App Store + Google Play metadata, screenshots (both platforms)
- TestFlight + Play internal track builds
- Analytics logging stub (optional Architecture Future)
- Support email live in footer and Profile

### Dependencies

- Phases 0–9 complete
- Apple + Google developer accounts in good standing
- Phase 0 launch geography assessment complete; founder has confirmed initial supported countries (or explicitly deferred TBD for prototype demo geography)

### Acceptance criteria

- [ ] All **16 UserFlows** pass on physical **iOS and Android** devices
- [ ] Marketing site live with waitlist or store links
- [ ] No P0 bugs in core loop: onboard → fund → dashboard → goal → send → receive → growth → card → withdraw → Pia → profile
- [ ] Async flows use four canonical states everywhere
- [ ] Store submission packages uploaded (or ready for founder review)
- [ ] MVP exclusions verified: no request money, no AI advisor, no Base App, no confidence score

---

## Global MVP release criteria

Before calling MVP **done**:

| Area | Criterion |
|------|-----------|
| **Platforms** | React Native app shipped to App Store + Google Play (or approved beta) |
| **Marketing** | Website live with SEO, FAQ, `/learn/usdc`, waitlist or download links |
| **Screens** | All **12 PRD screens** implemented |
| **Flows** | All **16 UserFlows** demonstrable |
| **Pia** | Coach live with guardrails; not financial advice |
| **Stack** | Wrapper model only — provider integrations per Architecture §15 |
| **Voice** | Brand.md + UserFlows outcome copy; dollars not crypto in app |
| **Mission** | Experience reinforces *More choices. More freedom.* |

---

## Dependency graph (simplified)

```
Phase 0 (Foundation)
    ├── Phase 1 (Marketing) ──────────────────────────────┐
    └── Phase 2 (Auth & shell)                            │
            └── Phase 3 (Dashboard)                       │
                    ├── Phase 4 (Add money)               │
                    │       ├── Phase 5 (Goals)           │
                    │       │       └── Phase 7 (Pia)     │
                    │       ├── Phase 6 (Send/Receive)    │
                    │       ├── Phase 8 (Growth)          │
                    │       └── Phase 9 (Withdraw + Card) │
                    └──────────────────────────────────────┴── Phase 10 (Release)
```

---

## Risk mitigations (build-time)

| Risk | Mitigation |
|------|------------|
| Bridge/Gnosis sandbox delays | Staging ledger + manual credit for UI phases; parallel API integration |
| Gnosis geo limits | Phase 0 geography assessment (Architecture §4A); gate Card tab with provider-driven plain copy |
| Yield provider complexity | Option A single provider only; defer multi-provider |
| Pia advice boundary | Server guardrails + disclaimer; test refusal prompts in QA |
| iOS/Android drift | Single RN codebase; test both platforms every phase |
| Scope creep | Phase acceptance gates; PRD P1/P2 stays out |

---

## Document flow

```
PRD.md (approved)
    ↓
Brand.md (approved)
    ↓
Architecture.md
    ↓
UserFlows.md
    ↓
BuildPlan.md (this document)
    ↓
ScreenInventory.md (screen-level spec)
    ↓
NavigationMap.md (navigation validation)
    ↓
Implementation
```

---

## Approval checklist

Before implementation begins:

- [ ] Phase order and parallel marketing track accepted
- [ ] Phase 0 monorepo structure accepted
- [ ] Pia in Phase 7 (after goals) accepted
- [ ] Single yield provider (Phase 8) accepted
- [x] Growth account in MVP (founder confirmed — PRD v1.10 P0)
- [x] Bank withdraw in MVP (founder confirmed — PRD v1.10 P0)
- [ ] Withdraw + Card combined in Phase 9 accepted — or split if team prefers
- [ ] Phase 0 launch geography assessment complete (Architecture §4A; [launch-geography.md](../architecture/launch-geography.md)); real vs simulated money resolved (PRD §18)
- [ ] Store release owner identified

---

*End of BuildPlan.md v1.1*
