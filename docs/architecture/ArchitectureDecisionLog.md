# Olimpia — Architecture Decision Log

**Status:** Active
**Last Updated:** 2026-07-20
**Last Reviewed:** 2026-07-20
**Next Review:** Before Real-Money Beta
**Purpose:** Single source of truth for major product and architecture decisions.

Status definitions:

- **Confirmed** — approved direction; changes require a new decision entry.
- **Planned** — approved for the roadmap but not yet implemented or fully operational.
- **Deferred** — intentionally postponed for later evaluation.
- **Under Validation** — intended direction with unresolved technical, provider, commercial, legal, or compliance questions.
- **Rejected** — evaluated and explicitly excluded from the active architecture.

# Decision Lifecycle

Architecture decisions move through one of these common paths:

```text
Proposed
→ Under Validation
→ Confirmed
```

```text
Proposed
→ Under Validation
→ Rejected
```

```text
Confirmed
→ Deferred
```

Update an existing decision when its architectural direction remains materially the same and only its status, confidence, validation, or review metadata changes. Create a new ADR when the architectural direction materially changes, replaces a prior decision, or introduces a distinct decision that should be reviewed independently.

Decision dates below record the current decision set adopted in this log. They do not imply that implementation or provider validation completed on that date.

| Decision ID | Decision | Status | Confidence | Decision Date | Rationale | Alternatives Considered | Validation Required | Owner |
|-------------|----------|--------|------------|---------------|-----------|-------------------------|---------------------|-------|
| ADR-001 | Use Base as the V1 blockchain network | Confirmed | High | 2026-07-20 | A single supported network reduces user risk, monitoring complexity, transaction-state complexity, and operational scope. | Ethereum mainnet; additional EVM networks; multi-chain support | Confirm production RPC/monitoring reliability, supported USDC contract, confirmation policy, sanctions responsibilities, and operational alerting. | Product & Engineering |
| ADR-002 | Use supported USDC as the primary V1 asset | Confirmed | High | 2026-07-20 | USDC supports a dollar-denominated experience while allowing funding, transfers, and future Growth on Base. | Fiat-only ledger; other stablecoins; multiple assets | Confirm canonical Base USDC contract, decimal handling, provider support, reconciliation, and user disclosures. | Product & Engineering |
| ADR-003 | Use Privy for authentication and embedded wallets | Confirmed | High | 2026-07-20 | Privy provides familiar authentication and embedded wallets without requiring users to manage keys or seed phrases. | Custom authentication and wallet infrastructure; other embedded-wallet providers | Confirm production configuration, session recovery, wallet ownership model, mobile support, security controls, and restricted geographies. | Engineering |
| ADR-004 | Use Dakota as the planned ACH / Bank Transfer provider | Under Validation | Medium | 2026-07-20 | Dakota appears suitable for low-cost bank funding and supports the intended provider-separated model without coupling the mobile experience to a vendor. | Other ACH providers; bank-linking/onramp platforms; delaying bank funding | Validate customer creation, KYC ownership, bank linking, deposit creation, USD-to-USDC conversion, direct-to-Privy-wallet capability, intermediary settlement/custody, webhooks, statuses, returns, reversals, fees, markup permission, geography, sandbox, and production access. | Founder, Product & Engineering |
| ADR-005 | Use Privy Fiat Onramp as the Apple Pay / Card strategy | Under Validation | Medium | 2026-07-20 | Privy's supported onramp experience can keep checkout and compliance provider-controlled while preserving a provider-neutral Olimpia UI. | Custom provider WebView; direct Coinbase integration; direct Stripe integration; other onramp SDKs | Validate configurable provider options, React Native support, iOS/Android behavior, Apple Pay, debit/credit card support, Base/USDC destination configuration, amount prefill, quote and fee presentation, KYC, callbacks, cancellation, failure, reversal, geography, and limits. | Product & Engineering |
| ADR-006 | Support direct receipt of existing USDC from another Base wallet | Planned | Medium | 2026-07-20 | Existing Coinbase and wallet users need a direct funding path without repurchasing USDC or using a bank/card flow. | P2P receive only; Coinbase-only transfer integration; no external wallet funding | Validate backend monitoring provider/RPC, canonical token contract, address ownership, confirmation threshold, duplicate prevention, reorg/reversal policy, unsupported-token handling, operational monitoring, and recovery messaging. | Product & Engineering |
| ADR-007 | Use Aave as the intended V1 Growth/yield protocol | Under Validation | Medium | 2026-07-20 | One intended protocol limits V1 complexity while supporting a simple provider-neutral Growth Account. | Morpho; Compound; multiple-provider routing; no Growth at V1 | Validate Base market/contracts, security review, compliance and geography, rate source, deposit/withdrawal behavior, liquidity, user authorization, accounting, reconciliation, failure handling, and production readiness. | Founder, Product & Engineering |
| ADR-008 | Exclude Bridge from the active V1 architecture | Rejected | High | 2026-07-20 | Bridge was evaluated but is not a current fit for Olimpia's early-stage size and provider eligibility. Active V1 planning must not depend on Bridge. | Continue with the original Bridge-centered onramp/off-ramp model | No provider validation required. Any remaining legacy code/configuration requires a separately approved cleanup or migration task. | Founder |
| ADR-009 | Defer Coinbase Headless as a dedicated fiat-onramp integration | Deferred | Medium | 2026-07-20 | The V1 strategy prioritizes Privy's configurable Fiat Onramp rather than a direct provider-specific mobile integration. Coinbase remains useful as an example source wallet for Transfer USDC. | Select Coinbase Headless now; direct Coinbase-specific checkout | Re-evaluate product fit, startup eligibility, mobile SDK support, KYC, fees, Base/USDC delivery, callbacks, geography, and commercial terms after MVP. | Founder, Product & Engineering |
| ADR-010 | Implement provider integrations behind abstraction layers | Confirmed | High | 2026-07-20 | Separate provider adapters prevent mobile and core funding logic from being locked to Dakota, an onramp provider, or a blockchain-monitoring vendor. | Provider-specific business logic in screens or route handlers | Validate interface contracts, normalized errors/statuses, provider switching, test doubles, observability, and reconciliation boundaries during implementation review. | Engineering |
| ADR-011 | Treat the backend ledger as the source of truth | Confirmed | High | 2026-07-20 | A server-authoritative ledger enables idempotent credits, consistent balances/activity, reversals, auditability, and provider/blockchain reconciliation. | Wallet balance as UI truth; mobile-computed balances; provider status as direct balance authority | Validate ledger invariants, idempotency constraints, reversal semantics, reconciliation jobs, audit logs, and operational recovery before real-money launch. | Engineering |
| ADR-012 | Keep the Add Funds mobile UI provider-neutral | Confirmed | High | 2026-07-20 | Users should choose based on what they already have, expected cost, and timing—not infrastructure-provider names. This also reduces vendor lock-in. | Dakota-, Coinbase-, Stripe-, or other provider-branded primary method labels | Validate usability and comprehension for Bank Transfer, Apple Pay or Card, and Transfer USDC; confirm fee/timing disclosures and accessible cancel/return behavior. | Product & Design |

Future decisions continue sequentially with **ADR-013**, **ADR-014**, and so on.

# Cross-reference Guidance

Future documentation should reference Decision IDs instead of repeating decision rationale, assumptions, or validation requirements.

- The PRD may reference **ADR-004** instead of repeating Dakota assumptions.
- Architecture may reference **ADR-010** for provider abstraction.
- The Build Plan may reference **ADR-007** when implementing the Growth Account.

Decision IDs reduce duplicated documentation and make it easier to trace when an architectural direction changes.

# Guiding Principles

## Provider abstraction

Provider-specific SDKs, payloads, statuses, webhooks, and business rules remain behind backend interfaces. The mobile app consumes normalized funding methods and states.

## Beginner-first UX

Funding choices are described by what the user already has and how she wants to add funds. Primary labels remain **Bank Transfer**, **Apple Pay or Card**, and **Transfer USDC**.

## Hide blockchain complexity

Balances are presented in dollars. Wallet, token, and network mechanics remain hidden except where required for safe **Receive USDC** instructions.

## Compliance before convenience

KYC, sanctions, fraud, fee, disclosure, chargeback, return, and provider requirements must be validated before optimizing for fewer steps or faster checkout.

## Ledger-first accounting

The backend ledger, not mobile state or an unvalidated provider event, determines displayed balances and activity. Credits, reversals, and retries must be idempotent and auditable.

## Documentation-first development

Major product and architecture decisions are documented and reviewed before code, API, schema, provider, credential, migration, or production changes begin.

## Avoid vendor lock-in

Providers are selected through replaceable adapters. User-facing flows and core ledger behavior must survive a provider change.

# Future Re-evaluation

The following decisions are expected to be revisited after MVP:

- Additional ACH / bank-transfer providers
- Additional Privy-compatible or direct fiat-onramp providers
- International funding, eligibility, and currency support
- Selection of a V1/post-V1 off-ramp provider
- Gnosis Pay or another card provider
- Additional yield providers
- Smart routing between funding, liquidity, or yield providers
- Coinbase Headless as a direct fiat-onramp integration
- Additional supported assets or networks
- Automated provider failover

Re-evaluation does not change the active V1 architecture until a new decision is recorded here with an updated status and rationale.

# Decision History

## Original funding architecture

Early Olimpia planning used a single provider-centered model for fiat funding and withdrawal. That approach concentrated user funding, provider checkout, settlement, status handling, and KYC assumptions in one integration.

## Transition to provider-separated funding

The V1 model now separates:

- Bank Transfer through a replaceable ACH adapter, with Dakota under validation
- Apple Pay / Card through Privy Fiat Onramp with a configurable provider
- Direct receipt of supported USDC from Coinbase or another compatible Base wallet
- Backend ledger, monitoring, normalization, and reconciliation as Olimpia-owned responsibilities

## Reason for the change

The previously evaluated provider was not a current fit for an early-stage startup of Olimpia's size. The provider-separated architecture supports realistic provider eligibility, avoids vendor lock-in, and allows each funding method to be validated or replaced independently without redesigning the mobile experience.

---

When a decision changes, update the existing entry's status only if its meaning remains the same. For a material reversal, preserve the prior outcome in **Decision History** and add a new dated decision entry.
