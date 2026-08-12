# Olimpia — V1 Architecture

**Status:** Canonical for simplified V1  
**Scope companion:** [product/V1Scope.md](./product/V1Scope.md)  
**Execution:** [MVPLaunchChecklist.md](./MVPLaunchChecklist.md)  
**Last verified against repo:** 2026-08-12

This document describes the **simplified V1 product** and what the repository actually implements today. Status labels:

| Label | Meaning |
|-------|---------|
| **Implemented** | Code path exists and is wired end-to-end for the stated behavior |
| **Partially implemented** | UI, API, or ledger pieces exist but the full user flow is incomplete |
| **Planned** | Required for V1; not built yet |

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
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base (external transfer)
  → Balance + transaction activity
  → Grow (yield) → withdraw back to wallet
```

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
| Yield | Grow via Aave on Base (intended; see status below) |
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
| **Planned** (UI stub only) | `ReceiveMoneyScreen` is a “Coming soon” placeholder — no address, QR, Copy, or Base network warning. |
| Still needed | Show authenticated Privy address + QR + Base/USDC warning; beginner instructions for sending from Coinbase / compatible wallets; backend confirmation of inbound transfers (monitor / indexer / RPC — **not present** in `apps/api`). |

There is **no** Base deposit monitor, webhook, or chain-indexer module in the API today.

### 3. USDC balance

| Status | Evidence |
|--------|----------|
| **Partially implemented** | Backend ledger buckets in `user_balances` (`available_usd`, `goals_allocated_usd`, `growth_allocated_usd`) via `GET /api/v1/balance` and auth sync / `/me`. Home reads that balance. |
| Important limitation | Balance is a **backend ledger**, not a live on-chain USDC read of the Privy wallet. Credits today come from completed **funding deposits** (`creditAvailableForCompletedDeposit` on Coinbase/mock onramp success). Inbound Base transfers do **not** update the ledger yet. |
| Still needed | Detect inbound USDC, credit ledger (or switch display to verified wallet balance), refresh Home after receipt. |

### 4. Transaction activity

| Status | Evidence |
|--------|----------|
| **Partially implemented** (API only) | `GET /api/v1/activity` and `GET /api/v1/activity/:id` read the `transactions` table for the authenticated user. |
| What it reflects today | Rows created when a **deposit** is finalized (type `deposit`, status `completed`) via the funding ledger credit path — i.e. **app-created deposits** (Coinbase onramp / local mock), **not** arbitrary Base wallet transfers. |
| Mobile | Home “Recent activity” is a **hardcoded empty state**; it does **not** call the activity API. |
| Still needed for V1 wallet activity | Ingest inbound/outbound USDC wallet events into `transactions` (or equivalent); wire Home (and detail if needed) to `GET /api/v1/activity`; include Grow deposit/withdraw rows when Grow ships. |

### 5. Grow / yield

| Status | Evidence |
|--------|----------|
| **Partially implemented** (entry points + schema only) | Navigation to Choose Yield; `ChooseYieldScreen` is an explicit Coming soon placeholder. Balance column `growth_allocated_usd` exists; eligibility `growth` is `false` (`not_available_phase_2`). Home may show hardcoded `4.2` APY when “earning” — **not** a live rate. |
| Does **not** exist | Aave adapter, deposit/withdraw routes, position sync, real APY source, writes to `growth_allocated_usd`. |
| Still needed | Backend deposit USDC into Grow (Aave on Base) with explicit user authorization; withdraw Grow → Available / wallet; display real allocated balance + estimated variable APY; Grow activity rows; enable eligibility when ready. |

**Terminology:** Product docs use **Grow**. Mobile UI currently says **Growth** / **Choose Yield**. Protocol names (Aave) must stay out of primary UI.

### 6. Withdraw from Grow → wallet

| Status | Evidence |
|--------|----------|
| **Planned** | No API or mobile flow. Blocked on Grow backend. |

### 7. Coinbase Headless Onramp (preserved, post-V1)

| Status | Evidence |
|--------|----------|
| **Implemented** (sandbox E2E verified historically) | API: CDP JWT, create order, verification, webhooks (`/webhooks/coinbase`), ledger credit on success. Mobile: Add Money → ToS / verification → Apple Pay WebView. Spec: [integrations/CoinbaseHeadlessIntegration.md](./integrations/CoinbaseHeadlessIntegration.md). |
| V1 policy | **Not required** for launch. Keep code; treat as post-V1 / V1.1. Prefer gating Add Money / `eligibility.onRamp` rather than deleting modules. |
| Blocks simpler V1? | **No.** Funding provider is selected via `FUNDING_PROVIDER` (`coinbase` vs `mock`). Missing pieces for simplified V1 are Receive + chain monitor + activity wiring + Grow — not Coinbase itself. Empty Home still CTAs “Add money from your bank,” which is product copy debt for the new scope. |

---

## Engineering priority order (V1)

1. Privy embedded wallet working reliably  
2. Receive USDC on Base (address / QR / warnings)  
3. Detect and display USDC balance (ledger or verified wallet balance after inbound transfer)  
4. Display actual wallet transaction activity  
5. Grow / yield flow (deposit)  
6. Withdraw from Grow back to wallet  
7. Verify the complete flow with real Base USDC transfers  

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
