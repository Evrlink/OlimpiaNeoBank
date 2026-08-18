# Olimpia — V1 Architecture

**Status:** Canonical for simplified V1  
**Scope companion:** [product/V1Scope.md](./product/V1Scope.md)  
**Execution:** [MVPLaunchChecklist.md](./MVPLaunchChecklist.md)  
**Last verified against repo:** 2026-08-18 (recovered Aug 14 mobile/API + V1 docs)  
**Decision:** [ADR-015](./architecture/ArchitectureDecisionLog.md) — no Coinbase on-ramp/off-ramp for V1; Coinbase Headless code preserved as post-V1.

This document describes the **simplified V1 product** and what the repository actually implements today. Status labels:

| Label | Meaning |
|-------|---------|
| **Implemented** | Code path exists and is wired end-to-end for the stated behavior |
| **Partially implemented** | UI, API, or ledger pieces exist but the full user flow is incomplete |
| **Planned** | Required for V1; not built yet |
| **Post-V1** | Intentionally deferred; code may already exist and must be preserved |

---

## V1 Product

A self-custodial USDC experience built around **Privy embedded wallets** and **Base**.

Users fund Olimpia by sending **USDC on Base** from Coinbase or another compatible wallet into their Privy embedded wallet. Olimpia shows balance and transaction activity, and lets users move USDC into **Grow** to earn yield, then withdraw from Grow back to the wallet.

V1 does **not** require fiat on-ramp or off-ramp.

---

## V1 Flow

1. User signs in (Privy email OTP)
2. Privy embedded wallet is created or restored
3. User receives USDC on Base (external transfer into the Privy address)
4. Olimpia displays wallet balance
5. User can move USDC into Grow
6. User earns yield
7. Olimpia displays earnings and transaction activity
8. User can withdraw from Grow back to the Privy wallet

```text
Privy embedded wallet
  → Receive USDC on Base
  → See USDC balance (intended: Privy Get Balance)
  → See real wallet transaction activity (intended: Privy Get Transactions)
  → Move USDC into Grow (intended: Privy Earn / Aave vault)
  → Track earnings
  → Withdraw from Grow back to Privy wallet
```

**Intended infrastructure for balance / activity / Grow:** Privy server APIs already present in `@privy-io/node` (`balance.get`, `transactions.get`, `earn().ethereum().deposit|withdraw`). These are **not wired** in Olimpia app code yet. Live smoke validation was blocked (invalid local Privy credentials; local DB wallets missing `privy_wallet_id`). Do not treat Privy-native balance, transactions, or Grow as implemented.

---

## Explicitly out of scope for V1

These remain **planned post-V1** features. Existing Coinbase Headless work in the repo must be **preserved** (do not delete) for a later release (e.g. V1.1). Prefer feature-flag / inactive route over removal.

| Out of V1 | Notes |
|-----------|--------|
| Coinbase Headless Onramp | Implemented in API + mobile Add Money; not required for V1 launch |
| Apple Pay funding | Part of Coinbase Headless checkout; post-V1 |
| Fiat USD → USDC conversion | Post-V1 |
| Fiat offramp / bank withdrawal | Never selected for V1; still deferred |
| Card product | Placeholder / eligibility gated; post-V1 |

---

## Confirmed infrastructure (V1)

| Layer | Choice |
|-------|--------|
| Auth + wallet | Privy embedded wallet |
| Network | Base |
| Asset | USDC on Base |
| Funding (V1) | Inbound USDC transfer to Privy address |
| Yield | Grow via Privy Earn / Aave vault (**planned**; see status below) |
| Backend | Node.js / Express + PostgreSQL |
| Mobile | React Native / Expo — iOS first |
| Marketing | Vercel + GA4 |

**Not active V1 providers:** Bridge.xyz, Dakota.

---

## Implementation status (verified in repo)

### 1. Privy embedded wallet

| Status | Evidence |
|--------|----------|
| **Partially implemented** | Mobile: Privy email OTP, `useEmbeddedEthereumWallet().create()` when missing, auth sync stores wallet on `wallets` (chain `base`). Backend: `POST /api/v1/auth/sync`, `GET /api/v1/me`. |
| Still needed | Device / TestFlight verification of persistence and recovery; production Privy app config for iOS bundle ID / scheme. |

### 2. Receive USDC on Base

| Status | Evidence |
|--------|----------|
| **Partially implemented** | `ReceiveMoneyScreen` shows authenticated Privy address, QR, Copy, Base + USDC warning, and Coinbase send steps. Home / You’re In CTA is **Receive USDC**. `AddMoneyScreen` is **not mounted**. |
| Still needed | Detect inbound Base USDC, confirm once, refresh Home. Device proof with a real/test transfer. |

### 3. USDC balance

| Status | Evidence |
|--------|----------|
| **Partially implemented** | `privyBalance.ts` calls Privy `wallets().balance.get` (`asset=usdc`, `chain=base`) and maps it into Home `/me` balance. |
| Important limitation | Not proven with live Privy credentials on this machine. Inbound transfers are not yet confirmed in-app. |
| Planned for V1 | Validate wallet IDs + credentials; refresh Home after receipt / pull-to-refresh. |
| Still needed | Valid Privy credentials; end-to-end proof that a Base USDC send updates Home. |

### 4. Transaction activity

| Status | Evidence |
|--------|----------|
| **Partially implemented** (app-deposit ledger only — **not** Privy Get Transactions) | `GET /api/v1/activity` reads local `transactions` rows from funding-deposit finalization. |
| What it reflects today | **App-created deposits** (Coinbase onramp / mock), **not** arbitrary Base wallet transfers. |
| Mobile | Home “Recent activity” is a **hardcoded empty state**; it does **not** call the activity API or Privy. |
| Planned for V1 | Wire **Privy Get Transactions** (`chain=base`, `asset=usdc`) for real inbound/outbound wallet activity. |
| Still needed | Detect inbound Base USDC; map wallet transfers into Home Recent Activity; include Grow movements when Grow ships. |

### 5. Grow / yield

| Status | Evidence |
|--------|----------|
| **Partially implemented** (entry points + schema only) | Navigation to Choose Yield; `ChooseYieldScreen` is an explicit Coming soon placeholder. Balance column `growth_allocated_usd` exists; eligibility `growth` is `false`. Home may show hardcoded `4.2` APY when “earning” — **not** a live rate. |
| Does **not** exist | Privy Earn deposit/withdraw wiring, vault_id config, position/APY reads, custom Aave adapter. |
| Planned for V1 | Prefer **Privy Earn** with an Aave-backed vault (`vault_id` via Privy enablement) — **not built**. |
| Still needed | Privy Aave vault enablement + `vault_id`; user-wallet authorization for Earn deposit/withdraw; position + earnings + estimated APY UI; enable eligibility when ready. |

**Terminology:** Product docs use **Grow**. Mobile UI currently says **Growth** / **Choose Yield**. Protocol names (Aave) must stay out of primary UI.

### 6. Withdraw from Grow → wallet

| Status | Evidence |
|--------|----------|
| **Planned** | No API or mobile flow. Intended via Privy Earn withdraw once Grow deposit works. |

### 7. Coinbase Headless Onramp (**post-V1**, preserved)

| Status | Evidence |
|--------|----------|
| **Implemented** in repo (sandbox E2E verified historically) — **post-V1** | API: CDP JWT, create order, verification, webhooks (`/webhooks/coinbase`), ledger credit on success. Mobile: Add Money → ToS / verification → Apple Pay WebView. Spec: [integrations/CoinbaseHeadlessIntegration.md](./integrations/CoinbaseHeadlessIntegration.md). |
| V1 policy | **Not a launch dependency.** Do **not** delete. Not mounted in the V1 tab shell. `eligibility.onRamp` is `false` / `post_v1`. Production API must **not** require Coinbase credentials. |
| Blocks simpler V1? | **No.** Empty Home CTA is **Receive USDC**. |

---

## Engineering priority order (V1)

1. Set up and validate Privy (credentials, app config, wallet IDs)  
2. Privy embedded wallet working reliably  
3. Receive USDC on Base  
4. USDC balance via Privy  
5. Real wallet transaction activity via Privy  
6. Grow / yield  
7. Withdraw from Grow back to wallet  
8. Verify the full flow with real Base USDC  

App Store packaging (icons, EAS, Privacy/Terms URLs) remains required for submission but is parallelizable once the money path above works.

---

## Related documents

| Doc | Role |
|-----|------|
| [product/V1Scope.md](./product/V1Scope.md) | Launch scope |
| [MVPLaunchChecklist.md](./MVPLaunchChecklist.md) | Execution checklist |
| [architecture/Architecture.md](./architecture/Architecture.md) | Broader system design (updated for simplified V1) |
| [integrations/CoinbaseHeadlessIntegration.md](./integrations/CoinbaseHeadlessIntegration.md) | Post-V1 Coinbase implementation reference |
| [architecture/ArchitectureDecisionLog.md](./architecture/ArchitectureDecisionLog.md) | ADRs (see ADR-015) |

---

*End of V1 Architecture*
