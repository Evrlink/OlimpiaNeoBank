# Olimpia — V1 Architecture

**Version:** 3.0  
**Status:** Canonical — current V1 build  
**Scope:** Architecture we are actually shipping for App Store submission  
**Product source:** [PRD.md](../product/PRD.md)  
**Launch scope:** [V1Scope.md](../product/V1Scope.md)  
**Implementation order:** [BuildPlan.md](../build/BuildPlan.md)  
**Decision authority:** [ArchitectureDecisionLog.md](./ArchitectureDecisionLog.md)

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

```text
User
  → Privy authentication
  → Privy embedded wallet
  → Coinbase Headless Onramp
  → USDC on Base delivered to Privy wallet
  → Olimpia balance / activity (backend ledger)
  → optional Aave Growth Account
```

| Layer | Active V1 choice |
|-------|------------------|
| Mobile | React Native / Expo — **iOS first** |
| Auth + wallet | Privy |
| Chain / asset | Base / supported USDC |
| Fiat Add Money | **Coinbase Headless Onramp** |
| Existing USDC | Transfer USDC (inbound on Base) |
| Backend | Node.js / Express + PostgreSQL |
| Growth | Aave on Base |
| Marketing | Vercel site + GA4 |

**Not active V1:** Bridge.xyz, Dakota, multi-provider bank-transfer matrices, bank withdrawal / off-ramp, virtual card. Historical ADRs may mention superseded providers; do not implement from them. See [ADR-013](./ArchitectureDecisionLog.md).

---

## 1. Architecture principles

Olimpia is a provider-orchestration product, not a bank, card network, wallet platform, blockchain, or yield protocol.

- The React Native / Expo app presents one calm, dollar-first account experience.
- **iOS is the App Store submission priority.** Android may follow; it is not on the 3–4 day critical path.
- Privy provides authentication and the embedded wallet.
- Base is the only supported V1 blockchain network.
- Supported USDC on Base is the only V1 asset.
- **Coinbase Headless Onramp** is the selected V1 fiat funding provider. Coinbase delivers USDC to the user’s Privy embedded wallet on Base.
- The backend owns provider integrations, state normalization, ledger updates, monitoring, and reconciliation.
- Mobile screens remain provider-agnostic. Provider names never replace **Add Money** or **Transfer USDC**.
- The backend ledger is authoritative for displayed balances and transaction status.
- Aave on Base is the Growth / yield destination. Funding never moves automatically into Aave.

The only V1 screen that exposes an address, asset, or network is **Receive USDC / Transfer USDC**, because users need those details to transfer safely.

---

## 2. Canonical money path

```text
User
  → Privy authentication
  → Privy embedded wallet
  → Coinbase Headless Onramp
  → USDC on Base delivered to Privy wallet
  → Olimpia balance / activity (backend ledger)
  → optional Aave Growth Account
```

This is the only active V1 funding architecture. Bridge.xyz and Dakota are **not** part of the current build. Historical decisions are recorded in [ArchitectureDecisionLog.md](./ArchitectureDecisionLog.md) (see ADR-008, ADR-013).

---

## 3. System surfaces

| Surface | Responsibility |
|---------|----------------|
| React Native / Expo app (`apps/mobile`) | Onboarding, Home, Add Money, activity, send/receive, savings, Growth, profile — iOS first |
| Node.js / Express API (`apps/api`) | Auth verification, Coinbase onramp session orchestration, ledger, statuses, webhooks/events, reconciliation |
| PostgreSQL / Supabase | Users, wallets, deposits, transactions, balances, goals, Growth allocations, idempotency records |
| Marketing website (`apps/marketing` on Vercel) | Acquisition, education, legal/support, waitlist — GA4 already installed |

### Core request path

```text
Mobile app
    |
    | Privy session token
    v
Olimpia backend
    |-- Privy: verify identity and resolve embedded wallet
    |-- Coinbase Headless Onramp: create session / verify completion
    |-- Blockchain deposit monitor: inbound USDC on Base (Transfer USDC + onramp delivery confirmation)
    |-- Ledger service: authoritative balances and activity
    |-- Aave adapter: Growth deposits/withdrawals (when Growth ships)
    `-- Notification service (optional for V1)
```

Provider callbacks and Base events enter the backend, are validated and deduplicated, then update the ledger. Mobile never interprets raw provider statuses or credits deposits itself.

---

## 4. Confirmed V1 infrastructure

| Capability | Decision |
|------------|----------|
| Authentication | Privy |
| Embedded wallet | Privy wallet associated with each Olimpia user |
| Network | Base only |
| Asset | Supported USDC contract on Base only |
| Fiat Add Money | **Coinbase Headless Onramp** (ACH, debit card, Apple Pay as Coinbase supports) |
| Existing USDC funding | Inbound transfer from Coinbase or another compatible Base wallet |
| Ledger | Olimpia backend / database is authoritative |
| Growth / yield | Aave on Base |
| Withdrawal / off-ramp | **Not in V1 App Store submission** — deferred until a provider is selected |
| Virtual card | **Post-V1** |

---

## 5. Canonical Add Funds architecture

```text
                         Add Funds
                              |
              ---------------------------------
              |                               |
         Add Money                      Transfer USDC
    Coinbase Headless Onramp         External wallet on Base
              |                               |
              ---------------------------------
                              |
                    User's Privy Wallet
                              |
                    USDC on Base (ledger credit)
                              |
                    Growth / Yield Account (optional)
                              |
                    Aave on Base
```

Both methods must produce the same verified end state:

1. Supported USDC is associated with the authenticated user’s Privy wallet on Base.
2. Exactly one idempotent deposit credit is recorded in the Olimpia ledger.
3. Balance and activity are refreshed from the backend.
4. Funds remain Available until the user separately authorizes movement to Growth.

---

## 6. Backend funding boundaries

Keep only the abstractions that already exist and speed the sprint. Do **not** invent multi-provider bank / onramp adapter layers for V1.

### CoinbaseOnramp (primary V1 fiat path)

- Create Headless Onramp session for the authenticated user.
- Destination: user’s Privy wallet address, Base, USDC.
- Track completion, cancellation, failure, and reversal via Coinbase callbacks / webhooks where available.
- Normalize Coinbase states into Olimpia funding statuses.
- Keep Coinbase-specific payloads out of mobile APIs.

### BlockchainDepositMonitor

- Monitor Base for inbound transfers of the supported USDC contract to the user’s Privy address.
- Validate chain, recipient, token contract, amount, and transaction hash.
- Prevent duplicate processing.
- Wait for the configured confirmation threshold.
- Send validated deposits to LedgerService.

Used for **Transfer USDC** and as a confirmation path when Coinbase delivers USDC on-chain.

### FundingService

- Expose one normalized funding model to mobile.
- Return eligible methods, launch/session instructions, and disclosures.
- Store `funding_method` and internal `provider`.
- Manage normalized funding states.

### LedgerService

- Remain authoritative for customer balances and activity.
- Use idempotent provider / event references.
- Prevent duplicate credits from retried webhooks or blockchain events.
- Apply reversals as explicit auditable transactions.

**Not in active V1 architecture:** Bridge transfer APIs, Bridge webhook routes, Dakota ACH adapters, multi-provider `BankTransferProvider` / configurable Privy Fiat Onramp selection layers.

---

## 7. Funding flow A — Coinbase Headless Onramp (Add Money)

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

- Payment methods are whatever Coinbase Headless supports for the user’s geography (typically ACH, debit card, Apple Pay).
- Coinbase controls checkout, quote, fees, and KYC.
- Do not use a hidden background WebView or imply Olimpia can bypass Coinbase checkout.
- Do not promise an exact USDC amount before the Coinbase quote.
- Do not promise account-free or KYC-free completion.
- Mobile labels remain **Add Money** — not “Coinbase”.

---

## 8. Funding flow B — Transfer USDC (Receive existing USDC)

```text
User selects Transfer USDC
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
Balance and inbound activity update
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

**Legacy note (implementation cleanup, not active architecture):** Existing `apps/api` code and migration `004_deposits_and_webhooks.sql` still contain Bridge-specific fields and routes (`bridge_intent_id`, `/webhooks/bridge`, `FUNDING_PROVIDER=bridge`). Removing them is a Day 1 BuildPlan task before Coinbase integration. See [BuildPlan.md](../build/BuildPlan.md).

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
    `-- Growth allocation
```

- Home reads normalized balance and recent activity from the backend.
- Deposits create activity only after validated processing.
- Reversals create explicit corrective activity.
- Savings goals are logical ledger envelopes, not separate bank accounts.
- Funds in goals or Growth must return to Available before send where policy requires.
- Reconciliation compares Coinbase onramp records, Base transfers, ledger, and later Aave records.

---

## 13. Send, receive, savings, and Growth

### Olimpia-to-Olimpia send / receive

- Registered-user P2P is the V1 default when send/receive ships.
- Recipients are resolved by approved account identifier, not raw wallet address.
- Sponsored Base transactions and ledger entries remain backend-orchestrated.

### Savings goals

- Users create named goals and allocate from Available.
- Goals do not automatically earn yield.
- Goal movements remain auditable ledger entries.

### Growth

- Aave on Base is the V1 Growth strategy.
- Mobile presents one provider-neutral **Growth Account**.
- Rates are estimated and variable, never guaranteed.
- No automatic movement into Aave after funding.
- A Growth deposit requires settlement / finality, compliance checks, sufficient Available balance, and explicit user authorization.

---

## 14. Withdrawal

Withdrawal to a linked bank is **deferred** (not required for App Store submission). No off-ramp provider is selected.

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
- Assign KYC, sanctions, fraud, failed-payment, return, and chargeback ownership per provider (Coinbase for Headless Onramp).
- Apply transaction limits and velocity controls where available.
- Maintain audit logs and deposit status monitoring.
- Run provider / blockchain / ledger reconciliation jobs.
- Show clear fee disclosures and Base / USDC warnings.
- Do not move funds into Aave before finality and compliance checks.

---

## 16. Mobile / API boundary

The mobile app receives:

- Eligible funding methods
- User-facing labels and disclosures
- Provider-confirmed estimates where available
- Launch / session instructions for Coinbase Headless
- Normalized status
- Backend-derived balance and activity

The mobile app does not receive:

- Provider secrets
- Raw provider status payloads
- Provider-specific business rules
- Authority to credit deposits
- Responsibility for blockchain monitoring

---

## 17. Security and release gates

Before production funding:

- Coinbase Headless Onramp credentials, sandbox, and production access confirmed
- Bridge-specific funding code, env vars, webhook route, and schema fields removed or replaced
- Base monitor and confirmation policy approved
- Deposit schema reviewed for Coinbase + Base fields
- Webhook / event signature and idempotency tests pass
- Duplicate, delayed, failed, cancelled, reversed, and unsupported-transfer tests pass
- Fee, KYC, network, asset, and recovery disclosures approved
- Production credentials and provider compliance approvals confirmed

---

## 18. Future architecture (explicitly not V1)

- Bank off-ramp / withdrawal provider
- Additional funding providers
- Additional currencies or networks
- Multi-provider yield routing
- Functional Pia coach
- Physical or virtual debit card (Gnosis Pay or otherwise)
- Automated operations / admin tooling

None of these change the canonical V1 Add Funds model above.

---

*End of Architecture v3.0*
