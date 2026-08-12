# Olimpia — V1 Architecture

**Version:** 4.0  
**Status:** Canonical — simplified V1  
**Scope:** Architecture we are actually shipping for App Store submission  
**Verified status companion:** [V1Architecture.md](../V1Architecture.md)  
**Product source:** [PRD.md](../product/PRD.md)  
**Launch scope:** [V1Scope.md](../product/V1Scope.md)  
**Implementation order:** [MVPLaunchChecklist.md](../MVPLaunchChecklist.md) · [BuildPlan.md](../build/BuildPlan.md)  
**Decision authority:** [ArchitectureDecisionLog.md](./ArchitectureDecisionLog.md) (ADR-015)

---

## Current MVP Architecture

**Privy + Base + USDC + Grow is the active V1 architecture.** Fiat on-ramp / off-ramp are **not** required for V1.

```text
User
  → Privy authentication
  → Privy embedded wallet
  → Receive USDC on Base (external transfer)
  → Olimpia balance / transaction activity (backend ledger)
  → optional Grow (Aave on Base) → withdraw back to wallet
```

| Layer | Active V1 choice |
|-------|------------------|
| Mobile | React Native / Expo — **iOS first** |
| Auth + wallet | Privy embedded wallet |
| Chain / asset | Base / USDC |
| Funding (V1) | Receive USDC (inbound on Base) |
| Backend | Node.js / Express + PostgreSQL |
| Grow | Aave on Base (intended) |
| Marketing | Vercel site + GA4 |

**Post-V1 (preserve code):** Coinbase Headless Onramp, Apple Pay funding, fiat offramp, virtual card.  
**Not active V1:** Bridge.xyz, Dakota, multi-provider bank-transfer matrices. See [ADR-015](./ArchitectureDecisionLog.md).

For what is **implemented vs planned** in the repo today, prefer [V1Architecture.md](../V1Architecture.md).

---

## 1. Architecture principles

Olimpia is a provider-orchestration product, not a bank, card network, wallet platform, blockchain, or yield protocol.

- The React Native / Expo app presents one calm, dollar-first account experience.
- **iOS is the App Store submission priority.**
- Privy provides authentication and the embedded wallet.
- Base is the only supported V1 blockchain network.
- USDC on Base is the only V1 asset.
- **V1 funding** is inbound USDC to the Privy embedded wallet (from Coinbase or another compatible wallet). Fiat on-ramp is **post-V1**.
- The backend owns provider integrations, state normalization, ledger updates, monitoring, and reconciliation.
- Mobile screens remain provider-agnostic. Protocol names stay out of primary UI.
- The backend ledger is authoritative for displayed balances and transaction status.
- Aave on Base is the Grow / yield destination. Funding never moves automatically into Aave.

The only V1 screen that exposes an address, asset, or network is **Receive USDC**, because users need those details to transfer safely.

---

## 2. Canonical money path

```text
User
  → Privy authentication
  → Privy embedded wallet
  → Receive USDC on Base
  → Olimpia balance / transaction activity (backend ledger)
  → optional Grow (Aave on Base) → withdraw back to wallet
```

This is the active V1 funding architecture. Coinbase Headless Onramp remains in the codebase for a later release but is **not** a V1 launch dependency. Bridge.xyz and Dakota are **not** part of the current build. See [ADR-015](./ArchitectureDecisionLog.md).

---

## 3. System surfaces

| Surface | Responsibility |
|---------|----------------|
| React Native / Expo app (`apps/mobile`) | Onboarding, Home, Receive USDC, transaction activity, Grow, profile — iOS first |
| Node.js / Express API (`apps/api`) | Auth verification, Base deposit monitoring (planned), ledger, statuses, Grow adapter (planned), post-V1 Coinbase webhooks preserved |
| PostgreSQL / Supabase | Users, wallets, deposits, transactions, balances, goals, Grow allocations, idempotency records |
| Marketing website (`apps/marketing` on Vercel) | Acquisition, education, legal/support, waitlist — GA4 already installed |

### Core request path

```text
Mobile app
    |
    | Privy session token
    v
Olimpia backend
    |-- Privy: verify identity and resolve embedded wallet
    |-- Blockchain deposit monitor: inbound USDC on Base (required for V1 Receive)
    |-- Ledger service: authoritative balances and transaction activity
    |-- Aave adapter: Grow deposits/withdrawals (required for V1 Grow)
    |-- Coinbase Headless Onramp: preserved post-V1 path (do not delete)
    `-- Notification service (optional for V1)
```

Base events enter the backend, are validated and deduplicated, then update the ledger. Mobile never interprets raw chain/provider statuses or credits deposits itself.

---

## 4. Confirmed V1 infrastructure

| Capability | Decision |
|------------|----------|
| Authentication | Privy |
| Embedded wallet | Privy wallet associated with each Olimpia user |
| Network | Base only |
| Asset | Supported USDC contract on Base only |
| Funding (V1) | Inbound USDC transfer from Coinbase or another compatible Base wallet |
| Fiat Add Money | **Post-V1** — Coinbase Headless Onramp preserved in repo |
| Ledger | Olimpia backend / database is authoritative |
| Grow / yield | Aave on Base |
| Fiat withdrawal / offramp | **Not in V1** — deferred until a provider is selected |
| Virtual card | **Post-V1** |

---

## 5. Canonical funding architecture (V1)

```text
                    Receive USDC
                 External wallet on Base
                          |
                User's Privy Wallet
                          |
                USDC on Base (ledger credit)
                          |
                Grow / Yield (optional)
                          |
                    Aave on Base
                          |
              Withdraw Grow → wallet
```

**Post-V1 (preserved):** Coinbase Headless Onramp / Apple Pay Add Money may later share the same end state (USDC on Base → ledger credit).

V1 funding must produce:

1. Supported USDC associated with the authenticated user’s Privy wallet on Base.
2. Exactly one idempotent deposit credit in the Olimpia ledger (or equivalent verified balance update).
3. Balance and transaction activity refreshed from the backend.
4. Funds remain Available until the user separately authorizes movement to Grow.

---

## 6. Backend funding boundaries

Keep thin abstractions. Do **not** invent multi-provider bank / onramp adapter layers for V1.

### BlockchainDepositMonitor (required for V1)

- Monitor Base for inbound transfers of the supported USDC contract to the user’s Privy address.
- Validate chain, recipient, token contract, amount, and transaction hash.
- Prevent duplicate processing.
- Wait for the configured confirmation threshold.
- Send validated deposits to LedgerService.

**Status in repo today:** not implemented — see [V1Architecture.md](../V1Architecture.md).

### CoinbaseOnramp (post-V1 — preserve)

- Implemented Headless Onramp session, verification, Apple Pay WebView, webhooks, ledger credit.
- Destination: user’s Privy wallet address, Base, USDC.
- Keep Coinbase-specific payloads out of mobile APIs.
- Gate via eligibility / inactive route for V1 launch; do not delete modules.
- Spec: [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md).

### FundingService

- Expose normalized funding model to mobile.
- For V1, prioritize Receive USDC; keep Add Money behind post-V1 eligibility when gating.

### LedgerService

- Remain authoritative for customer balances and transaction activity.
- Use idempotent provider / event references.
- Prevent duplicate credits from retried webhooks or blockchain events.
- Apply reversals as explicit auditable transactions.

**Not in active V1 architecture:** Bridge transfer APIs, Dakota ACH adapters, multi-provider bank-transfer matrices.

---

## 7. Funding flow A — Receive USDC (V1 required)

```text
User selects Receive USDC
        |
App displays authenticated user's Privy address
        |
App displays QR, Copy Address, Base network, and warnings
        |
User sends supported USDC from Coinbase or another Base wallet
        |
Backend detects and validates transfer
        |
Transfer remains processing until confirmation policy is met
        |
Ledger is credited once
        |
Balance and inbound transaction activity update
```

Validation requirements:

- Base chain ID
- Authenticated user’s destination address
- Supported USDC token contract
- Amount and transaction hash
- Duplicate-event protection
- Required confirmation threshold
- Reorg / reversal policy

Unsupported tokens are not credited merely because they arrive at the address.

Required warning:

> Only send supported USDC using the Base network. Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

---

## 8. Funding flow B — Coinbase Headless Onramp (post-V1, preserve)

Implemented in repo; **not required for V1 launch**. Keep modules; gate Add Money / `eligibility.onRamp` rather than deleting. Full reference: [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md).

```text
User selects Add Money
        |
User enters amount
        |
Backend creates Coinbase Headless Onramp session
  (destination = user's Privy wallet, Base, USDC)
        |
App launches Coinbase-supported checkout / payment experience
        |
Coinbase collects payment + any KYC it requires
        |
Coinbase delivers USDC to user's Privy wallet on Base
        |
Backend validates completion (webhook and/or Base monitor)
        |
Ledger is credited once
        |
App refreshes deposit status, balance, and activity
```

Constraints:

- Payment methods are whatever Coinbase Headless supports (typically ACH, debit card, Apple Pay).
- Coinbase controls checkout, quote, fees, and KYC.
- Do not use a hidden background WebView or imply Olimpia can bypass Coinbase checkout.
- Mobile labels remain **Add Money** — not “Coinbase”.

---

## 9. Normalized funding states

| Status | Meaning |
|--------|---------|
| `pending` | Request created; provider / event processing has not started |
| `processing` | Provider or Base confirmation is in progress |
| `completed` | Validation / finality complete and ledger credited |
| `failed` | Terminal failure; no credit |
| `cancelled` | User / provider cancelled before completion |
| `reversed` | A previously completed funding entry was returned or reversed |

The UI may combine `pending` and `processing` into one calm in-progress state. Provider-specific statuses never reach mobile unchanged.

---

## 10. Funding data model — implementation review

No migration is authorized by this document alone. The deposit model must support:

- `funding_method`: `coinbase_onramp`, `external_usdc`
- `provider`: `coinbase`, `base_blockchain`
- `provider_transaction_id` (generic; replace Bridge-specific `bridge_intent_id` during funding cleanup)
- `blockchain_transaction_hash`
- `destination_wallet_address`
- `chain_id`
- `asset`
- `gross_amount`
- `provider_fee`
- `olimpia_fee` (if any; not assumed for Coinbase path)
- `net_amount`
- `status`
- `failure_code`
- `failure_message`
- `confirmed_at`
- `credited_at`

Every provider or blockchain reference used for crediting must have an idempotency constraint or equivalent processing guard.

**Legacy note:** Bridge funding path has been removed from the active API. Coinbase Headless remains implemented for post-V1. See [MVPLaunchChecklist.md](../MVPLaunchChecklist.md).

---

## 11. Authentication and wallet

1. User authenticates through Privy.
2. Privy creates or restores the embedded wallet.
3. Mobile calls the backend auth-sync flow.
4. Backend verifies the Privy token, stores the wallet association, and initializes the ledger if needed.
5. Returning sessions restore to Home.

Privy secrets remain server-side. Seed phrases and private keys are never stored by Olimpia. Wallet addresses are treated as public identifiers but protected from account-mapping leakage.

---

## 12. Ledger, dashboard, and activity

The backend ledger is the source of truth.

```text
Total displayed balance
    |-- Available
    |-- Savings goals
    `-- Grow allocation
```

- Home should read normalized balance and recent transaction activity from the backend.
- Deposits create activity only after validated processing.
- Reversals create explicit corrective activity.
- Savings goals are logical ledger envelopes (may be deferred if not on critical path).
- Funds in goals or Grow must return to Available before send where policy requires.
- Reconciliation compares Base transfers, ledger, Grow/Aave records, and (post-V1) Coinbase onramp records.

**Repo note:** `GET /api/v1/activity` currently lists `transactions` rows created by app deposit finalization — not live wallet chain activity. Home activity UI is not yet wired to the API. See [V1Architecture.md](../V1Architecture.md).

---

## 13. Send, receive, savings, and Grow

### Olimpia-to-Olimpia send / receive

- Registered-user P2P may ship later; it is not the simplified V1 funding path.
- Recipients are resolved by approved account identifier, not raw wallet address.
- Sponsored Base transactions and ledger entries remain backend-orchestrated.

### Savings goals

- Users create named goals and allocate from Available (may defer if not on critical path).
- Goals do not automatically earn yield.
- Goal movements remain auditable ledger entries.

### Grow

- Aave on Base is the intended V1 Grow / yield destination.
- Mobile presents one provider-neutral **Grow** experience (UI may still say Growth / Choose Yield until renamed).
- Rates are estimated and variable, never guaranteed.
- No automatic movement into Aave after funding.
- A Grow deposit requires settlement / finality, compliance checks, sufficient Available balance, and explicit user authorization.
- Users can withdraw from Grow back to Available / Privy wallet.
- **Repo status:** Choose Yield is a placeholder; no Aave adapter yet — see [V1Architecture.md](../V1Architecture.md).

---

## 14. Withdrawal (fiat offramp)

Fiat withdrawal to a linked bank is **deferred** (not required for App Store submission). No offramp provider is selected. (Withdraw from **Grow** back to wallet is in V1 scope — see §13.)

When selected later:

- Implement behind a replaceable backend provider interface.
- Withdraw from Available only.
- Normalize provider states and support reversals.

---

## 15. Security, compliance, and operations

- Provider secrets are server-side only.
- Verify every provider webhook signature.
- Authenticate and authorize every user API request.
- Use idempotency for provider events, blockchain events, and ledger writes.
- Do not store raw card or bank credentials.
- Assign KYC, sanctions, fraud, failed-payment, return, and chargeback ownership per provider (Coinbase when Headless Onramp is enabled post-V1).
- Apply transaction limits and velocity controls where available.
- Maintain audit logs and deposit status monitoring.
- Run provider / blockchain / ledger reconciliation jobs.
- Show clear fee disclosures and Base / USDC warnings.
- Do not move funds into Aave before finality and compliance checks.

---

## 16. Mobile / API boundary

The mobile app receives:

- Eligible funding methods (V1: Receive USDC; post-V1 may include Add Money)
- User-facing labels and disclosures
- Normalized status
- Backend-derived balance and transaction activity
- Launch / session instructions for Coinbase Headless only when Add Money is enabled (post-V1)

The mobile app does not receive:

- Provider secrets
- Raw provider status payloads
- Provider-specific business rules
- Authority to credit deposits
- Responsibility for blockchain monitoring

---

## 17. Security and release gates

Before production real-money V1:

- Privy production config confirmed for iOS
- Base monitor and confirmation policy approved
- Deposit / inbound event schema supports Base transfer idempotency
- Duplicate, delayed, failed, and unsupported-transfer tests pass
- Fee, network, asset, and recovery disclosures approved
- Coinbase Headless gated as post-V1 (credentials not a V1 launch blocker)
- Bridge-specific funding path remains absent from production

---

## 18. Future architecture (explicitly not V1)

- Coinbase Headless Onramp / Apple Pay Add Money (code preserved)
- Fiat offramp / bank withdrawal provider
- Additional funding providers
- Additional currencies or networks
- Multi-provider yield routing
- Functional Pia coach
- Physical or virtual debit card (Gnosis Pay or otherwise)
- Automated operations / admin tooling

None of these change the canonical V1 Receive USDC → Grow model above.

---

*End of Architecture v4.0*
