# Olimpia MVP Launch Checklist

**Status:** Primary execution document  
**Architecture:** [Architecture.md](./architecture/Architecture.md) · [ADR-013](./architecture/ArchitectureDecisionLog.md)  
**Scope:** [V1Scope.md](./product/V1Scope.md) · [PRD.md](./product/PRD.md)  
**Last status review:** 2026-08-07 (against current `apps/mobile` + `apps/api` codebase)

---

# Purpose

This document is the single source of truth for executing the remaining Olimpia MVP.

Every engineering task should support one objective:

**Get the app submitted to the Apple App Store as quickly as possible while maintaining a stable, production-quality MVP.**

The checklist should always be worked from the top down.

Do not skip unfinished P0 items.

Do **not** plan work in multi-week “phases.” Use P0 → P1 → App Store → P2 only.

---

# Current MVP Architecture

Authentication

- Privy

Wallet

- Privy Embedded Wallet

Blockchain

- Base

Primary Asset

- USDC

Add Funds

- Coinbase Headless Onramp

Growth Account

- Aave

Backend

- Node.js / Express
- PostgreSQL / Supabase

Marketing

- Vercel

Analytics

- Google Analytics 4

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

**Not in this MVP:** Bridge.xyz, Dakota, bank withdrawal / off-ramp, virtual card, functional Pia.

---

# Section 1 — Core user journey

Ideal first-time journey:

```text
User downloads app
  ↓
Creates account
  ↓
Authenticates with Privy
  ↓
Embedded wallet is created
  ↓
Adds money using Coinbase Headless
  ↓
Receives USDC on Base
  ↓
Balance updates
  ↓
Activity reflects transaction
  ↓
Moves USDC into Growth
  ↓
Begins earning yield
  ↓
Understands what happened through a simple UI
```

**Every remaining engineering task must support this journey.**

---

# Section 2 — P0 Critical path

These tasks block App Store readiness. Work top to bottom. Checkboxes reflect **current repo status** (checked = already satisfied in code / product surfaces today).

## Authentication

- [x] Privy email OTP sign-up / sign-in wired (`AuthScreen`, `useEmailAuthFlow`)
- [x] Backend auth sync (`POST /api/v1/auth/sync`) creates / links user
- [x] Session restoration on cold start (`useSessionRestore`, `GET /api/v1/me`)
- [x] Logout via Privy (`ProfileScreen`)
- [ ] End-to-end auth verified on **TestFlight / device** against staging or production API
- [ ] Production Privy app config matches iOS bundle ID `app.olimpia.mobile` and scheme `olimpia`

## Wallet

- [x] Embedded Ethereum wallet created on login when missing (`useEmbeddedEthereumWallet().create()`)
- [x] Wallet address stored via auth sync (`wallets` table, chain `base`)
- [x] Wallet never shown on Home / Profile (only needed later on Transfer USDC)
- [ ] Wallet persistence / recovery validated on fresh install + reinstall (device)
- [ ] Confirm Privy wallet is always available before Add Money / Growth

## Remove legacy Bridge funding (blocks Coinbase)

- [x] Delete / replace `createBridgeOnRamp` (`apps/api/src/funding/provider.ts`)
- [x] Unmount `/webhooks/bridge` (`apps/api/src/app.ts`, `routes/webhooks/bridge.ts`)
- [x] Remove `BRIDGE_*` env resolution; stop `FUNDING_PROVIDER=bridge` (`config/env.ts`, `.env.example`)
- [x] Replace `bridge_intent_id` with provider-neutral `provider_transaction_id` (migration + funding module)
- [x] Production fails closed without Coinbase — never falls back to Bridge

## Coinbase Headless Onramp

- [ ] Obtain Coinbase Headless sandbox + production credentials
- [ ] Backend: create onramp session (destination = Privy wallet, Base, USDC)
- [ ] Mobile: launch Coinbase Headless purchase flow from Add Money
- [ ] Receive completion callback / webhook (or equivalent confirmation)
- [ ] Deliver / confirm USDC to embedded wallet on Base
- [ ] Idempotent ledger credit once (`LedgerService` path already exists for deposits — wire to Coinbase completion)
- [ ] Handle errors (failed quote, payment fail, provider error)
- [ ] Handle cancellations (safe return; no credit)
- [ ] Flip `/me` eligibility `onRamp` to available when live (currently hardcoded `false` in API)

## USDC / balances

- [x] Backend balance buckets (`available`, `goals`, `growth`, `totalDisplay`) readable via API
- [x] Home shows backend balance (funded + empty states)
- [x] Add Money UI amount → review → status + deposit polling (today hits **mock / Bridge**, not Coinbase)
- [ ] Real USDC receipt via Coinbase Headless confirmed on-chain / by provider
- [ ] Balance refreshes after completed onramp on Home without manual restart
- [ ] Transfer USDC (receive address + QR + Base warning) — **not built** (Receive screen is Coming soon stub)

## Activity

- [x] API activity list + detail routes exist (`GET /api/v1/activity`, `/:id`)
- [x] Ledger writes a deposit activity row on completed deposit credit
- [ ] Mobile Home “Recent activity” loads from API (today is **hardcoded empty state only**)
- [ ] Activity shows deposits with clear status
- [ ] Activity shows Growth deposits / withdrawals when Growth ships
- [ ] Transaction detail screen (does not exist yet — optional if Home list + status is enough for MVP)

## Growth Account (Aave)

- [x] Home / Choose Yield **entry points** exist in navigation
- [ ] Choose Yield is functional (today: **Coming soon placeholder**)
- [ ] Backend Aave adapter (deposit / withdraw / position) — **does not exist**
- [ ] Deposit USDC into Aave from Available (explicit user authorization)
- [ ] Withdraw from Aave back to Available
- [ ] Display estimated APY from real rate source (Home currently shows hardcoded `4.2` — must not ship as real)
- [ ] Display Growth allocated balance from backend (column exists; nothing writes it yet)
- [ ] Enable `eligibility.growth` when ready

## Dashboard / Home

- [x] Empty-account CTA: Add Funds path
- [x] Funded Home layout with Available / earning sections (UI)
- [x] Loading / error handling for auth sync and Add Money submit
- [ ] Remove or gate fake APY until Growth is live
- [ ] Pull-to-refresh / re-fetch balance + activity after funding
- [ ] Correct empty / loading / error states for activity section once wired

## Staging / production API readiness

- [ ] Staging API deployed with HTTPS (webhooks)
- [ ] PostgreSQL migrations applied in staging / production
- [ ] Mobile pointed at staging via `EXPO_PUBLIC_API_BASE_URL`
- [ ] Secrets: Privy + Coinbase only (no Bridge keys)
- [ ] Mock funding forbidden in production builds

---

# Section 3 — P1 Required before App Store submission

These do not change core business logic but are required for a production-quality submission. **Do not start while blocked P0 items remain**, unless a P0 is waiting on external credentials and the work is parallelizable (e.g. app icon).

## UI polish

- [x] Brand colors / typography tokens present on core screens
- [x] Empty Home + Add Money flows have intentional visual design
- [ ] Consistent loading states across Home, Add Money, Growth, Activity
- [ ] Consistent empty states (especially activity once wired)
- [ ] Consistent error states (network, provider, insufficient funds)
- [ ] Offline / no-network friendly messaging
- [ ] Motion: keep calm; finish intentional transitions on auth → Home → Add Money
- [ ] Typography + spacing pass against brand tokens (no one-off sizes)
- [ ] Remove Coming soon shells from paths reviewers will tap (or gate Card clearly as post-MVP)

## Accessibility

- [ ] Tap targets ≥ 44pt on primary CTAs
- [ ] Dynamic Type / font scaling smoke test
- [ ] VoiceOver labels on icon-only buttons (back, tabs, Add Money)
- [ ] Color contrast pass on rose / raspberry / ink on backgrounds

## Performance

- [ ] Cold start acceptable on a mid-range iPhone
- [ ] Auth sync + Home first paint without long blank screens
- [ ] Avoid unnecessary full-tree remounts where tab state is lost (Savings already loses local goals on tab switch — fix if Savings ships in MVP; else keep Savings out of submission story)

## Security

- [x] Privy secrets server-side only (`PRIVY_APP_SECRET` on API)
- [x] Mobile only has public Privy app id + API base URL pattern
- [ ] Coinbase secrets server-side only
- [ ] No Bridge secrets in any environment
- [ ] Webhook signature verification + idempotent credits for Coinbase
- [ ] API auth on all money / identity routes (already via `requireAuth` — re-verify after Coinbase routes)
- [ ] Secure storage review (Privy / Expo SecureStore usage)

## Testing (manual — see also [TestingChecklist.md](./TestingChecklist.md))

- [ ] Authentication: new user, returning user, logout, kill app mid-session
- [ ] Add Money: success, cancel, fail, double-submit / idempotency
- [ ] Wallet: address stable across sessions
- [ ] Activity: deposit appears once
- [ ] Growth: deposit, withdraw, APY display (variable disclaimer)
- [ ] Edge cases: airplane mode, expired session, API 5xx

---

# Section 4 — App Store submission

## Branding

- [x] App display name `Olimpia` in `app.json`
- [x] Bundle ID `app.olimpia.mobile`
- [ ] Production app icon (1024×1024, **no alpha**) — current Expo placeholder is blank / unsuitable
- [ ] Splash screen configured in `app.json` + assets
- [ ] Version / build number strategy (`0.0.1` → shippable marketing version)

## App Store assets

- [ ] Screenshots (required device sizes)
- [ ] Preview video (optional)
- [ ] App description (no bank / guaranteed yield claims)
- [ ] Keywords
- [x] Privacy Policy page exists on marketing (`/privacy`)
- [x] Terms of Service page exists on marketing (`/terms`)
- [ ] Privacy Policy **production URL** set in App Store Connect
- [ ] Terms **production URL** set in App Store Connect
- [ ] Support URL / email monitored
- [ ] Age rating + finance questionnaire completed honestly

## Build

- [ ] Add `eas.json` (production + preview profiles) — **missing today**
- [ ] EAS project linked; credentials for `app.olimpia.mobile`
- [ ] Production iOS build
- [ ] Upload to TestFlight
- [ ] Internal TestFlight walkthrough of core journey
- [ ] Resolve App Store Connect / Xcode validation issues
- [ ] Submit for App Review

---

# Section 5 — Post-launch (P2)

These must **not** block launch.

- [ ] Withdrawals / off-ramp (no provider selected)
- [ ] Push notifications
- [ ] Referral program
- [ ] Spending analytics
- [ ] Budgeting
- [ ] Recurring deposits
- [ ] Dark mode
- [ ] Android Play release polish
- [ ] Internationalization
- [ ] Advanced settings
- [ ] Additional fiat providers (Bridge, Dakota, etc. — not V1)
- [ ] Virtual debit card
- [ ] Functional Pia coach
- [ ] Transfer USDC / P2P send-receive if cut from P0 to hit date
- [ ] Savings goals persistence (local-only UI exists; API/goals tables not built)

---

# Section 6 — Known risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Coinbase Headless SDK / API or eligibility changes | Blocks Add Money; App Store has no funding path | Validate credentials Day 1; keep Transfer USDC as backup only if founder accepts; fail closed without Bridge |
| Remaining Bridge code in production path | Wrong provider; compliance / broken deposits | P0 Bridge removal before any production funding |
| App Store rejection (finance / crypto / incomplete metadata) | Delayed launch | Honest copy; Privacy/Terms URLs; no “bank” or guaranteed yield; TestFlight first |
| Wallet edge cases (missing embedded wallet, wrong chain) | User cannot fund or Growth fails | Gate Add Money / Growth until wallet present; device recovery tests |
| Aave integration complexity / liquidity / geography | Growth incomplete for review | Ship Growth only when deposit/withdraw works; else hide Choose Yield and remove fake APY |
| API / provider outages during review | Reviewer cannot complete journey | Staging health checks; clear error copy; support email |
| Fake or hardcoded APY on Home (`4.2`) | Misleading product; review risk | Remove until real Aave rate wired |
| No EAS / blank icon | Cannot submit | Parallel P1 packaging as soon as P0 funding is unblocked or overnight |
| Hand-rolled navigation loses tab state | Savings goals vanish; reviewer confusion | Prefer not demo Savings in review notes until persisted |

---

# Section 7 — Daily execution rules

1. Always work on the highest unchecked P0 task.
2. Never begin a P1 task while a P0 task remains unfinished unless blocked.
3. If blocked, document:
   - blocker
   - attempted solution
   - next action
4. Mark completed tasks immediately.
5. At the end of every day update:

**Completed Today**

-

**Current Blockers**

-

**Next Highest Priority**

-

---

# Section 8 — Definition of MVP complete

The MVP is complete only when a new user can:

- [ ] Download the app
- [ ] Create an account
- [ ] Receive an embedded wallet
- [ ] Buy USDC with Coinbase Headless
- [ ] Receive USDC
- [ ] See their balance
- [ ] View activity
- [ ] Move funds into Growth
- [ ] See Growth balance
- [ ] Successfully complete onboarding without assistance

AND the app has:

- [ ] Passed testing (Section 3 Testing)
- [ ] Production build created
- [ ] Uploaded to TestFlight
- [ ] Submitted to App Store Connect

**Already true in codebase (partial journey):** create account, Privy auth, embedded wallet creation, see balance from API, Add Money UI against mock/Bridge (not Coinbase), logout.

---

# Ranked remaining work (shortest path to App Store)

Exact order for unchecked work. Do not reorder unless blocked.

| Rank | Task | Why this order |
|------|------|----------------|
| 1 | Remove Bridge from API path (provider, webhook, env, schema field) | Production currently hard-wires Bridge; cannot ship Coinbase beside it |
| 2 | Coinbase Headless credentials + backend session create | Unlocks real Add Money |
| 3 | Wire mobile Add Money to Coinbase launch + cancel/fail | Completes purchase UX |
| 4 | Coinbase completion → idempotent ledger credit + balance refresh | Money becomes real in-app |
| 5 | Fix `/me` eligibility + Home refresh after funding | Reviewer sees updated balance |
| 6 | Wire Home activity list to `GET /api/v1/activity` | Journey “activity reflects transaction” |
| 7 | Remove hardcoded Home APY / gate Choose Yield until Aave works | Avoid false yield claims |
| 8 | Aave Growth: backend deposit/withdraw + mobile Choose Yield | Completes earn step of journey |
| 9 | Growth balances + activity types + eligibility.growth | Dashboard truth |
| 10 | Staging deploy + device TestFlight auth/funding smoke | Proves journey off localhost |
| 11 | App icon + splash + `eas.json` + versioning | Packaging parallelizable once funding unblocked |
| 12 | Privacy/Terms/support URLs in App Store Connect + metadata | Submission requirements |
| 13 | P1 polish / a11y / security pass on funded path | Production quality |
| 14 | Full TestFlight walkthrough → submit for review | Launch |

**Explicitly defer if schedule slips (still P2):** Transfer USDC screen, P2P send/receive, persisted Savings goals, Android, off-ramp.

---

# Status log

| Date | Completed Today | Blockers | Next Highest Priority |
|------|-----------------|----------|------------------------|
| 2026-08-07 | Docs reset to Coinbase Headless architecture; this checklist created from codebase audit | Coinbase credentials; Bridge still in API | Rank 1 — Remove Bridge funding path |
| 2026-08-07 | **Removed Bridge** from API (provider, webhook, env, `provider_transaction_id` migration). Mock remains for local; Coinbase stub fails closed until credentials + implementation. | Coinbase credentials not configured; Headless session not implemented | Rank 2 — Coinbase Headless credentials + backend session create |

---

*End of Olimpia MVP Launch Checklist*
