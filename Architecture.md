# Olimpia — Architecture

**Version:** 1.4  
**Status:** Draft for review  
**Depends on:** [PRD.md](./PRD.md) (approved v1.7), [Brand.md](./Brand.md) (approved)  
**Scope:** Consumer finance prototype — system design only (no implementation)

---

## Document conventions

| Label | Meaning |
|-------|---------|
| **MVP** | Required for first working prototype |
| **Future** | Explicitly out of MVP architecture |

**Wrapper model:** Olimpia does not build banking rails, wallets, ramps, cards, yield protocols, or blockchain infrastructure. The Node.js backend orchestrates third-party providers and presents a single, dollar-denominated product experience.

**User-facing rule:** Balances, actions, and states are expressed in dollars and plain language. Crypto terminology, protocol names, networks, and wallet mechanics are never exposed in the mobile app or marketing site.

---

## 1. Architecture Overview

Olimpia is a three-surface system:

| Surface | Role | MVP |
|---------|------|-----|
| **React Native mobile app** (iOS + Android) | Primary product — onboarding, money movement, goals, growth, card, profile | Yes |
| **Node.js backend** | Orchestration, data persistence, webhooks, provider integration, state normalization | Yes |
| **Marketing website** | Simple public landing page — acquisition, education, support links, App Store / Google Play downloads | Yes |

### High-level responsibilities

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native App (iOS + Android)             │
│  Auth UI · Dashboard · Fund · Withdraw · Send · Receive ·       │
│  Goals · Growth · Card · Profile                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS / JSON API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Node.js Backend (Orchestrator)              │
│  Users · Ledger · Transactions · Goals · Growth allocations      │
│  Webhooks · Provider clients · State machine · Notifications     │
└─────┬──────┬──────┬──────┬──────┬──────┬──────┬────────────────┘
      │      │      │      │      │      │      │
      ▼      ▼      ▼      ▼      ▼      ▼      ▼
   Privy  Bridge Gnosis  LI.FI  Yield  Resend  Base
                  Pay          layer         (settlement)
                                    │
                                    ▼
                              Anthropic API
                              (Pia coach — server-side only)
```

### Approved infrastructure stack

| # | Provider | Role |
|---|----------|------|
| 1 | **Privy** | Authentication, embedded wallet creation, non-custodial wallet experience |
| 2 | **Base** | Primary blockchain network and stablecoin settlement layer |
| 3 | **BridgeXYZ** | Fiat on-ramp and off-ramp |
| 4 | **Gnosis Pay** | Virtual debit card infrastructure |
| 5 | **LI.FI** | Swap and routing (hidden from user) |
| 6 | **Yield layer** (Aave, Morpho, Compound) | USDC growth / yield allocation |
| 7 | **Resend** | Transactional email |
| 8 | **Node.js** | Orchestration and application data |
| 9 | **Anthropic API** | Pia AI Financial Coach — server-side LLM only |

**Also from PRD (unchanged):** **EIP-7702 transaction sponsorship** — gas and network fees are sponsored so users never see or pay gas.

### MVP product capabilities (architecture scope)

| Capability | MVP |
|------------|-----|
| User onboarding | Yes |
| Invisible wallet creation | Yes |
| Add money (fiat → USDC) | Yes |
| Withdraw money (USDC → fiat) | Yes |
| Dashboard | Yes |
| Send money | Yes |
| Receive money | Yes |
| Savings goals | Yes |
| USDC yield / growth account | Yes |
| Virtual debit card | Yes |
| Profile | Yes |
| Marketing landing page | Yes |
| **Pia AI Financial Coach** | Yes |

---

## 2. System Diagram (text)

### Request path (mobile → providers)

```
User (Mobile App)
    │
    ├─► Privy SDK ──────────────► Auth / session / embedded wallet
    │
    └─► Olimpia API (Node.js)
            │
            ├─► Privy Server API ───► Verify user, wallet metadata
            ├─► BridgeXYZ API ──────► On-ramp / off-ramp intents
            ├─► Gnosis Pay API ─────► Card issue, freeze, spend events
            ├─► LI.FI API ──────────► Route swaps (backend-initiated only)
            ├─► Yield provider API ─► Deposit / withdraw USDC (MVP: one provider)
            ├─► Resend API ─────────► Email notifications
            ├─► Anthropic API ──────► Pia coach completions (server-side)
            └─► Base (via relayer / RPC) ─► Settlement reads, sponsored txs
```

### Event path (providers → backend → user)

```
BridgeXYZ / Gnosis Pay / Yield provider / (optional) Privy
    │
    └─► Webhook ──► Node.js webhook handler
                        │
                        ├─► Update transaction / allocation records
                        ├─► Normalize to user-facing status
                        ├─► Trigger Resend email
                        └─► (Future) Push notification dispatch
```

### Money buckets (logical, user-facing)

```
Total balance (display)
    ├── Available (spend + send + card)
    ├── Savings goals (allocated envelopes)
    └── Growth account (USDC in yield — estimated earnings)
```

The backend maintains **logical allocations** (goals, growth) on top of the user's underlying USDC position. Users see dollars; the orchestrator maps dollars ↔ USDC 1:1 in MVP.

---

## 3. Frontend Architecture

Olimpia has **two frontends** sharing brand direction (Brand.md) but **no shared runtime**:

| Frontend | Technology | Auth | Backend |
|----------|------------|------|---------|
| **Marketing website** | Static site (e.g. Next.js static export, Astro, or HTML/CSS) | None | Waitlist endpoint only |
| **Mobile app** | React Native (iOS + Android) | Privy SDK | Full Olimpia API |

---

### 3A. Marketing Website Architecture (MVP)

**Role:** Marketing and onboarding destination — **not** the product. No wallet, no account, no Privy on web.

**Structural reference:** [defied.money](https://defied.money/) — hierarchy and simplicity only. Do not copy Defied assets or messaging. Full copy and design: **Brand.md — Marketing Website**.

| Attribute | Approach |
|-----------|----------|
| **Goals** | App downloads · Waitlist signups · Product understanding · User trust |
| **Format** | Single scrolling landing page + `/learn/usdc` |
| **Waitlist** | Modal on all download CTAs → `POST /api/v1/waitlist` or static form service |
| **Hosting** | Static CDN deploy (Vercel, Netlify, S3 + CloudFront) |
| **Analytics** | Basic page/event tracking (**Future** — optional at launch) |

#### Landing page — section map

| # | Section | Anchor | Content source | Backend |
|---|---------|--------|----------------|---------|
| — | **Navigation** | — | Features · How It Works · FAQ · Download / Waitlist | Modal only |
| 1 | **Hero** | — | Eyebrow, headline, subheadlines, tagline, CTAs | — |
| 2 | **Product Preview** | `#preview` | Mobile mockup showcase | Static asset |
| 3 | **Built Around Real Life** | `#real-life` | 4 goal cards with progress UI | Static content |
| 4 | **Your Money Bestie (Pia)** | `#pia` | Messaging-style preview of in-app coach | Static — reflects app MVP Pia |
| 5 | **Trusted Infrastructure** | `#infrastructure` | Headline + 6 provider logos | Static assets |
| 6 | **Features** | `#features` | 5 pillars: Save · Spend · Grow · Learn · Own | Static |
| 7 | **How It Works** | `#how-it-works` | 4-step flow | Static |
| 8 | **FAQ** | `#faq` | Accordion, 6–8 questions | Static |
| 9 | **Final Download / Waitlist CTA** | — | Download + waitlist modal | Modal |
| 10 | **Footer** | — | Store badges · support · legal · © | Static links |

| Route | Purpose |
|-------|---------|
| `/` | Full landing page (sections above) |
| `/learn/usdc` | USDC + stablecoin education (linked from Hero **USDC** text) |
| `/llms.txt` | Agent-readable product summary for LLM crawlers and AI search |

#### Hero (approved copy — Brand.md)

| Element | Copy / behavior |
|---------|-----------------|
| Eyebrow | Financial freedom, designed for women. |
| Headline | Your future deserves more than a checking account. |
| Subheadline | Save, spend, and grow your money with confidence. |
| Subheadline (line 2) | Earn yield with your **USDC** → link to `/learn/usdc` |
| Tagline | More choices. More freedom. |
| Primary CTA | **Download the App** → waitlist modal |
| Secondary CTA | **Learn More** → scroll `#features` |

#### Waitlist modal (pre-launch)

| Element | Spec |
|---------|------|
| Triggers | Hero Download · Nav Download/Waitlist · Final CTA |
| Title | Get the Olimpia App |
| Body | App launching soon — join waitlist for email when live |
| Form | Email input + **Join waitlist** |
| Success | Inline confirmation; close modal |
| Error | Retry + support link |
| Stores area | **Coming soon** badge / QR placeholder until App Store + Google Play live |

#### Product Preview

Static **mobile app mockup** (image or embedded component). Must communicate growth and confidence.

**Showcase elements:** Account balance · Growth Account · Savings Goal progress · Send Money · Add Money · Request Money.

#### Built Around Real Life

Static responsive card grid — **product-UI style**, not illustrative marketing art.

| Breakpoint | Layout |
|------------|--------|
| Desktop | 4 cards in a row |
| Tablet | 2 × 2 |
| Mobile | Stacked |

**Example goals (static demo data):** Girls Trip Fund · Business Launch Fund · First Home Fund · Financial Freedom Fund — each with goal amount, progress %, progress bar, monthly earnings line. See Brand.md for approved examples.

#### Your Money Bestie (Pia)

Static **messaging-style conversation card** previewing the in-app Pia coach. Pia ships in **mobile app MVP** (§12B). Marketing copy aligns with Brand.md — supportive, educational, not financial advice. No live chat or Anthropic calls on the marketing site.

#### Trusted Infrastructure

Static trust strip: headline **Built on trusted infrastructure** + logos: Privy · Base · Bridge · Gnosis Pay · LI.FI · Morpho. No technical copy.

#### Features

Five static pillar cards: **Save · Spend · Grow · Learn · Own** — icon + headline + one line each.

#### How It Works

Static 4-step visual: **Add money → Receive USDC → Grow your money → Spend anytime**. User sees dollars in app; USDC step is simplified marketing language.

#### FAQ

Accordion component; **6–8 questions**. Answers must be **real HTML text** in the DOM — not image-only, not canvas, not screenshot text. Crawlers and AI agents must be able to read full Q&A without JavaScript interaction (accordion may collapse visually; use `<details>`/`<summary>` or ensure answer text exists in HTML).

**Required questions** (Brand.md + SEO — use approved tone):

| # | Question |
|---|----------|
| 1 | What is Olimpia? |
| 2 | Who is Olimpia for? |
| 3 | What is USDC? |
| 4 | What is a stablecoin? |
| 5 | Do I need crypto experience? |
| 6 | How does yield work? |
| 7 | Can I withdraw my money? |
| 8 | Is Olimpia a bank? |

USDC and stablecoin answers should link to `/learn/usdc`. Additional questions (e.g. app availability, safety) may replace one slot if copy stays within 6–8 total.

#### Final CTA + Footer

Final section repeats download/waitlist CTA + tagline. Footer: App Store / Google Play badges (when live), support email, Privacy, Terms, © Olimpia.

#### Marketing API dependency

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/api/v1/waitlist` | None (rate-limited) | Capture email `{ email }` → store + optional Resend confirmation |

**Alternative MVP:** Third-party form (e.g. Resend audience, Mailchimp embed) if backend waitlist is deferred — document choice at implementation.

#### SEO + Agent Optimization (MVP)

**Goal:** The marketing site must be easy for search engines, AI agents, and LLM crawlers to understand, summarize, and cite — while remaining clear and trustworthy for human visitors. Copy aligns with **Brand.md**. No keyword stuffing; prioritize clarity and beginner-friendly language.

##### 1. Semantic HTML

| Rule | Requirement |
|------|-------------|
| **H1** | Exactly **one** `<h1>` per page (homepage: primary headline) |
| **Headings** | Logical `<h2>` per major section (Hero content may use `<p>` for eyebrow; section titles = H2); `<h3>` for subsections (FAQ items, learn page topics) |
| **Section names** | Descriptive headings matching visible labels — e.g. *Built Around Real Life*, *How It Works*, *FAQ* — not generic *Section 3* |
| **Text in images** | Important copy must **not** exist only inside images; mockups may show UI labels but headlines, FAQ, features, and education body copy must be HTML |
| **Landmarks** | Use `<header>`, `<nav>`, `<main>`, `<section>`, `<footer>` where appropriate |

**Homepage H1 (approved):** *Your future deserves more than a checking account.*  
**`/learn/usdc` H1 (suggested):** *Understanding USDC — stable, simple, behind the scenes*

##### 2. Metadata (every public page)

Include in `<head>` for `/` and `/learn/usdc` (page-specific descriptions where noted).

| Tag | Homepage value |
|-----|----------------|
| **`<title>`** | `Olimpia \| Financial freedom, designed for women` |
| **Meta description** | `Olimpia helps women save, spend, grow money, and earn yield with USDC through a simple financial app built for confidence, education, and freedom.` |
| **Open Graph title** | Same as `<title>` |
| **Open Graph description** | Same as meta description |
| **Open Graph type** | `website` |
| **Open Graph url** | Canonical homepage URL |
| **Twitter/X card** | `summary_large_image` + matching title and description |
| **Canonical URL** | Absolute URL per page (`/` and `/learn/usdc`) |

**`/learn/usdc` meta description (suggested):** `Learn what USDC and stablecoins are, why Olimpia uses them invisibly, and how savings growth works — no crypto experience required.`

Add `og:image` and `twitter:image` when brand OG asset exists (**Future** if asset deferred).

##### 3. Structured data (JSON-LD)

Embed `<script type="application/ld+json">` in page HTML. Validate with Google Rich Results Test before launch.

**Homepage — include all four schemas:**

| Schema | Purpose |
|--------|---------|
| **Organization** | Olimpia brand entity; `name`, `url`, `logo`, `description` aligned with Brand.md mission |
| **WebSite** | Site identity; `name`, `url`, optional `description` |
| **SoftwareApplication** | Mobile app product; `name`: Olimpia; `applicationCategory`: FinanceApplication; `operatingSystem`: iOS, Android; `offers` (free); description from brand promise — not a bank |
| **FAQPage** | `mainEntity` array matching visible FAQ questions and answers (same text as HTML FAQ) |

**`/learn/usdc`:** `WebPage` + `BreadcrumbList` (Home → Learn USDC). FAQPage optional if page includes inline Q&A.

**Example — FAQPage fragment (answers must match on-page copy):**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Olimpia?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Olimpia is a financial app designed for women to save, spend, and grow money with confidence. Crypto works invisibly in the background — you see dollars, not jargon."
      }
    }
  ]
}
```

(Draft full JSON-LD at implementation; keep `acceptedAnswer.text` identical to visible FAQ HTML.)

##### 4. Agent-readable content — `/llms.txt`

Serve a plain-text file at **`/llms.txt`** (public, no auth). Source file in repo: `llms.txt` (deploy to site root).

Must include:

- What Olimpia is
- Who it is for
- Core features (Save · Spend · Grow · Learn · Own)
- Brand positioning (confidence, education, freedom — not crypto trading)
- Important URLs (`/`, `/learn/usdc`, `#features`, `#faq`, waitlist)
- Contact / support URL (footer email)
- Short product summary (2–4 sentences, cite-friendly)

Format: Markdown-style headings and bullet lists; plain language; no protocol jargon.

##### 5. Educational page — `/learn/usdc`

Dedicated static page linked from Hero **USDC** text. Beginner-friendly; aligned with Brand.md invisible-infrastructure principle.

| Topic | Content direction |
|-------|-------------------|
| **What USDC is** | A digital dollar stablecoin — designed to stay close to $1 USD |
| **What a stablecoin is** | Crypto asset pegged to a stable value (usually the US dollar); less volatile than Bitcoin |
| **Why Olimpia uses USDC** | Reliable dollar-equivalent infrastructure behind the scenes; users interact in dollars |
| **How yield works (beginner)** | Optional growth on savings; estimated earnings, variable, not guaranteed; plain-language only |
| **No crypto experience needed** | Explicit reassurance — no wallets, keys, or trading knowledge required |

**Avoid on this page:** DeFi mechanics, wallet addresses, gas, chain selection, Aave/Morpho/Compound names, APY optimization language.

**Semantic structure:** One H1; H2 per topic above; body paragraphs in HTML.

##### 6. FAQ — crawler and agent requirements

See FAQ table above. Implementation notes:

- Each question: `<h3>` or `<summary>` with full question text
- Each answer: `<p>` (or short list) with complete answer — not "click to expand" placeholders without content
- `FAQPage` JSON-LD must mirror the same Q&A strings
- Prefer `<section id="faq">` with named anchor for `#faq`

##### 7. Accessibility (supports SEO and agents)

| Requirement | Spec |
|-------------|------|
| **Alt text** | All meaningful images and logos; decorative images `alt=""` |
| **Buttons** | Visible labels or `aria-label` — e.g. *Join waitlist*, *Download the App*, *Learn More* |
| **Contrast** | Meet WCAG AA for text (Brand.md palette) |
| **Responsive** | Mobile-first; readable without horizontal scroll; touch targets ≥ 44px |
| **Focus** | Keyboard-navigable nav, FAQ, and modal |

##### 8. What not to do

- Keyword stuffing or hidden text
- Cloaking different content for bots vs. users
- Putting FAQ or feature copy only in images or video
- Crypto-native SEO bait (*best DeFi yield*, *web3 neobank*) — conflicts with brand
- Extra landing pages for SEO alone (stay within `/` + `/learn/usdc` + `/llms.txt`)

**Readable by:** human visitors · Google · AI search engines · LLM agents · future crawlers — same honest copy for all.

#### Marketing — explicitly out of scope

- User accounts, Privy, wallets, or live balances on web
- Pia chat or Anthropic API on marketing site
- CMS, blog, or multi-page site beyond `/learn/usdc`
- Copying Defied branding or visuals

---

### 3B. Mobile App Architecture (MVP)

**Role:** Primary product. React Native app for **iOS and Android** — simultaneous App Store + Google Play launch.

| Layer | Approach |
|-------|----------|
| **Framework** | React Native |
| **Auth** | Privy React Native SDK (email, phone, passkey / OAuth as enabled) |
| **API** | HTTPS JSON → Olimpia Node.js backend; `Authorization: Bearer <Privy token>` |
| **State** | Shared app state: user session, balance summary, activity feed, flow statuses |
| **Sensitive actions** | Biometric / PIN confirmation (send, withdraw, reveal card CVV) |

#### Platform structure (iOS + Android)

| Concern | Approach |
|---------|----------|
| **Codebase** | Single React Native monorepo — shared screens and logic |
| **Platform splits** | Only where required: App Store vs Play billing links, push (**Future**), deep links, biometric APIs |
| **Distribution** | App Store (iOS) + Google Play (Android) — same release |
| **Deep links** | Universal links / app links for receive referrals (**MVP:** optional) |
| **Min OS** | Define at implementation (e.g. iOS 15+, Android 8+) |

#### Navigation architecture

**Bottom tabs (4):** Home · Savings · Card · Profile

**Stack / modal flows (not tabs):**

| Flow | Entry | Screens |
|------|-------|---------|
| Onboarding | App launch (unauthenticated) | Welcome → Auth |
| Add Money | Home | Add Money (inline states) |
| Withdraw | Home or Profile | Withdraw (inline states) |
| Send Money | Home | Send (multi-step) |
| Receive Money | Home | Receive |
| Request Money | Home | **MVP:** opens Receive or share sheet; full request API **Future** (PRD P1) |
| Transaction Detail | Home / Card activity | Transaction Detail |
| Goal Detail | Savings | Goal Detail + New Goal sheet |
| Growth Account | Savings or Home | Growth deposit / withdraw |
| Card reveal | Card | CVV reveal (auth-gated) |
| **Pia AI Coach** | Home (**Ask Pia**) or Profile | Pia chat (§12B) |

#### Screen inventory (maps to PRD — 12 screens)

| # | Screen | Tab / flow | Key APIs |
|---|--------|------------|----------|
| 1 | Welcome | Onboarding | — |
| 2 | Auth | Onboarding | Privy SDK, `POST /auth/sync` |
| 3 | Home (Dashboard) | Home tab | `GET /balance`, `GET /activity` |
| 4 | Add Money | Modal/stack | `POST /funding/deposits`, `GET .../deposits/:id` |
| 5 | Withdraw Money | Modal/stack | `POST /funding/withdrawals`, `GET .../withdrawals/:id` |
| 6 | Send Money | Modal/stack | `POST /transfers`, `GET /users/lookup` |
| 7 | Receive Money | Modal/stack | `GET /receive/link` |
| 8 | Transaction Detail | Stack | `GET /activity/:id` |
| 9 | Savings (goals list) | Savings tab | `GET /goals` |
| 10 | Goal Detail | Stack/sheet | `GET /goals/:id`, `POST .../allocate` |
| 10 | Card | Card tab | `GET /card`, `POST /card/issue`, `POST /card/freeze` |
| 11 | **Pia** | Stack (Home / Profile) | `GET /pia/thread`, `POST /pia/messages` |
| 12 | Profile | Profile tab | `GET /me`, `PATCH /me`, Privy sign-out |

*Growth account and withdraw flows are MVP capabilities (§7, §11) but may live inline on Home/Savings — not separate PRD screens. Withdraw is a modal/stack flow, not a tab.*

#### Mobile modules → providers

| Module | User-facing | Provider(s) |
|--------|-------------|-------------|
| Onboarding + Auth | Account creation | **Privy** |
| Invisible wallet | Automatic on auth sync | **Privy** + **Base** |
| Add money | Fund account | **BridgeXYZ** |
| Withdraw | Cash out to bank | **BridgeXYZ** |
| Dashboard | Balance + activity | Backend ledger |
| Send / Receive | P2P | Backend + **Base** (sponsored tx) |
| Savings goals | Goal envelopes | Backend ledger |
| Growth account | Earn on savings | **Aave / Morpho / Compound** (MVP: §11A Option A) |
| Debit card | Virtual card spend | **Gnosis Pay** |
| Profile | Account settings | Backend + **Privy** |
| Email receipts | Notifications | **Resend** (backend-triggered) |
| **Pia AI Coach** | Money bestie chat | **Anthropic API** (backend proxy only) |

#### Mobile app rules

- Never call Bridge, Gnosis Pay, LI.FI, yield protocols, or **Anthropic** directly from the app.
- Never display wallet addresses, chains, tokens, gas, or protocol names.
- All amounts in **USD** (two decimal places).
- All async flows use normalized statuses from backend (see Section 21).
- Poll or refresh on `processing` states until `completed` or `failed` (push **Future**).

#### Pia (AI Financial Coach) — summary

In-app **lightweight chat** backed by **Anthropic API** (server-side only). Full flow, guardrails, and APIs: **§12B**.

| Allowed | Not allowed |
|---------|-------------|
| Education (USDC, stablecoins, savings concepts) | Financial advice |
| Product guidance (how Olimpia features work) | Investment recommendations |
| Goal coaching (progress, motivation, next steps) | Trading or swap suggestions |
| Progress reinforcement (milestones, celebrations) | Tax, legal, or insurance advice |
| Plain-language explanations on user request | Portfolio picks or "buy/sell X" |

Voice and personality: **Brand.md — AI Guide (Pia)**. Persistent disclaimer: Pia is a coach, not a financial advisor.

---

### Frontend rules (both surfaces)

## 4. Backend Architecture

### Role

The Node.js backend is the **single orchestration layer** between the mobile app and all financial infrastructure providers.

### Core responsibilities (MVP)

1. Authenticate requests via Privy-issued tokens.
2. Provision and associate embedded wallets with Olimpia user records at onboarding.
3. Initiate and track Bridge on-ramp / off-ramp flows.
4. Initiate and track Gnosis Pay card lifecycle and spend events.
5. Execute and track yield deposits/withdrawals (growth account).
6. Record P2P transfers between Olimpia users.
7. Maintain savings goal allocations and activity history.
8. Invoke LI.FI routing when asset movement between positions requires it (server-side only).
9. Sponsor on-chain transactions via EIP-7702 relayer pattern (users never pay gas).
10. Consume provider webhooks and normalize status updates.
11. Send transactional email via Resend.
12. Expose a stable, dollar-denominated REST API to the mobile app.
13. Proxy Pia coach requests to Anthropic with guardrails, user context, and conversation persistence (§12B).

### Suggested internal structure (logical modules)

```
src/
├── api/              # Route handlers (REST)
├── auth/             # Privy token verification middleware
├── users/            # User profile service
├── wallets/          # Wallet linkage, address resolution
├── ledger/           # Balances, allocations, idempotency
├── funding/          # Bridge on-ramp / off-ramp
├── transfers/        # P2P send / receive
├── goals/            # Savings goals
├── growth/           # Yield allocations
├── card/             # Gnosis Pay integration
├── routing/          # LI.FI orchestration
├── pia/              # Coach: Anthropic client, prompts, guardrails, context assembly
├── webhooks/         # Inbound provider events
├── notifications/    # Resend email dispatch
└── jobs/             # Polling / retry workers (if webhooks delayed)
```

### Persistence (MVP)

| Store | Purpose |
|-------|---------|
| **Primary database** (e.g. PostgreSQL) | Users, wallets, transactions, goals, growth allocations, **Pia threads/messages**, webhook idempotency keys |
| **Secrets manager / env** | Provider API keys, webhook secrets, relayer keys |

No custom blockchain indexer required for MVP — rely on provider APIs, webhooks, and targeted on-chain reads where needed.

### Background processing (MVP)

- Webhook handlers (primary path for async state).
- Optional polling job for stuck Bridge / yield transactions (**MVP:** simple retry + manual support path acceptable).
- Balance reconciliation job (**Future** — recommended before production scale).

---

## 5. Wallet Architecture

### Provider: Privy

| Requirement | Architecture |
|-------------|--------------|
| Authentication | Privy handles sign-up, sign-in, session |
| Wallet creation | Embedded wallet created automatically during onboarding |
| Custody model | Non-custodial — user does not manage seed phrases |
| User experience | No wallet UI; account language only ("your account", "your balance") |
| Chain | Base only — hardcoded, never user-selectable |
| Asset | USDC on Base as primary settlement asset |

### Onboarding sequence

```
1. User completes Privy auth in mobile app
2. Privy creates embedded wallet (if new user)
3. App calls POST /auth/sync with Privy token
4. Backend:
   a. Verifies token with Privy
   b. Creates Olimpia user record
   c. Stores wallet address (internal only — not shown in UI)
   d. Initializes ledger with zero balances
5. User lands on Home / optional Add Money prompt
```

### Transaction execution

| Transaction type | Executor | Gas |
|------------------|----------|-----|
| P2P transfer | Backend-orchestrated transfer from sender wallet | Sponsored (EIP-7702) |
| Yield deposit / withdraw | Backend-orchestrated contract interaction | Sponsored |
| LI.FI route | Backend-initiated | Sponsored |
| Card spend | Gnosis Pay rails (off-chain auth + settlement) | N/A to user |

The mobile app **never** signs raw blockchain transactions in MVP. The backend (or Privy server wallet patterns supported by Privy) orchestrates on-chain actions on behalf of the user's embedded wallet per established non-custodial patterns.

### Internal vs. exposed data

| Stored | Exposed to user |
|--------|-----------------|
| Privy user ID | No |
| Wallet address | No |
| Base network | No |
| USDC | No — display as USD |

---

## 6. Funding / On-Ramp Flow

### Provider: BridgeXYZ

### User flow

```
Home → Add Money → Amount + payment method → Review → Confirm
    → "Processing" → "Complete" (or "Failed" + retry)
```

### System flow

```
Mobile App
    │ POST /funding/deposits { amountUsd, paymentMethod }
    ▼
Backend
    │ Create deposit record (status: pending)
    │ Call BridgeXYZ API — create on-ramp intent
    │ Return Bridge-hosted flow URL or embedded token (implementation-specific)
    ▼
User completes bank/card flow in Bridge UI (WebView or redirect)
    ▼
BridgeXYZ
    │ Settles USDC to user's Base wallet address
    │ Sends webhook: deposit processing / completed / failed
    ▼
Backend webhook handler
    │ Verify signature
    │ Update deposit record
    │ Credit available balance in ledger
    │ Send Resend email (funding confirmation)
    ▼
Mobile App
    │ Poll GET /funding/deposits/:id or receive push (**Future**)
    │ Dashboard reflects updated balance
```

### User-facing states (normalized)

| State | User sees |
|-------|-----------|
| `pending` | "Preparing your deposit" |
| `processing` | "Adding money to your account" |
| `completed` | "Money added" |
| `failed` | "We couldn't complete this deposit" + support CTA |

### MVP simplifications

- Single fiat currency (USD).
- Single payment method path per platform launch (e.g. ACH or card — pick one for fastest integration).
- No partial deposit handling beyond provider behavior.

---

## 7. Withdrawal / Off-Ramp Flow

### Provider: BridgeXYZ

### User flow

```
Home or Profile → Withdraw → Amount → Destination (linked bank) → Review → Confirm
    → Processing → Complete / Failed
```

### System flow

```
Mobile App
    │ POST /funding/withdrawals { amountUsd, destinationId }
    ▼
Backend
    │ Validate available balance (not locked in goals/growth if policy requires)
    │ Create withdrawal record (status: pending)
    │ Initiate USDC transfer from user wallet (sponsored) if funds not already in spendable pool
    │ Call BridgeXYZ off-ramp API
    ▼
BridgeXYZ
    │ Processes fiat payout
    │ Webhooks: processing / completed / failed
    ▼
Backend
    │ Debit ledger
    │ Email via Resend
    ▼
Mobile App
    │ Updated balance + activity entry
```

### Balance rules (MVP)

- Withdrawals draw from **available balance** only.
- Funds allocated to **savings goals** or **growth account** must be moved back to available before withdraw, or the API returns a clear insufficient-available error with user-friendly copy.

### User-facing states (normalized)

| State | User sees |
|-------|-----------|
| `pending` | "Preparing your withdrawal" |
| `processing` | "Sending money to your bank" |
| `completed` | "Withdrawal complete" |
| `failed` | "We couldn't complete this withdrawal" + support CTA |

---

## 8. Send Money Flow

### Architecture approach (MVP)

P2P transfers between Olimpia users. Recipient identified by **username, phone, or email** (exact identity scheme — see PRD open questions).

### User flow

```
Home → Send → Recipient → Amount + note → Review → Confirm → Success
```

### System flow (registered recipient)

```
Mobile App
    │ POST /transfers { toUserId | toHandle, amountUsd, note }
    ▼
Backend
    │ Verify sender balance
    │ Create transfer record (status: pending)
    │ Resolve recipient wallet address (internal)
    │ Execute USDC transfer on Base (sponsored)
    │ On confirmation: debit sender, credit recipient ledger
    │ Resend email to recipient
    ▼
Recipient app
    │ Activity feed + balance update
```

### Unregistered recipient (**MVP option — choose one at implementation**)

| Option | Complexity | Recommendation |
|--------|------------|----------------|
| **A. Olimpia users only** | Low | **MVP default** — recipient must have account |
| B. Claim link (email/SMS) | Medium | Future |
| C. External wallet address | High + breaks neobank UX | Not recommended |

### User-facing states

`pending` → `processing` → `completed` | `failed`

---

## 9. Receive Money Flow

### User flow

```
Home → Receive → Display username / QR / shareable link
Payer uses Send flow (registered payer required in MVP)
```

### System flow

```
Mobile App
    │ GET /receive/link (or static handle from GET /me)
    ▼
Display shareable identifier — no crypto address
    ▼
Payer completes Send flow (Section 8)
    ▼
Recipient sees incoming activity + balance update
```

### MVP simplifications

- No request-money flow (PRD P1).
- Receive = passive display of handle + notification when payment arrives.

---

## 10. Savings Goal Flow

### Concept

Savings goals are **logical envelopes** — allocations of the user's total balance toward named targets. They are not separate bank accounts or on-chain positions in MVP.

### User flow

```
Savings → New Goal (sheet) → Name, target, optional date, initial allocation
Goal Detail → Add / withdraw from goal → Progress view
```

### System flow

```
Mobile App
    │ POST /goals { name, targetUsd, targetDate?, initialAllocationUsd? }
    ▼
Backend
    │ Validate available balance for allocation
    │ Create goal record
    │ Move allocation: available → goal_allocated (ledger only)
    ▼
Goal Detail
    │ PATCH /goals/:id/allocate { amountUsd, direction: in|out }
```

### Rules

- Goal progress = `allocatedAmount / targetAmount`.
- Moving money into a goal reduces **available** balance; moving out increases it.
- Goals do not earn yield unless user separately moves funds to **growth account** (Section 11).
- Celebrate milestones per Brand.md (first goal, progress) — client-side triggers on status transitions.

---

## 11. Yield / Growth Account Flow

### Providers: Aave, Morpho, Compound (yield layer)

The approved stack includes three yield protocols. **MVP provider count is a product decision** — see **§11A** for explicit recommendation and tradeoffs. Architecture supports either path; user-facing experience remains a single **Growth account**.

### User-facing name

**"Grow your savings"** or **"Growth account"** — never Aave, Morpho, Compound, APY optimization, or DeFi language.

Brand-aligned copy: *"You earned your first passive income"* — not raw yield dollar amounts alone.

### Architecture

```
Mobile App
    │ POST /growth/deposit { amountUsd }
    ▼
Backend
    │ Validate available balance
    │ Create growth_allocation record
    │ Deposit USDC to yield provider on Base (MVP: single provider)
    │ Track position internally
    ▼
Ongoing
    │ Backend polls or receives provider events for accrued earnings
    │ Store estimated earnings — variable, not guaranteed
    ▼
Mobile App
    │ GET /growth → shows allocated amount + estimated earnings (disclaimer)
    │ POST /growth/withdraw { amountUsd } → reverse flow
```

### MVP simplifications

| Decision | MVP recommendation |
|----------|-------------------|
| Provider count | See **§11A** — **Option A (single provider) recommended** |
| Rate display | Estimated range or current rate with "variable, not guaranteed" disclaimer |
| Comparison UI | None — backend may compare providers **Future** |
| LI.FI | Used only if routing requires asset conversion (ideally avoid in MVP) |

### Withdraw from growth

```
POST /growth/withdraw → backend withdraws from protocol → credits available balance
```

Processing states mirror funding flows.

---

## 11A. Yield Layer Strategy — MVP Recommendation

### Context

The approved infrastructure stack includes three yield protocols:

| Protocol | Role in stack |
|----------|---------------|
| **Aave** | USDC lending / yield |
| **Morpho** | USDC lending / yield (optimizer/market variants) |
| **Compound** | USDC lending / yield |

Olimpia does **not** build yield protocols. The Node.js backend orchestrates deposits and withdrawals and presents one user-facing product: **Growth account** / **Grow your savings**. Protocol names are never shown in the app or marketing site.

The architecture already abstracts yield behind a `growth/` module and `GrowthAllocation` entity with a `provider` field — so multi-provider support is possible later without changing the mobile UX model.

This section documents **MVP provider strategy only**. It does not change flows, APIs, or infrastructure assumptions.

---

### Option A: Single-provider MVP *(recommended)*

**What it means:** Backend integrates **one** yield protocol on Base (e.g. Aave) for all Growth account deposits and withdrawals. Morpho and Compound are deferred.

| Dimension | Impact |
|-----------|--------|
| **Complexity** | **Low.** One set of contract interfaces, one webhook/polling pattern, one earnings calculation path, one reconciliation playbook. Single `growth` service adapter instead of a routing layer. |
| **Build speed** | **Fastest.** One integration to test end-to-end: deposit → accrue → display estimated earnings → withdraw. Fewer edge cases across protocol liquidity, withdrawal queues, and rate differences. |
| **User experience** | **Best for MVP.** Users see one clear action: *Grow your savings.* No choices, no rate shopping, no "which pool?" confusion. Aligns with Brand.md (confidence, simplicity, invisible infrastructure). Copy stays: estimated, variable, not guaranteed. |

**Tradeoffs accepted:**

- Backend cannot switch users to a higher-yield protocol without a migration flow (Future).
- Trusted Infrastructure section may show Morpho logo while MVP yield runs on Aave only — logos represent stack partners, not per-user routing at launch.
- If the single provider has an outage or liquidity constraint, Growth deposits/withdrawals may pause — mitigated by clear `processing` / `failed` states (§21).

**Recommendation rationale:** Olimpia MVP validates **whether women want the Growth account experience** — not whether backend can optimize across DeFi protocols. Single-provider maximizes speed to a working demo and keeps UX calm.

---

### Option B: Multi-provider MVP

**What it means:** Backend integrates **two or three** protocols at launch, with either (a) automatic routing to the best rate, or (b) a user-visible or backend-assigned provider per allocation.

| Dimension | Impact |
|-----------|--------|
| **Complexity** | **High.** Multiple contract adapters, protocol-specific deposit/withdraw flows, differing accrual math, multiple webhook sources, routing logic, failure handling per provider, and reconciliation across positions. LI.FI may be needed more often if assets must move between protocols. |
| **Build speed** | **Slower.** Each provider adds integration, testing, and ops surface. Routing/selection logic is a new subsystem. Estimated **2–3× yield-layer effort** vs. Option A before the core loop is demo-ready. |
| **User experience** | **Riskier for MVP.** Even if protocol names stay hidden, users may see variable rates, delays, or behavior differences that are hard to explain without crypto language. Rate comparison UI tempts scope creep. Conflicts with "premium calm" and invisible infrastructure principles unless routing is fully invisible and flawless. |

**When Option B might be justified:**

- Launch geography or regulatory posture requires a specific non-default provider.
- Single provider cannot support required USDC TVL or withdrawal reliability on Base at launch.
- Founder explicitly prioritizes yield optimization over time-to-MVP.

**Not recommended for prototype** unless one of the above is true.

---

### Recommendation

| | |
|---|---|
| **Recommended MVP** | **Option A — Single-provider** (Aave on Base as default starting point unless integration blockers favor Morpho or Compound) |
| **Deferred** | Multi-provider routing, rate comparison UI, automatic best-yield selection |
| **Future** | Option B patterns via `GrowthAllocation.provider` + backend routing module — no mobile UX change required |

**User experience unchanged either way:** One Growth account. Dollars in, estimated earnings shown, variable disclaimer. Brand celebration copy (*"You earned your first passive income"*) — not protocol performance leaderboards.

---

## 12. Debit Card Flow

### Provider: Gnosis Pay

### User flow

```
Card tab → View virtual card (masked) → Reveal CVV (auth required) → Freeze / unfreeze
Merchant tap → Push/email notification → Activity updates
```

### System flow

```
Onboarding / card activation (first visit to Card tab)
    │ POST /card/issue (if not yet issued)
    ▼
Backend
    │ Call Gnosis Pay — issue virtual card linked to user's spendable USDC balance
    │ Store card metadata (last four, status — never full PAN in logs)
    ▼
Card spend (at merchant)
    │ Gnosis Pay authorizes against stablecoin balance
    │ Webhook → backend: card authorization / settlement
    ▼
Backend
    │ Debit available balance in ledger
    │ Create card_transaction record
    │ Notify user (email MVP; push Future)
    ▼
Mobile App
    │ Activity feed + Card recent spends
```

### User experience rules

- Card labeled **debit card** — not crypto card.
- Freeze is instant via `POST /card/freeze`.
- Card draws from **available balance** (not goal-allocated or growth-allocated funds unless product policy changes).

### MVP simplifications

- Virtual card only.
- Single currency (USD / USDC-backed).
- Geography limited to Gnosis Pay supported regions (define at launch).

---

## 12A. Profile Flow

### User flow

```
Profile tab → View account info (name, email, username)
→ Notification preferences
→ Linked funding destination (bank — via Bridge)
→ Security (biometric toggle, sign out)
→ Support link
→ Sign out (Privy)
```

### System flow

```
Mobile App
    │ GET /me
    ▼
Display profile fields + handle used for receive
    │
    │ PATCH /me { displayName, notificationPrefs }
    ▼
Backend updates user record

Sign out → Privy SDK logout → clear local session → Welcome screen
```

### Profile — no separate Settings screen (PRD)

Settings merged into Profile tab per PRD screen inventory.

---

## 12B. Pia AI Financial Coach Flow

### Role

**Pia** is Olimpia's in-app AI coach ("money bestie") — a **lightweight chat** for education, product guidance, goal coaching, and progress reinforcement. Pia uses the **Anthropic Messages API** exclusively through the Node.js backend. The mobile app never holds an Anthropic API key.

Pia is **not** a financial advisor, investment recommender, or trading assistant.

### User-facing experience

| Element | Spec |
|---------|------|
| **Entry points** | Home quick action **Ask Pia** · Profile **Ask Pia** |
| **Screen** | Message thread (user + Pia bubbles), text input, send button |
| **Suggested prompts** | 3–4 chips on empty state — e.g. *How do goals work?* · *What is growth?* · *Am I on track?* |
| **Disclaimer** | Persistent footer or first-visit notice: *Pia is your money coach, not a financial advisor.* |
| **Tone** | Brand.md — supportive, encouraging, plain language; playfulness 6/10 |

### Allowed coaching scope

| Category | Examples |
|----------|----------|
| **Education** | What USDC/stablecoins are; how savings and growth work at a beginner level; general money confidence topics |
| **Product guidance** | How to add money, set a goal, use growth account, freeze card, send/receive |
| **Goal coaching** | Progress toward named goals; encouragement; simple next steps (*add $20 this week*) |
| **Progress reinforcement** | Celebrate first deposit, goal milestones, starting growth — Brand-aligned copy |

### Hard boundaries (guardrails)

Backend **must** enforce — not rely on prompt alone:

| Block | Behavior |
|-------|----------|
| **Financial advice** | Refuse; redirect to educational framing or human support |
| **Investment recommendations** | No buy/sell/hold specific securities, tokens, or assets |
| **Trading features** | No swap, trade, or speculation instructions |
| **Tax / legal** | No tax filing, legal, or insurance advice — suggest professional help |
| **Crypto operations** | Never instruct user to manage wallets, keys, gas, or chains |
| **Guaranteed returns** | Never promise fixed yield; growth is estimated and variable |

**Output filter (MVP):** Keyword and pattern checks on model output before returning to client; log blocked responses internally. **Future:** classifier or secondary model review.

### System flow

```
Mobile App
    │ GET /pia/thread          → load history + suggested prompts
    │ POST /pia/messages { content }
    ▼
Backend (pia module)
    │ Verify Privy auth
    │ Rate-limit per user
    │ Load PiaThread + recent PiaMessage rows (last N turns)
    │ Assemble context snapshot (read-only aggregates — see below)
    │ Build system prompt + messages → Anthropic Messages API
    │ Apply output guardrails
    │ Persist user message + assistant reply
    ▼
Mobile App
    │ Append Pia reply to thread
    │ Optional: surface milestone toast if reply references celebration trigger
```

**MVP:** Non-streaming response acceptable (single JSON reply). Streaming (**Future**) via SSE if UX requires lower perceived latency.

### Context snapshot (injected per request)

Backend assembles a **read-only JSON context** from Olimpia data — never raw provider payloads or wallet addresses:

| Field | Source | Use |
|-------|--------|-----|
| `displayName` | User | Personalization |
| `balanceSummary` | Ledger | Available, goals allocated, growth allocated (USD) |
| `goals[]` | Goal | name, targetUsd, allocatedUsd, progressPercent |
| `growthSummary` | GrowthAllocation | principalUsd, estimatedEarningsUsd, inGrowth boolean |
| `recentMilestones[]` | Derived | e.g. first_goal_created, first_growth_deposit — optional MVP |
| `productFacts` | Static config | Olimpia is not a bank; dollars not crypto in UI; support email |

Do **not** send: email, phone, full transaction history, PAN, webhook payloads, or on-chain addresses to Anthropic unless required and documented — prefer aggregates and first names only.

### System prompt (direction)

Fixed server-side template (Brand.md voice) including:

1. Pia identity — money bestie, women-first supportive tone
2. Scope — educate, guide product, coach goals, celebrate progress
3. Refusal rules — no financial advice, investments, trading, tax/legal
4. Product facts — wrapper model, invisible USDC, growth is variable
5. Context block — serialized snapshot from backend
6. Response length — concise; prefer short paragraphs and one clear next step

### Data model additions

| Entity | Key fields | Notes |
|--------|------------|-------|
| **PiaThread** | id, userId, createdAt, updatedAt | One thread per user (MVP) |
| **PiaMessage** | id, threadId, role (`user` \| `assistant`), content, createdAt, blocked? | Append-only log |

```
User 1──1 PiaThread
PiaThread 1──* PiaMessage
```

**Retention (MVP):** Store full history; send last **20 messages** (10 turns) to Anthropic for context window control.

### API routes

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/pia/thread` | Thread id, recent messages, suggested prompts, disclaimer | Yes |
| POST | `/pia/messages` | Send user message; return assistant reply | Yes |
| DELETE | `/pia/thread` | Clear conversation history | **Future** |

`POST /pia/messages` body: `{ "content": "string" }`  
Response: `{ "message": { "role": "assistant", "content": "..." }, "blocked": false }`

### Anthropic integration (backend)

| Concern | MVP approach |
|---------|----------------|
| **API** | Anthropic Messages API (`POST /v1/messages`) |
| **Model** | Claude Haiku or Sonnet — choose at implementation for cost/latency vs. quality |
| **Secrets** | `ANTHROPIC_API_KEY` in secrets manager only |
| **Timeout** | 30s max; friendly error to user on timeout |
| **Rate limit** | e.g. 30 messages / user / hour (tune at launch) |
| **Idempotency** | Optional `Idempotency-Key` header on POST to prevent duplicate sends |
| **Logging** | Log request ids and latency; do not log full message content in production logs (**Future** redaction policy) |

### MVP simplifications

| Area | MVP | Deferred |
|------|-----|----------|
| **Threads** | One thread per user | Multiple threads / topics |
| **Streaming** | Full reply in one response | SSE token stream |
| **Proactive Pia** | User-initiated only | Push nudges, milestone messages |
| **Tool use** | Context snapshot only | LLM tools that mutate ledger |
| **Voice input** | Text only | Speech-to-text |
| **Human handoff** | Support email link in refusal copy | In-app support chat |

### Security & privacy

- Anthropic API key never in mobile app or marketing site.
- Pia endpoints require Privy auth — same as other `/api/v1` routes.
- Minimize PII in prompts; use aggregates for financial state.
- Block requests attempting to extract system prompt or bypass guardrails.
- Document Anthropic data handling in Privacy Policy at launch.

### Risks

| Risk | Mitigation |
|------|------------|
| Model gives investment advice | System prompt + output filter + refusal templates |
| Hallucinated product behavior | `productFacts` in context; keep answers aligned with actual MVP features |
| Over-sharing user data | Context snapshot whitelist |
| API cost abuse | Per-user rate limits |
| User treats Pia as advisor | Persistent disclaimer; refusal copy reinforces coach role |

---

## 13. Data Model

Logical entities — implementation types deferred.

### Core entities

| Entity | Key fields | Notes |
|--------|------------|-------|
| **User** | id, privyUserId, email, phone, username, displayName, createdAt | Profile |
| **Wallet** | id, userId, address, chain=base, privyWalletId | Internal only |
| **BalanceSnapshot** | userId, availableUsd, goalsAllocatedUsd, growthAllocatedUsd, totalDisplayUsd | Computed or materialized |
| **Transaction** | id, userId, type, amountUsd, status, counterpartyId?, providerRef, metadata, createdAt | Unified activity feed |
| **Deposit** | id, userId, amountUsd, status, bridgeIntentId, createdAt | On-ramp |
| **Withdrawal** | id, userId, amountUsd, status, bridgePayoutId, destinationId, createdAt | Off-ramp |
| **Transfer** | id, senderId, recipientId, amountUsd, note, status, txHash? | P2P |
| **Goal** | id, userId, name, targetUsd, allocatedUsd, targetDate?, status | Savings envelope |
| **GoalMovement** | id, goalId, amountUsd, direction, createdAt | Audit trail |
| **GrowthAllocation** | id, userId, principalUsd, estimatedEarningsUsd, provider, status | Yield position |
| **Card** | id, userId, gnosisCardId, lastFour, status, frozen | Virtual card |
| **CardTransaction** | id, userId, cardId, amountUsd, merchantName, status, createdAt | Spend history |
| **WebhookEvent** | id, provider, eventId, payload, processedAt | Idempotency |
| **WaitlistEntry** | id, email, createdAt, source | Marketing signups |
| **PiaThread** | id, userId, createdAt, updatedAt | One coach thread per user (MVP) |
| **PiaMessage** | id, threadId, role, content, createdAt, blocked | Chat history |

### Transaction types (activity feed)

`deposit` · `withdrawal` · `transfer_in` · `transfer_out` · `goal_allocation` · `goal_withdrawal` · `growth_deposit` · `growth_withdrawal` · `growth_earning` · `card_spend`

### Relationships

```
User 1──1 Wallet
User 1──* Transaction
User 1──* Goal
User 1──0..1 Card
User 1──0..1 GrowthAllocation
User 1──1 PiaThread
PiaThread 1──* PiaMessage
Goal 1──* GoalMovement
```

---

## 14. API Route Inventory

Base path: `/api/v1` — all routes require Privy auth unless noted.

### Auth & user

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| POST | `/auth/sync` | Post-login user + wallet provisioning | Yes |
| GET | `/me` | Profile + handle + notification prefs | Yes |
| PATCH | `/me` | Update profile | Yes |

### Balance & activity

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/balance` | Available, goals, growth, total (USD) | Yes |
| GET | `/activity` | Paginated transaction feed | Yes |
| GET | `/activity/:id` | Transaction detail | Yes |

### Funding

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| POST | `/funding/deposits` | Initiate on-ramp | Yes |
| GET | `/funding/deposits/:id` | Deposit status | Yes |
| POST | `/funding/withdrawals` | Initiate off-ramp | Yes |
| GET | `/funding/withdrawals/:id` | Withdrawal status | Yes |
| GET | `/funding/destinations` | Linked bank accounts (Bridge) | Yes |

### Transfers

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| POST | `/transfers` | Send money | Yes |
| GET | `/receive/link` | Shareable receive info | Yes |
| GET | `/users/lookup?q=` | Resolve recipient by handle/phone/email | Yes |

### Goals

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/goals` | List goals | Yes |
| POST | `/goals` | Create goal | Yes |
| GET | `/goals/:id` | Goal detail | Yes |
| PATCH | `/goals/:id` | Update goal metadata | Yes |
| POST | `/goals/:id/allocate` | Add/remove goal funds | Yes |

### Growth

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/growth` | Growth account summary + estimated earnings | Yes |
| POST | `/growth/deposit` | Allocate to growth | Yes |
| POST | `/growth/withdraw` | Withdraw from growth | Yes |

### Card

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/card` | Card metadata + status | Yes |
| POST | `/card/issue` | Issue virtual card | Yes |
| POST | `/card/freeze` | Freeze / unfreeze | Yes |
| GET | `/card/transactions` | Card spend history | Yes |

### Pia (AI Financial Coach)

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/pia/thread` | Load thread, history, suggested prompts | Yes |
| POST | `/pia/messages` | Send message; receive Pia reply | Yes |

### Webhooks (inbound — no user auth)

| Method | Route | Provider | MVP |
|--------|-------|----------|-----|
| POST | `/webhooks/bridge` | BridgeXYZ | Yes |
| POST | `/webhooks/gnosis-pay` | Gnosis Pay | Yes |
| POST | `/webhooks/yield` | Yield provider (if applicable) | Yes |

### Marketing (no Privy auth)

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| POST | `/waitlist` | Email capture for app launch | Yes |

### Health

| Method | Route | Purpose | MVP |
|--------|-------|---------|-----|
| GET | `/health` | Liveness | Yes |

---

## 15. Provider Responsibilities

| Provider | Olimpia depends on them for | Olimpia backend must |
|----------|----------------------------|----------------------|
| **Privy** | Auth, embedded wallets, session tokens | Verify tokens; map privyUserId → User; never expose seed phrases |
| **Base** | USDC settlement, transaction finality | Hardcode network; sponsor gas; read balances as needed |
| **BridgeXYZ** | Fiat ↔ USDC conversion, KYC/ramp compliance | Create intents; handle webhooks; map to deposit/withdrawal records |
| **Gnosis Pay** | Virtual card issuance, authorization, settlement | Issue card; process spend webhooks; debit ledger |
| **LI.FI** | Cross-asset / cross-route swaps | Invoke only server-side when required; hide all routing from UI |
| **Aave / Morpho / Compound** | USDC yield | Deposit/withdraw USDC; track position; show estimated earnings |
| **Resend** | Email delivery | Send receipts, confirmations, security notices |
| **Anthropic** | LLM completions for Pia coach | Proxy messages server-side; apply guardrails; never expose API key to clients |
| **EIP-7702 relayer** | Gas sponsorship | Pay gas; never surface fees to user |

---

## 16. Webhook Strategy

### Principles

1. **Webhooks are the source of truth** for async provider state.
2. Every handler must be **idempotent** (store `eventId`; skip duplicates).
3. Verify **signatures** on every inbound webhook.
4. Normalize provider-specific statuses to Olimpia's user-facing state machine before persisting.
5. On webhook failure, return non-2xx so providers retry; log for manual intervention.

### Provider → event mapping (MVP)

| Provider | Events | Backend action |
|----------|--------|----------------|
| **BridgeXYZ** | Deposit pending / completed / failed | Update `Deposit`; credit ledger on completed |
| **BridgeXYZ** | Withdrawal pending / completed / failed | Update `Withdrawal`; confirm debit |
| **Gnosis Pay** | Card authorized / settled / declined | Create `CardTransaction`; debit on settle |
| **Gnosis Pay** | Card status changed | Update `Card.frozen`, etc. |
| **Yield provider** | Position updated / withdrawal ready | Update `GrowthAllocation` earnings |

### Fallback (MVP)

- Polling job for records stuck in `processing` > N minutes.
- Admin/support view to manually reconcile (**Future** — manual DB/script acceptable for prototype).

### Outbound notifications

| Trigger | Channel (MVP) | Channel (Future) |
|---------|---------------|------------------|
| Deposit completed | Resend email | + Push |
| Withdrawal completed | Resend email | + Push |
| Transfer received | Resend email | + Push |
| Card spend | Resend email | + Push |
| Growth earnings update | In-app only | + Email digest |

---

## 17. Security Considerations

| Area | MVP approach |
|------|--------------|
| **Authentication** | Privy-issued tokens; backend verifies on every API request |
| **Authorization** | Users access only their own resources (userId from token) |
| **Wallet keys** | Managed by Privy; Olimpia never stores seed phrases |
| **Webhook security** | Signature verification per provider; reject unsigned requests |
| **PII** | Encrypt sensitive fields at rest; minimize logging of PAN/CVV |
| **Card data** | Display via Gnosis Pay secure components or tokenized API — never store full PAN/CVV in Olimpia DB |
| **API** | HTTPS only; rate limiting on auth and transfer endpoints |
| **Idempotency** | Idempotency keys on `POST /transfers`, `/funding/*`, `/growth/*` |
| **Pia / Anthropic** | API key server-only; rate-limit `/pia/*`; minimize PII in prompts; output guardrails (§12B) |
| **Audit** | Append-only transaction log; webhook event store |

**Prototype caveat:** This is a consumer finance prototype, not a licensed bank. Security controls reflect best-effort MVP — not production banking grade.

---

## 18. Risk Areas

| Risk | Impact | Mitigation (architecture-level) |
|------|--------|----------------------------------|
| Provider outage | Flows blocked | Graceful errors; queue retries; status polling |
| Webhook delay | Stale UI | Polling fallback; clear "processing" copy |
| Bridge settlement delay | User anxiety | Normalized processing states; email updates |
| Yield rate variability | Trust erosion | Estimated / variable disclaimers; Brand-aligned celebration copy |
| Insufficient available balance | Failed sends/withdrawals/card | Ledger checks before initiation; friendly errors |
| Gnosis Pay geo limits | Card unavailable | Define launch geography; gate card tab |
| On-chain tx failure | Stuck transfers | Retry logic; support escalation path |
| Privy session expiry | API errors | Refresh flow in mobile SDK |
| Sponsored tx budget exhaustion | On-chain ops fail | Monitor relayer balance; alert internally |
| P2P recipient not found | Send fails | User lookup validation before confirm |
| Pia inappropriate advice | Regulatory / trust risk | Guardrails, disclaimers, refusal templates (§12B) |
| Regulatory / KYC gaps | Ramp or card blocked | Bridge and Gnosis handle KYC; backend surfaces provider errors plainly |

---

## 19. MVP Simplifications

Explicit choices to optimize for **fastest working MVP**:

| Area | MVP choice | Deferred |
|------|------------|----------|
| **Platforms** | React Native iOS + Android simultaneous | Base App |
| **Users** | Olimpia-to-Olimpia P2P only | Claim links, request money |
| **Ramp** | USD only; one payment method | Multi-method, multi-currency |
| **Yield** | **Option A:** Single provider (§11A) | Multi-provider routing (Option B) |
| **LI.FI** | Use only when unavoidable | Exposed swaps |
| **Card** | Virtual only | Physical card |
| **Goals** | Ledger envelopes, no on-chain per-goal | Smart contract goals |
| **Marketing site** | Static landing page | CMS, blog, waitlist API |
| **Notifications** | Email (Resend) | Push notifications |
| **Pia AI Coach** | Lightweight chat + Anthropic (§12B) | Proactive nudges, streaming, multi-thread |
| **Analytics** | Basic event logging | Data warehouse, cohort dashboards |
| **Admin** | Manual DB/support scripts | Admin dashboard |
| **Reconciliation** | Manual spot checks | Automated reconciliation jobs |

### Balance policy (MVP default)

```
totalDisplay = available + goalsAllocated + growthAllocated
```

Card, send, and withdraw operate on **available** only.

---

## 20. Future Architecture Scope

| Feature | Notes |
|---------|-------|
| **AI Financial Advisor** | PRD future feature — distinct from Pia coach; deeper personalized advisory flows |
| **Request money** | P2P request flow with pending states |
| **Push notifications** | FCM (Android) + APNs (iOS) via notification service |
| **Physical debit card** | Gnosis Pay physical issuance |
| **Multi-provider yield routing** | Backend selects best rate across Aave / Morpho / Compound |
| **Spending insights** | Categorization, trends |
| **Education modules** | In-app curriculum |
| **Claim link / unregistered receive** | Email/SMS payment links |
| **Base App** | Additional distribution surface |
| **Android / iOS feature parity monitoring** | Automated device testing |
| **Automated reconciliation** | On-chain vs. ledger vs. provider balances |
| **Admin dashboard** | Support, manual review, user lookup |
| **International** | Multi-currency, multi-region ramps |
| **Joint goals / family accounts** | Shared ledger logic |

---

## 21. User-Facing State Model

All async money flows (mobile app) use a **single normalized state machine** returned by the backend. The app never interprets raw provider statuses.

### Canonical states

| State | Meaning | Typical UI treatment |
|-------|---------|----------------------|
| `pending` | Request accepted; not yet with provider | Spinner + "Preparing…" |
| `processing` | Provider is working; funds in flight | Spinner + "Processing…" + do not allow duplicate submit |
| `completed` | Success; ledger updated | Success confirmation + refresh balance/activity |
| `failed` | Terminal error | Error message + retry CTA + support link |

### State mapping by flow

| Flow | Entity | pending | processing | completed | failed |
|------|--------|---------|------------|-----------|--------|
| **Add money** | `Deposit` | Preparing deposit | Adding money | Money added | Couldn't complete deposit |
| **Withdraw** | `Withdrawal` | Preparing withdrawal | Sending to bank | Withdrawal complete | Couldn't complete withdrawal |
| **Send money** | `Transfer` | Preparing transfer | Sending | Sent | Couldn't send |
| **Receive money** | `Transfer` (incoming) | — | Incoming | Received | — |
| **Growth deposit** | `GrowthAllocation` | Moving to growth | Growing | In growth account | Couldn't allocate |
| **Growth withdraw** | `GrowthAllocation` | Withdrawing from growth | Processing | Back in balance | Couldn't withdraw |
| **Card spend** | `CardTransaction` | — | Processing | Spent at {merchant} | Declined |

### Client behavior rules

1. On `POST` that starts an async flow, UI immediately shows `pending` or `processing` from response.
2. Poll `GET /funding/deposits/:id`, `GET /activity/:id`, etc. while `processing` — or refresh Home on focus.
3. Disable duplicate submissions with idempotency keys on retry.
4. Map all copy through Brand.md voice — no technical errors exposed raw.
5. Email confirmation (Resend) fires on `completed` for deposit, withdraw, transfer received, card spend.

### Provider → canonical state (backend responsibility)

```
Bridge webhook "funds_received"     → processing → completed
Bridge webhook "failed"           → failed
Gnosis "authorized"               → processing
Gnosis "settled"                  → completed
Gnosis "declined"                 → failed
Yield "position_updated"          → processing or completed (contextual)
On-chain tx mempool               → processing
On-chain tx confirmed             → completed
On-chain tx reverted              → failed
```

Backend normalizes before writing `Transaction.status` and API responses.

---

## 22. Architecture Coverage Matrix

Confirms this document covers **marketing website** and **React Native mobile app** before finalization.

### Marketing website

| Area | Covered in | Status |
|------|------------|--------|
| Landing page structure | §3A section map | ✓ |
| Navigation | §3A | ✓ |
| Hero section | §3A | ✓ |
| Product preview / mockup | §3A | ✓ |
| Built Around Real Life | §3A | ✓ |
| Your Money Bestie (Pia) | §3A, §3B, §12B | ✓ |
| Trusted Infrastructure | §3A | ✓ |
| Features (5 pillars) | §3A | ✓ |
| How It Works (4 steps) | §3A | ✓ |
| FAQ | §3A | ✓ |
| Waitlist / app download CTA | §3A waitlist modal, §14 `/waitlist` | ✓ |
| Footer | §3A | ✓ |
| `/learn/usdc` education page | §3A routes, SEO §5 | ✓ |
| `/llms.txt` agent-readable summary | §3A SEO §4 | ✓ |
| SEO + agent optimization | §3A SEO subsection | ✓ |
| Semantic HTML + metadata | §3A SEO §1–2 | ✓ |
| JSON-LD structured data | §3A SEO §3 | ✓ |
| FAQ as real HTML | §3A FAQ, SEO §6 | ✓ |
| Accessibility (alt, contrast, responsive) | §3A SEO §7 | ✓ |

### React Native mobile app

| Area | Covered in | Status |
|------|------------|--------|
| iOS + Android structure | §3B platform structure | ✓ |
| App navigation + screen inventory | §3B | ✓ |
| Onboarding | §3B, §5 | ✓ |
| Authentication (Privy) | §3B, §5 | ✓ |
| Invisible Privy wallet creation | §5 | ✓ |
| Dashboard (Home) | §3B, flows | ✓ |
| Add money / Bridge on-ramp | §6 | ✓ |
| Withdraw / Bridge off-ramp | §7 | ✓ |
| Send money | §8 | ✓ |
| Receive money | §9 | ✓ |
| Savings goals | §10 | ✓ |
| USDC Growth Account / yield | §11 | ✓ |
| Virtual debit card (Gnosis Pay) | §12 | ✓ |
| Profile | §12A | ✓ |
| Pia AI Financial Coach (in-app) | §3B, §12B | ✓ |
| User-facing states (all flows) | §21 | ✓ |

### Backend & infrastructure

| Area | Covered in | Status |
|------|------------|--------|
| Node.js orchestration | §4 | ✓ |
| Provider webhooks | §16 | ✓ |
| Status tracking + normalization | §16, §21 | ✓ |
| API route inventory | §14 | ✓ |
| Data model | §13 | ✓ |
| Privy · Base · Bridge · Gnosis Pay · LI.FI · Yield · Resend · **Anthropic** | §15 | ✓ |
| EIP-7702 gas sponsorship | §1, §5 | ✓ |

---

## Document flow

```
PRD.md (approved)
    ↓
Brand.md (approved)
    ↓
Architecture.md (this document)
    ↓
Implementation planning (future — not in scope here)
```

---

## Approval checklist

Before implementation begins:

- [ ] Architecture overview and wrapper model accepted
- [ ] **Marketing website** section map and waitlist flow accepted (§3A)
- [ ] **Marketing SEO + agent optimization** accepted (§3A — semantic HTML, metadata, JSON-LD, `/llms.txt`, `/learn/usdc`)
- [ ] **Mobile app** navigation, screens, and platform strategy accepted (§3B)
- [ ] MVP capability list confirmed (including withdraw + growth)
- [ ] Pia AI Financial Coach scope and guardrails accepted (§12B)
- [ ] Pia / AI Guide confirmed as **in-app MVP** — marketing preview only on web (§3A)
- [ ] Provider stack unchanged
- [ ] API route inventory sufficient (including `/waitlist`)
- [ ] Balance and ledger policy confirmed
- [ ] User-facing state model accepted (§21)
- [ ] Coverage matrix (§22) reviewed
- [ ] MVP simplifications accepted
- [ ] Launch geography defined (Bridge + Gnosis Pay constraints)

- [ ] Yield layer strategy: **Option A (single provider)** accepted per §11A

---

*End of Architecture.md v1.4*
