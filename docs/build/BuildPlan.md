# Olimpia — V1 Build Plan

**Version:** 2.0
**Status:** Draft for founder review
**PRD:** [PRD.md](../product/PRD.md)
**Architecture:** [Architecture.md](../architecture/Architecture.md)
**Scope:** [V1Scope.md](../product/V1Scope.md)

This plan documents implementation work only. It does not authorize application changes, APIs, migrations, provider credentials, or production deployment.

---

## Build principles

1. Backend ledger and authentication before real-money integrations.
2. Provider-neutral mobile screens.
3. Provider-specific behavior behind backend interfaces.
4. One normalized funding state model.
5. Idempotent crediting and reconciliation before production.
6. iOS and Android tested in every mobile phase.
7. No automatic movement into Growth.
8. Conceptual PRD wireframes require design/content review before final implementation.

---

## Phase overview

| Phase | Outcome |
|-------|---------|
| 0 | Foundation and provider validation |
| 1 | Marketing and legal/support readiness |
| 2 | Privy authentication, shell, and empty-account onboarding |
| 3 | Authoritative dashboard and activity |
| 4A | Funding architecture cleanup |
| 4B | Receive USDC on Base |
| 4C | Dakota ACH |
| 4D | Privy Fiat Onramp |
| 4E | Funding reconciliation and release readiness |
| 5 | Savings goals |
| 6 | Olimpia-user send and receive |
| 7 | Growth Account / intended Aave strategy |
| 8 | Withdrawal provider integration |
| 9 | V1 hardening and release |

---

## Phase 0 — Foundation and validation

### Deliverables

- Runnable mobile, API, and marketing workspaces.
- Privy mobile/server project configuration.
- PostgreSQL and ledger development environment.
- Server-side secrets pattern.
- Define provider-neutral interfaces:
  - `BankTransferProvider`
  - `FiatOnrampProvider`
  - `BlockchainDepositMonitor`
  - `FundingService`
  - `LedgerService`
- Validate launch geography and provider restrictions.
- Start Dakota and fiat-onramp capability checklists.
- Define Base USDC contract and monitoring options.

### Acceptance

- Mobile runs on iOS and Android.
- API health check succeeds.
- No secrets in mobile or git.
- Provider decisions are clearly marked confirmed or pending.

---

## Phase 1 — Marketing and release information

### Deliverables

- Public marketing site, legal/support pages, and waitlist/download paths.
- Product copy aligned with canonical V1 features.
- Trusted-provider branding only where relationships and logo usage are confirmed.
- No claims of guaranteed yield, bank status, or unsupported security.

### Acceptance

- Public content does not describe a superseded funding implementation.
- Add Funds messaging matches PRD.
- Accessibility and SEO checks pass.

---

## Phase 2 — Authentication, shell, and empty account

### Backend

- Privy token verification.
- Auth sync creates/links user and embedded wallet.
- Ledger initialization without resetting existing balances.
- Profile/session endpoints and sign-out behavior.

### Mobile

- Welcome and Privy authentication.
- Home, Savings, Card, Profile tabs.
- Empty-account state:

```text
Your account is ready
Add your first funds to begin using Olimpia.
[Add Funds]
```

- `$0.00` secondary, not the dominant message.
- Add Funds routes to the canonical method chooser.
- No copy implying immediate or automatic yield.

### Acceptance

- New and returning users authenticate on iOS and Android.
- Wallet association remains invisible outside Receive USDC.
- Empty-account onboarding has one clear next action.

---

## Phase 3 — Dashboard, ledger, and activity

### Backend

- Authoritative balance buckets: Available, Savings, Growth.
- Normalized transaction/activity records.
- Balance, activity, and transaction-detail reads.
- Canonical statuses: pending, processing, completed, failed, cancelled, reversed.

### Mobile

- Home balance and state-aware next action.
- Add Funds, Send, Receive.
- Recent activity and transaction detail.
- Shared async and error states.

### Acceptance

- Displayed balances come from the backend ledger.
- Reversals are explicit.
- Activity labels remain plain and provider-neutral.

---

## Phase 4A — Funding architecture cleanup

### Deliverables

- Keep existing mocks only where useful for UI development.
- Establish provider interfaces and normalized funding model.
- Review deposit/ledger schema requirements; migration is a separate approved task.
- Define idempotency keys, event records, status mapping, and reconciliation references.
- Define eligible-method/config response without exposing provider business logic.
- Retire dormant legacy-provider code/configuration only in a later approved implementation task.

### Mobile requirements

- Method order:
  1. Bank Transfer
  2. Apple Pay or Card
  3. Transfer USDC
- Provider names are not method labels.
- Keep Transfer USDC visible.
- Keep normal navigation unless validated testing supports focus mode.
- Every checkout/confirmation provides cancel, close, or return.

### Acceptance

- One provider-neutral Add Funds model is documented and ready for implementation.
- No mobile dependency on provider payloads or raw statuses.

---

## Phase 4B — Receive existing USDC

### Backend

- Implement secure Base monitoring through approved webhook/indexer/RPC approach.
- Validate chain, recipient, supported USDC token, amount, and transaction hash.
- Apply confirmation threshold.
- Prevent duplicate credits.
- Create inbound activity and ledger credit after validation.
- Handle delayed events and reorg/reversal policy.

### Mobile

- **Receive USDC** screen.
- Authenticated Privy address.
- QR code and Copy Address.
- Prominent **Base network** label.
- Beginner Coinbase instructions plus support for other compatible wallets.
- Required unsupported asset/network warning.
- Pending until backend confirmation.

### Acceptance

- Supported USDC on Base credits exactly once.
- Unsupported token/network does not credit.
- Replayed events do not duplicate activity or balance.
- No three-to-five-second guarantee.

---

## Phase 4C — Dakota ACH

### Validation before implementation

- Customer creation and KYC ownership
- Bank linking
- Deposit creation
- USD-to-USDC conversion responsibility
- Direct-to-Privy-wallet support
- Intermediate custody/settlement
- Webhooks and status states
- Failed ACH, cancellation, returns, refunds, reversals
- $0.25 cost and markup permission
- Sandbox and production access

### Backend

- Dakota adapter behind `BankTransferProvider`.
- Signature validation and idempotent webhook processing.
- Normalized status mapping.
- Ledger credit only after validated completion.
- Reversal handling and reconciliation.

### Mobile

Conceptual review hierarchy:

- Amount
- Connected bank
- Your Olimpia account
- Deposit amount
- Olimpia transfer fee
- Total bank withdrawal
- Exact account credit
- Provider-confirmed expected arrival
- **Review Transfer** / **Review & Continue**

### Acceptance

- $1 total fee appears only after commercial/compliance approval.
- Conceptual 1–2 business-day timing is not hardcoded.
- Completed, failed, cancelled, returned, and reversed cases pass.
- Funding does not start Growth automatically.

---

## Phase 4D — Privy Fiat Onramp

### Validation before implementation

- Supported underlying providers
- React Native, iOS, and Android support
- Apple Pay and debit-card availability
- Optional credit-card approval
- Base, USDC, wallet destination, and amount configuration
- Final quote/fee presentation
- KYC and first-transaction behavior
- Completion, cancellation, failure, and reversal callbacks
- Geography and transaction limits
- Convenience-fee restrictions

### Backend

- Configurable `FiatOnrampProvider`.
- Launch/session configuration where required.
- Completion verification and normalized statuses.
- Reconciliation against wallet receipt and provider records.

### Mobile

- Amount and Apple Pay/card selection.
- Launch Privy's supported onramp experience.
- No hidden background WebView.
- No exact USDC amount before provider quote.
- Provider final fee before confirmation.
- Identity-verification disclosure.

### Acceptance

- Checkout works on iOS and Android.
- Cancel/failure returns safely to Add Funds.
- Final receipt, ledger, balance, and activity reconcile.
- No assumption that this method costs $1.

---

## Phase 4E — Funding reconciliation and release readiness

### Deliverables

- Reconcile Dakota deposits.
- Reconcile fiat-onramp provider records.
- Reconcile Base transfers.
- Reconcile all records against ledger entries.
- Scheduled monitoring for stuck processing records.
- Audit logs and operational alerts.
- Support playbooks for failures, returns, chargebacks, and unsupported transfers.
- Limits, velocity controls, sanctions/fraud ownership.
- Production credential and compliance approval checklist.

### Acceptance

- Duplicate webhooks/events are harmless.
- Delayed confirmation and provider outage tests pass.
- Reversed funding corrects balance/activity exactly once.
- Fee, timing, KYC, network, and asset disclosures are approved.

---

## Phase 5 — Savings goals

### Backend

- Goal CRUD and allocation movements.
- Available ↔ Savings ledger entries.
- Goal activity.

### Mobile

- Goals list, create-goal sheet, detail, progress, add/remove funds.
- No automatic yield or fake APY.

### Acceptance

- Goal movements preserve total balance.
- Insufficient Available balance returns a clear error.

---

## Phase 6 — Send and receive

### Backend

- Registered-user lookup and transfer.
- Sponsored Base transaction where required.
- Idempotent sender/recipient ledger entries.
- Receive handle/link support.

### Mobile

- Recipient, amount, note, review, authorization, status.
- P2P Receive remains distinct from Receive USDC funding.

### Acceptance

- Two test users send/receive on iOS and Android.
- Insufficient balance and unknown-recipient paths pass.

---

## Phase 7 — Growth Account

### Backend

- Intended Aave-on-Base adapter.
- Growth deposit, withdrawal, position, and estimated earnings.
- Reconciliation against ledger and protocol position.

### Mobile

- Provider-neutral Growth Account.
- Explicit user authorization to move eligible Available funds.
- Estimated variable earnings; no guarantees.

### Acceptance

- No automatic funding-to-Growth movement.
- Funds return to Available on successful Growth withdrawal.
- Provider names stay out of mobile.

---

## Phase 8 — Withdrawal

### Required first

- Select and validate a replaceable off-ramp provider.
- Confirm KYC, destinations, geography, fees, timing, webhooks, returns, and reconciliation.

### Deliverables

- Provider adapter and normalized withdrawal statuses.
- Available-only withdrawal policy.
- Linked destination flow.
- Ledger debit/reversal and activity.

### Acceptance

- Withdrawal works in provider sandbox on iOS and Android.
- Savings/ Growth funds cannot be withdrawn until returned to Available.

---

## Phase 9 — V1 hardening and release

- End-to-end iOS and Android testing.
- Authentication/session recovery.
- All three Add Funds methods.
- Balance/activity reconciliation.
- Savings, send/receive, Growth, withdrawal.
- Security review: auth, authorization, secrets, signatures, idempotency, limits.
- Legal, privacy, fee, KYC, network, asset, and yield disclosures.
- Provider outage and delayed-event tests.
- App Store and Google Play readiness.
- Support and operational ownership.

### Release gate

- No unresolved duplicate-credit risk.
- No provider-specific funding labels in mobile.
- No hardcoded unconfirmed fee/arrival claim.
- No automatic yield enrollment.
- No raw provider errors.
- All V1 launch blockers in V1Scope resolved or explicitly accepted.

---

## Deferred

- Functional Pia chat
- Functional card spending
- Physical card
- Additional assets or networks
- Multi-provider yield routing
- Automatic yield
- Request money
- Admin dashboard beyond release-essential operations

---

*End of Build Plan v2.0*
