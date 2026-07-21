# Olimpia — V1 Architecture

**Version:** 2.0
**Status:** Draft for founder review
**Scope:** Canonical V1 system architecture
**Product source:** [PRD.md](../product/PRD.md)
**Launch scope:** [V1Scope.md](../product/V1Scope.md)
**Implementation order:** [BuildPlan.md](../build/BuildPlan.md)
**Decision authority:** [ArchitectureDecisionLog.md](./ArchitectureDecisionLog.md)

---

## 1. Architecture principles

Olimpia is a provider-orchestration product, not a bank, card network, wallet platform, blockchain, or yield protocol.

- The React Native app presents one calm, dollar-first account experience.
- Privy provides authentication and the embedded wallet.
- Base is the only supported V1 blockchain network.
- Supported USDC on Base is the only V1 asset.
- The backend owns provider integrations, state normalization, ledger updates, monitoring, and reconciliation.
- Mobile screens remain provider-agnostic. Provider names never replace **Bank Transfer**, **Apple Pay or Card**, or **Transfer USDC**.
- The backend ledger is authoritative for displayed balances and transaction status.
- Aave is the intended future Growth/yield destination. Funding never moves automatically into Aave.

The only V1 screen that exposes an address, asset, or network is **Receive USDC**, because users need those details to transfer safely.

---

## 2. System surfaces

| Surface | Responsibility |
|---------|----------------|
| React Native app | Onboarding, Home, Add Funds, activity, send/receive, savings, Growth, withdrawal, profile |
| Node.js backend | Auth verification, provider orchestration, ledger, statuses, webhooks/events, reconciliation |
| PostgreSQL | Users, wallets, deposits, transactions, balances, goals, Growth allocations, idempotency records |
| Marketing website | Acquisition, education, legal/support, waitlist/download links |

### Core request path

```text
Mobile app
    |
    | Privy session token
    v
Olimpia backend
    |-- Privy: verify identity and resolve embedded wallet
    |-- Dakota adapter: bank-transfer deposits
    |-- Fiat-onramp adapter: Privy-supported Apple Pay/card checkout
    |-- Blockchain deposit monitor: inbound USDC on Base
    |-- Ledger service: authoritative balances and activity
    |-- Aave adapter: future Growth deposits/withdrawals
    `-- Notification service
```

Provider callbacks and Base events enter the backend, are validated and deduplicated, then update the ledger. Mobile never interprets raw provider statuses or credits deposits itself.

---

## 3. Confirmed V1 infrastructure

| Capability | Decision |
|------------|----------|
| Authentication | Privy |
| Embedded wallet | Privy wallet associated with each Olimpia user |
| Network | Base only |
| Asset | Supported USDC contract on Base only |
| Bank funding | Dakota ACH, behind a replaceable backend interface |
| Apple Pay/card funding | Privy Fiat Onramp with a configurable underlying provider |
| Existing USDC funding | Inbound transfer from Coinbase or another compatible Base wallet |
| Ledger | Olimpia backend/database is authoritative |
| Growth/yield | Aave is the intended future destination, subject to implementation and compliance validation |
| Withdrawal | V1 product requirement; provider is not selected |

Coinbase can be evaluated as an underlying fiat-onramp provider, but it is not selected unless separately confirmed. Coinbase is also an example source wallet for Transfer USDC, not an exclusive requirement.

---

## 4. Canonical Add Funds architecture

```text
                         Add Funds
                              |
            -----------------------------------
            |                 |               |
      Bank Transfer      Apple Pay/Card   Transfer USDC
        Dakota ACH       Privy Fiat       External wallet
                          Onramp           on Base
            |                 |               |
            -----------------------------------
                              |
                    User's Privy Wallet
                              |
                         USDC Balance
                              |
                    Growth / Yield Account
                              |
                    Aave yield strategy
```

All three methods must produce the same verified end state:

1. Supported USDC is associated with the authenticated user's Privy wallet on Base.
2. Exactly one idempotent deposit credit is recorded in the Olimpia ledger.
3. Balance and activity are refreshed from the backend.
4. Funds remain available until the user separately authorizes movement to Growth.

Any intermediary provider custody or settlement account must be validated and reconciled before production.

---

## 5. Backend funding boundaries

Exact interface names may follow repository conventions, but responsibilities must remain separated.

### BankTransferProvider

- Create or identify provider customers.
- Initiate ACH/bank-transfer deposits.
- Fetch deposit status.
- Validate Dakota webhooks.
- Normalize Dakota states into Olimpia states.
- Keep Dakota-specific payloads out of mobile APIs.

### FiatOnrampProvider

- Create or launch the Privy-supported onramp experience.
- Set destination wallet, Base, USDC, and amount where supported.
- Track provider completion, cancellation, failure, and reversal.
- Normalize provider states.
- Keep the underlying provider configurable.

### BlockchainDepositMonitor

- Monitor Base for inbound transfers of the supported USDC contract.
- Validate chain, recipient, token contract, amount, and transaction hash.
- Prevent duplicate processing.
- Wait for the configured confirmation threshold.
- Send validated deposits to LedgerService.

Monitoring may use a provider webhook, indexed event service, or secure backend RPC polling. The mobile app is never the sole detector.

### FundingService

- Expose one normalized funding model to mobile.
- Return eligible methods, provider-confirmed arrival information, and disclosures.
- Store `funding_method` and internal `provider`.
- Manage normalized funding states.
- Avoid coupling API responses to Dakota, Coinbase, Stripe, or another provider.

### LedgerService

- Remain authoritative for customer balances and activity.
- Use idempotent provider/event references.
- Prevent duplicate credits from retried webhooks or blockchain events.
- Reconcile ledger entries against provider and Base records.
- Apply reversals as explicit auditable transactions.

---

## 6. Funding flow A — Dakota ACH

```text
User selects Bank Transfer
        |
User enters deposit amount
        |
Backend creates required Dakota transaction
        |
Dakota processes ACH / bank transfer
        |
USDC ultimately reaches the user's Privy wallet on Base
        |
Backend validates provider status or webhook
        |
Ledger is credited once
        |
App refreshes deposit status, balance, and activity
```

### Pricing assumption

- Dakota has indicated an approximate cost of $0.25 per completed transaction.
- Olimpia intends to disclose a $1 total bank-transfer fee.
- Intended gross margin is $0.75 before other costs.

This is not finalized or compliance-approved. It requires confirmation that Dakota permits the markup and that provider, legal, compliance, and disclosure requirements are satisfied.

### Dakota validation required

- Customer creation and KYC ownership
- Bank account linking
- Deposit creation
- Whether Dakota converts USD to USDC
- Whether Dakota can deliver directly to each user's Privy wallet
- Whether funds first settle in an Olimpia- or Dakota-controlled account
- Webhook events and provider status states
- Refunds, cancellation, failed ACH, returns, and reversals
- Fee and markup rules
- Sandbox and production requirements

---

## 7. Funding flow B — Privy Fiat Onramp

```text
User selects Apple Pay or Card
        |
User enters or confirms amount
        |
App launches Privy's supported fiat-onramp experience
        |
Configured provider supplies final quote, fees, payment, and KYC
        |
Provider sends USDC to user's Privy wallet on Base
        |
Backend verifies completion
        |
Ledger, balance, and activity update
```

Constraints:

- Apple Pay and debit card are intended.
- Credit card appears only when supported and approved.
- The provider controls checkout, payment requirements, KYC, quote, and fees.
- Do not use a hidden background WebView or imply Olimpia can bypass provider checkout.
- Do not promise account-free, KYC-free, or repeat one-click completion.
- Do not promise an exact USDC amount before the provider quote.
- Any Olimpia convenience fee requires separate provider, business, legal, and compliance approval.

Validation must confirm React Native support, iOS/Android behavior, geography, payment methods, Base/USDC destination settings, amount prefill, callbacks/webhooks, KYC, cancellation, failures, reversals, and fee presentation.

---

## 8. Funding flow C — Receive existing USDC

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
- Authenticated user's destination address
- Supported USDC token contract
- Amount and transaction hash
- Duplicate-event protection
- Required confirmation threshold
- Reorg/reversal policy

Unsupported tokens are not credited merely because they arrive at the address.

Required warning:

> Only send supported USDC using the Base network. Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

---

## 9. Normalized funding states

| Status | Meaning |
|--------|---------|
| `pending` | Request created; provider/event processing has not started |
| `processing` | Provider or Base confirmation is in progress |
| `completed` | Validation/finality complete and ledger credited |
| `failed` | Terminal failure; no credit |
| `cancelled` | User/provider cancelled before completion |
| `reversed` | A previously completed funding entry was returned or reversed |

The UI may combine `pending` and `processing` into one calm in-progress state. Provider-specific statuses never reach mobile unchanged.

---

## 10. Funding data model — implementation review

No migration is authorized by this document. The deposit model must be reviewed for:

- `funding_method`: `bank_transfer`, `fiat_onramp`, `external_usdc`
- `provider`: `dakota`, configured Privy provider, `base_blockchain`
- `provider_transaction_id`
- `blockchain_transaction_hash`
- `destination_wallet_address`
- `chain_id`
- `asset`
- `gross_amount`
- `provider_fee`
- `olimpia_fee`
- `net_amount`
- `status`
- `failure_code`
- `failure_message`
- `confirmed_at`
- `credited_at`

Every provider or blockchain reference used for crediting must have an idempotency constraint or equivalent processing guard.

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
- Funds in goals or Growth must return to Available before withdrawal or send where policy requires.
- Reconciliation compares Dakota, fiat-onramp, Base, ledger, and later Aave records.

---

## 13. Send, receive, savings, and Growth

### Olimpia-to-Olimpia send/receive

- Registered-user P2P remains the V1 default.
- Recipients are resolved by approved account identifier, not raw wallet address.
- Sponsored Base transactions and ledger entries remain backend-orchestrated.

### Savings goals

- Users create named goals and allocate from Available.
- Goals do not automatically earn yield.
- Goal movements remain auditable ledger entries.

### Growth

- Aave on Base is the intended future V1 strategy.
- Mobile presents one provider-neutral **Growth Account**.
- Rates are estimated and variable, never guaranteed.
- No automatic movement into Aave after funding.
- A Growth deposit requires settlement/finality, compliance checks, sufficient Available balance, and explicit user authorization.

---

## 14. Withdrawal

Withdrawal to a linked bank remains a V1 product requirement, but its provider is unresolved.

- Do not assume Dakota supports off-ramp.
- Implement behind a replaceable backend provider interface.
- Withdraw from Available only.
- Normalize provider states and support reversals.
- Select and validate provider, KYC, payout geography, fees, destination linking, webhooks, returns, and reconciliation before release.

---

## 15. Security, compliance, and operations

- Provider secrets are server-side only.
- Verify every provider webhook signature.
- Authenticate and authorize every user API request.
- Use idempotency for provider events, blockchain events, and ledger writes.
- Do not store raw card or bank credentials unless explicitly required and approved.
- Assign KYC, sanctions, fraud, failed-payment, return, and chargeback ownership per provider.
- Apply transaction limits and velocity controls.
- Maintain audit logs and deposit status monitoring.
- Run provider/blockchain/ledger reconciliation jobs.
- Show clear fee disclosures and Base/USDC warnings.
- Do not move funds into Aave before finality and compliance checks.

---

## 16. Mobile/API boundary

The mobile app receives:

- Eligible funding methods
- User-facing labels and disclosures
- Provider-confirmed estimates where available
- Launch/session instructions
- Normalized status
- Backend-derived balance and activity

The mobile app does not receive:

- Provider secrets
- Raw provider status payloads
- Provider-specific business rules
- Authority to credit deposits
- Responsibility for blockchain monitoring

Existing API route design is not changed by this documentation task. Any API changes require a separate implementation review.

---

## 17. Security and release gates

Before production funding:

- Dakota capabilities and commercial terms confirmed
- Fiat-onramp provider selected and validated
- Base monitor and confirmation policy approved
- Deposit schema reviewed and migrated in a separate task
- Webhook/event signature and idempotency tests pass
- Duplicate, delayed, failed, cancelled, returned, reversed, and unsupported-transfer tests pass
- Reconciliation jobs and support playbooks exist
- Fee, KYC, network, asset, and recovery disclosures approved
- Production credentials and provider compliance approvals confirmed

---

## 18. Future architecture

- Additional funding or off-ramp providers behind existing interfaces
- Additional currencies or networks
- Multi-provider yield routing
- Functional Pia coach
- Physical card
- Automated operations/admin tooling

None of these change the canonical V1 Add Funds model.

---

*End of Architecture v2.0*
