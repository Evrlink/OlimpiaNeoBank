# Olimpia MVP Launch Checklist

**Status:** Primary execution document  
**Architecture:** [V1Architecture.md](./V1Architecture.md) · [Architecture.md](./architecture/Architecture.md) · [ADR-015](./architecture/ArchitectureDecisionLog.md)  
**Scope:** [V1Scope.md](./product/V1Scope.md) · [PRD.md](./product/PRD.md)  
**Last status review:** 2026-08-12 (V1 simplified: Receive USDC + Privy balance/activity/Grow; Coinbase on-ramp/off-ramp post-V1)

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

Funding (V1)

- Receive USDC on Base (external transfer into Privy wallet)

Grow

- Aave on Base (intended yield destination)

Backend

- Node.js / Express
- PostgreSQL / Supabase

Marketing

- Vercel

Analytics

- Google Analytics 4

```text
Privy embedded wallet
  → Receive USDC on Base
  → USDC balance via Privy
  → Real wallet transaction activity via Privy
  → Grow / yield → withdraw back to Privy wallet
```

**Not V1 launch blockers:** Coinbase Headless Onramp, Apple Pay, fiat funding, Offramp, virtual card, functional Pia.

**Preserved for post-V1:** Coinbase Headless implementation (API + mobile Add Money). Do not delete; gate rather than remove. Spec: [integrations/CoinbaseHeadlessIntegration.md](./integrations/CoinbaseHeadlessIntegration.md).

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
Receives USDC on Base (from Coinbase or compatible wallet)
  ↓
Balance updates
  ↓
Transaction activity reflects the transfer
  ↓
Moves USDC into Grow
  ↓
Begins earning yield
  ↓
Withdraws from Grow back to wallet
  ↓
Understands what happened through a simple UI
```

**Every remaining engineering task must support this journey.**

---

# Section 2 — P0 Critical path

These tasks block App Store readiness. Work top to bottom. Checkboxes reflect **current repo status** (checked = already satisfied in code / product surfaces today).

## Set up and validate Privy

- [x] Privy email OTP sign-up / sign-in wired (`AuthScreen`, `useEmailAuthFlow`)
- [x] Backend auth sync (`POST /api/v1/auth/sync`) creates / links user
- [x] Session restoration on cold start (`useSessionRestore`, `GET /api/v1/me`)
- [ ] Valid Privy app credentials for the environment (local smoke previously saw `401 Invalid app ID or app secret`)
- [ ] Production Privy app config matches iOS bundle ID `app.olimpia.mobile` and scheme `olimpia`
- [ ] Persist non-null `privy_wallet_id` on auth sync (local DB currently can store address with null wallet id)
- [ ] Smoke-test Privy `balance.get` + `transactions.get` against a real embedded wallet (not done — blocked on creds / wallet id)

## Wallet

- [x] Embedded Ethereum wallet created on login when missing (`useEmbeddedEthereumWallet().create()`)
- [x] Wallet address stored via auth sync (`wallets` table, chain `base`)
- [x] Wallet never shown on Home / Profile (only needed on Receive USDC)
- [x] Logout via Privy (`ProfileScreen`)
- [ ] Wallet persistence / recovery validated on fresh install + reinstall (device)
- [ ] Confirm Privy wallet is always available before Receive / Grow
- [ ] End-to-end auth verified on **TestFlight / device** against staging or production API

## Receive USDC on Base

- [ ] Receive screen shows Privy address, QR, Copy, Base + USDC warning (today: **Coming soon stub**)
- [ ] Beginner instructions for sending from Coinbase / compatible wallets
- [ ] Unsupported asset / network messaging
- [ ] Real Base USDC receipt verified end-to-end (after balance/activity via Privy)

## USDC balance via Privy

- [x] Home can show a balance number today from **Olimpia ledger** (`user_balances`) — **not** Privy Get Balance
- [ ] Wire **Privy Get Balance** (`asset=usdc`, `chain=base`) — **planned; not implemented**
- [ ] Balance updates after inbound Base USDC
- [ ] Empty Home CTA / copy reflects Receive USDC (today still pushes bank / Add Money)
- [ ] Pull-to-refresh / re-fetch balance after receipt

## Real wallet transaction activity via Privy

- [x] Legacy `GET /api/v1/activity` exists for **app-created deposit** rows only — **not** Privy Get Transactions
- [ ] Wire **Privy Get Transactions** (`chain=base`, `asset=usdc`) — **planned; not implemented**
- [ ] Mobile Home “Recent activity” loads real wallet transfers (today: **hardcoded empty state**)
- [ ] Activity shows Grow deposits / withdrawals when Grow ships

## Grow (yield)

- [x] Home / Choose Yield **entry points** exist in navigation
- [ ] Choose Yield is functional (today: **Coming soon placeholder**)
- [ ] Privy Earn / Aave vault enablement + `vault_id` — **does not exist in product**
- [ ] Deposit USDC into Grow via Privy Earn (explicit user authorization) — **not implemented**
- [ ] Withdraw from Grow back to Privy wallet via Privy Earn — **not implemented**
- [ ] Display estimated APY from real vault details (Home currently shows hardcoded `4.2` — must not ship as real)
- [ ] Display Grow allocated / earnings from Privy position (or equivalent)
- [ ] Enable `eligibility.growth` when ready

## Coinbase Headless (post-V1 — preserve only)

Do **not** prioritize for V1 launch. Keep code intact.

- [x] Sandbox E2E path exists (create order, JWT, WebView, webhook, ledger credit)
- [ ] Gate Add Money / `eligibility.onRamp` as post-V1 so reviewers are not forced through fiat onramp
- [ ] Production Coinbase credentials — **defer to V1.1+**

## Dashboard / Home

- [x] Funded Home layout with Available / earning sections (UI)
- [x] Loading / error handling for auth sync
- [ ] Remove or gate fake APY until Grow is live
- [ ] Correct empty / loading / error states for activity once wired
- [ ] Receive as primary empty-state funding path

## Staging / production API readiness

- [ ] Staging / production API deployed with HTTPS
- [ ] PostgreSQL migrations applied in staging / production
- [ ] Mobile pointed at staging via `EXPO_PUBLIC_API_BASE_URL`
- [ ] Secrets: Privy production keys; Base RPC / monitor credentials as needed
- [x] Mock funding forbidden in production builds (Coinbase path still present for post-V1)

---

# Section 3 — P1 Required before App Store submission

These do not change core business logic but are required for a production-quality submission. **Do not start while blocked P0 items remain**, unless a P0 is waiting on external credentials and the work is parallelizable (e.g. app icon).

## UI polish

- [x] Brand colors / typography tokens present on core screens
- [ ] Consistent loading states across Home, Receive, Grow, Activity
- [ ] Consistent empty states (especially activity once wired)
- [ ] Consistent error states (network, insufficient funds, transfer pending)
- [ ] Offline / no-network friendly messaging
- [ ] Motion: keep calm; finish intentional transitions on auth → Home → Receive
- [ ] Typography + spacing pass against brand tokens (no one-off sizes)
- [ ] Remove or clearly gate Coming soon shells reviewers will tap (Card, Add Money if shown)

## Accessibility

- [ ] Tap targets ≥ 44pt on primary CTAs
- [ ] Dynamic Type / font scaling smoke test
- [ ] VoiceOver labels on icon-only buttons (back, tabs, Receive)
- [ ] Color contrast pass on rose / raspberry / ink on backgrounds

## Performance

- [ ] Cold start acceptable on a mid-range iPhone
- [ ] Auth sync + Home first paint without long blank screens
- [ ] Avoid unnecessary full-tree remounts where tab state is lost (Savings already loses local goals on tab switch — fix if Savings ships in MVP; else keep Savings out of submission story)

## Security

- [x] Privy secrets server-side only (`PRIVY_APP_SECRET` on API)
- [x] Mobile only has public Privy app id + API base URL pattern
- [ ] No Bridge secrets in any environment
- [ ] API auth on all money / identity routes (re-verify after Receive / Grow routes)
- [ ] Secure storage review (Privy / Expo SecureStore usage)
- [ ] Chain monitor / webhook authenticity if used for inbound USDC

## Testing (manual — see also [TestingChecklist.md](./TestingChecklist.md))

- [ ] Authentication: new user, returning user, logout, kill app mid-session
- [ ] Receive USDC: success, wrong network/asset messaging, double-credit prevention
- [ ] Wallet: address stable across sessions
- [ ] Activity: inbound transfer appears once
- [ ] Grow: deposit, withdraw, APY display (variable disclaimer)
- [ ] Edge cases: airplane mode, expired session, API 5xx
- [ ] Full journey with **real Base USDC** transfers

## Apple Testing Milestones

- [ ] Development build installed on iPhone
- [ ] Authentication tested
- [ ] Wallet creation tested
- [ ] Receive USDC tested (real Base transfer)
- [ ] Balance updates tested
- [ ] Activity updates tested
- [ ] Grow deposit / withdraw tested
- [ ] TestFlight build uploaded
- [ ] TestFlight smoke test passed
- [ ] App Store submission completed

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

# Section 5 — Post-launch (P2 / V1.1+)

These must **not** block launch.

- [ ] Coinbase Headless Onramp / Apple Pay Add Money (code preserved; production credentials + webhook URL)
- [ ] Fiat USD → USDC conversion UX polish
- [ ] Withdrawals / offramp (no provider selected)
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
- [ ] P2P send/receive between Olimpia users if cut from P0
- [ ] Savings goals persistence (local-only UI exists; API/goals tables not built)

---

# Section 6 — Known risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| No Base inbound monitor | Users send USDC but balance/activity never update | P0: monitor + idempotent credit before inviting real transfers |
| Activity API only shows app deposits | Wallet transfers invisible | Ingest chain/wallet events; wire Home to API |
| Add Money / bank CTA still primary | Reviewers / users chase fiat path | Gate onramp; make Receive the empty-state path |
| Fake or hardcoded APY on Home (`4.2`) | Misleading product; review risk | Remove until real Grow rate wired |
| Aave / Grow complexity | Yield incomplete for review | Ship Grow only when deposit/withdraw works; else hide Choose Yield |
| App Store rejection (finance / crypto / incomplete metadata) | Delayed launch | Honest copy; Privacy/Terms URLs; no “bank” or guaranteed yield; TestFlight first |
| Wallet edge cases (missing embedded wallet, wrong chain) | User cannot receive or Grow | Gate Receive / Grow until wallet present; device recovery tests |
| API outages during review | Reviewer cannot complete journey | Staging health checks; clear error copy; support email |
| No EAS / blank icon | Cannot submit | Parallel P1 packaging once money path unblocked |
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
- [ ] Receive USDC on Base into that wallet
- [ ] See their balance
- [ ] View transaction activity for the transfer
- [ ] Move funds into Grow
- [ ] See Grow balance / earnings
- [ ] Withdraw from Grow back to wallet
- [ ] Successfully complete onboarding without assistance

AND the app has:

- [ ] Passed testing (Section 3 Testing) including **real Base USDC** transfers
- [ ] Production build created
- [ ] Uploaded to TestFlight
- [ ] Submitted to App Store Connect

**Already true in codebase (partial journey):** create account, Privy auth, embedded wallet creation, see ledger balance from API, logout. Receive USDC UI, chain confirmation, wallet activity UI, and Grow are not complete.

---

# Ranked remaining work (shortest path to App Store)

Exact order for unchecked V1 work. Do not reorder unless blocked.

| Rank | Task | Why this order |
|------|------|----------------|
| 1 | Set up and validate Privy (credentials, config, `privy_wallet_id`) | Unlocks all Privy APIs |
| 2 | Privy embedded wallet reliability (device / recovery) | Foundation for receive + Grow |
| 3 | Receive USDC UI (address, QR, Base warning, instructions) | Users can send funds |
| 4 | USDC balance via Privy Get Balance | Balance truth after transfer |
| 5 | Real wallet transaction activity via Privy Get Transactions | Journey “activity reflects transfer” |
| 6 | Grow / yield via Privy Earn (after vault enablement) | Completes earn step |
| 7 | Withdraw from Grow back to Privy wallet | Completes round-trip |
| 8 | End-to-end verify with real Base USDC transfers | Proves simplified V1 |
| 9 | Gate / de-emphasize Coinbase Add Money as post-V1 | Avoid fiat dependency in review |
| 10 | Staging deploy + TestFlight auth/receive smoke | Proves journey off localhost |
| 11 | App icon + splash + `eas.json` + versioning | Packaging |
| 12 | Privacy/Terms/support URLs in App Store Connect + metadata | Submission requirements |
| 13 | P1 polish / a11y / security pass on funded path | Production quality |
| 14 | Full TestFlight walkthrough → submit for review | Launch |

**Explicitly defer (P2 / V1.1+):** Coinbase Headless production, Apple Pay, fiat onramp/offramp, P2P send/receive, persisted Savings goals, Android.

---

# Status log

| Date | Completed Today | Blockers | Next Highest Priority |
|------|-----------------|----------|------------------------|
| 2026-08-07 | Docs reset to Coinbase Headless architecture; this checklist created from codebase audit | Coinbase credentials; Bridge still in API | Rank 1 — Remove Bridge funding path |
| 2026-08-07 | **Removed Bridge** from API (provider, webhook, env, `provider_transaction_id` migration). Mock remains for local; Coinbase stub fails closed until credentials + implementation. | Coinbase credentials not configured; Headless session not implemented | Rank 2 — Coinbase Headless credentials + backend session create |
| 2026-08-07 | **Task 2:** Coinbase Headless E2E implemented (CDP JWT + create order + Verification APIs + Apple Pay WebView + `onramp.transaction.*` webhooks). Ledger still credits only on success / completed. | CDP credentials, US phone verification, public HTTPS webhook URL, production Onramp approval | Rank 3 — sandbox E2E with real Coinbase credentials; then Home activity |
| 2026-08-07 | **Sandbox E2E verified:** create order, JWT, WebView checkout, sandbox purchase, webhook, single ledger credit, balance refresh, activity row, duplicate webhook ignored. | Production credentials; production webhook URL; Apple device testing | Rank 3 — production Coinbase credentials + HTTPS webhook URL |
| 2026-08-12 | **V1 scope simplified:** fiat on-ramp / Apple Pay / offramp no longer required for launch. Docs updated; Coinbase code preserved as post-V1. | Receive USDC + Base monitor; activity wiring; Grow | Rank 1 — Privy wallet reliability / Receive USDC |
| 2026-08-12 | Docs aligned to Privy-native V1 priorities (validate Privy → wallet → Receive → Privy balance/activity → Grow). Smoke test blocked: invalid local Privy creds; null `privy_wallet_id`. | Valid Privy credentials + wallet id persistence | Rank 1 — Set up and validate Privy |

---

*End of Olimpia MVP Launch Checklist*
