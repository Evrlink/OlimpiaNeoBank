# Olimpia — Architecture Decision Log

**Status:** Active  
**Last Updated:** 2026-08-07  
**Last Reviewed:** 2026-08-07  
**Next Review:** Before App Store submission  
**Purpose:** Single source of truth for major product and architecture decisions.

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

Governing decision: **ADR-013**. Superseded: ADR-004 (Dakota), ADR-005 (Privy Fiat Onramp strategy), ADR-009 (deferred Coinbase Headless). Bridge remains excluded; remaining Bridge **code** must be removed (BuildPlan Day 1). Do not implement from superseded ADRs.

---

Status definitions:

- **Confirmed** — approved direction; changes require a new decision entry.
- **Planned** — approved for the roadmap but not yet implemented or fully operational.
- **Deferred** — intentionally postponed for later evaluation.
- **Under Validation** — intended direction with unresolved technical, provider, commercial, legal, or compliance questions.
- **Rejected** — evaluated and explicitly excluded from the active architecture.
- **Superseded** — replaced by a later ADR; kept for history only. Do not use for implementation.

# Decision Lifecycle

```text
Proposed → Under Validation → Confirmed
Proposed → Under Validation → Rejected
Confirmed → Deferred
Confirmed / Under Validation → Superseded (by a new ADR)
```

Update an existing decision when its architectural direction remains materially the same and only its status, confidence, validation, or review metadata changes. Create a new ADR when the architectural direction materially changes, replaces a prior decision, or introduces a distinct decision that should be reviewed independently.

| Decision ID | Decision | Status | Confidence | Decision Date | Rationale | Alternatives Considered | Validation Required | Owner |
|-------------|----------|--------|------------|---------------|-----------|-------------------------|---------------------|-------|
| ADR-001 | Use Base as the V1 blockchain network | Confirmed | High | 2026-07-20 | A single supported network reduces user risk, monitoring complexity, transaction-state complexity, and operational scope. | Ethereum mainnet; additional EVM networks; multi-chain support | Confirm production RPC/monitoring reliability, supported USDC contract, confirmation policy, sanctions responsibilities, and operational alerting. | Product & Engineering |
| ADR-002 | Use supported USDC as the primary V1 asset | Confirmed | High | 2026-07-20 | USDC supports a dollar-denominated experience while allowing funding, transfers, and Growth on Base. | Fiat-only ledger; other stablecoins; multiple assets | Confirm canonical Base USDC contract, decimal handling, provider support, reconciliation, and user disclosures. | Product & Engineering |
| ADR-003 | Use Privy for authentication and embedded wallets | Confirmed | High | 2026-07-20 | Privy provides familiar authentication and embedded wallets without requiring users to manage keys or seed phrases. | Custom authentication and wallet infrastructure; other embedded-wallet providers | Confirm production configuration, session recovery, wallet ownership model, mobile support, security controls, and restricted geographies. | Engineering |
| ADR-004 | Use Dakota as the planned ACH / Bank Transfer provider | **Superseded by ADR-013** | — | 2026-07-20 | Historical: Dakota was evaluated for low-cost bank funding. **No longer active.** See ADR-013 and archived evaluation notes. | Other ACH providers; delaying bank funding | N/A — superseded | Founder, Product & Engineering |
| ADR-005 | Use Privy Fiat Onramp as the Apple Pay / Card strategy | **Superseded by ADR-013** | — | 2026-07-20 | Historical: Privy’s configurable Fiat Onramp was the interim card strategy. **Replaced by Coinbase Headless Onramp as the sole V1 fiat funding path.** | Direct Coinbase; Stripe; other onramp SDKs | N/A — superseded | Product & Engineering |
| ADR-006 | Support direct receipt of existing USDC from another Base wallet | Planned | Medium | 2026-07-20 | Existing Coinbase and wallet users need a direct funding path without repurchasing USDC. | P2P receive only; Coinbase-only transfer integration; no external wallet funding | Validate backend monitoring provider/RPC, canonical token contract, address ownership, confirmation threshold, duplicate prevention, reorg/reversal policy, unsupported-token handling, operational monitoring, and recovery messaging. | Product & Engineering |
| ADR-007 | Use Aave as the intended V1 Growth/yield protocol | Confirmed | Medium | 2026-07-20 (updated 2026-08-07) | One protocol limits V1 complexity while supporting a provider-neutral Growth Account. | Morpho; Compound; multiple-provider routing; no Growth at V1 | Validate Base market/contracts, security review, compliance and geography, rate source, deposit/withdrawal behavior, liquidity, user authorization, accounting, reconciliation, failure handling, and production readiness. | Founder, Product & Engineering |
| ADR-008 | Exclude Bridge from the active V1 architecture | Rejected (historical) / **Superseded by ADR-013 for cleanup mandate** | High | 2026-07-20 | Bridge was evaluated and excluded from product architecture. **ADR-013 additionally requires removing remaining Bridge code from the active implementation path.** | Continue with Bridge-centered onramp/off-ramp | Implementation cleanup tracked in BuildPlan Day 1 | Founder |
| ADR-009 | Defer Coinbase Headless as a dedicated fiat-onramp integration | **Superseded by ADR-013** | — | 2026-07-20 | Historical: Coinbase Headless was deferred in favor of Privy Fiat Onramp. **Reversed — Coinbase Headless is now the selected V1 fiat funding provider.** | Select Coinbase Headless at MVP (chosen in ADR-013) | N/A — superseded | Founder, Product & Engineering |
| ADR-010 | Implement provider integrations behind thin abstraction layers | Confirmed | High | 2026-07-20 (updated 2026-08-07) | Keep FundingService + LedgerService + normalized statuses. Do **not** build multi-provider BankTransfer / FiatOnramp adapter layers for a single V1 provider (Coinbase). | Heavy multi-provider adapter matrix; provider logic in screens | Validate interface contracts stay thin; Coinbase-specific code stays in one backend module | Engineering |
| ADR-011 | Treat the backend ledger as the source of truth | Confirmed | High | 2026-07-20 | A server-authoritative ledger enables idempotent credits, consistent balances/activity, reversals, auditability, and provider/blockchain reconciliation. | Wallet balance as UI truth; mobile-computed balances; provider status as direct balance authority | Validate ledger invariants, idempotency constraints, reversal semantics, reconciliation jobs, audit logs, and operational recovery before real-money launch. | Engineering |
| ADR-012 | Keep the Add Funds mobile UI provider-neutral | Confirmed | High | 2026-07-20 (updated 2026-08-07) | Users choose **Add Money** or **Transfer USDC** — not Coinbase, Aave, or other vendor names. | Provider-branded primary method labels | Validate usability; confirm fee/timing disclosures and accessible cancel/return behavior. | Product & Design |
| **ADR-013** | **Coinbase Headless Onramp selected for V1; Bridge and Dakota removed from active architecture** | **Confirmed** | High | **2026-08-07** | Finish MVP in 3–4 days for iOS App Store submission with one fiat funding provider that delivers USDC to the Privy’s embedded wallet on Base. Multi-provider ACH + Privy Fiat Onramp architecture added unnecessary complexity. Bridge remains in legacy API code and must be removed before production funding. Dakota evaluation notes are historical only. | Keep Dakota ACH + Privy Fiat Onramp; keep Bridge; multi-provider funding matrix | Confirm Coinbase Headless React Native / iOS support, session creation, destination wallet (Privy) on Base USDC, KYC/geography, fees, webhooks/callbacks, sandbox + production credentials. Remove Bridge env, routes, schema fields, and provider code. Archive Dakota evaluation. | Founder, Product & Engineering |
| ADR-014 | Defer bank withdrawal / off-ramp from App Store V1 submission | Deferred | High | 2026-08-07 | No off-ramp provider is selected; withdrawal cannot ship in the 3–4 day sprint. | Keep withdrawal as App Store gate; require before public testing | Select provider later; then validate KYC, payout rails, fees, webhooks, returns | Founder |

Future decisions continue sequentially with **ADR-015** and so on.

# Cross-reference Guidance

- Active funding architecture → **ADR-013** and [Architecture.md](./Architecture.md)
- Do **not** cite ADR-004, ADR-005, or ADR-009 as current direction
- Growth Account → **ADR-007**
- Ledger authority → **ADR-011**
- Thin abstractions → **ADR-010**

# Guiding Principles

## Single V1 fiat provider

Coinbase Headless Onramp is the only active V1 fiat funding integration. Do not reintroduce Bridge, Dakota, or a multi-provider bank-transfer matrix into current docs or the sprint plan.

## Thin provider boundaries

Coinbase-specific SDKs, payloads, statuses, and webhooks stay in one backend module. Mobile consumes normalized funding methods and states. Avoid unused abstraction layers.

## Beginner-first UX

Primary labels remain **Add Money** and **Transfer USDC**.

## Hide blockchain complexity

Balances are presented in dollars. Wallet, token, and network mechanics remain hidden except where required for safe **Transfer USDC** instructions.

## Compliance before convenience

KYC, sanctions, fraud, fee, disclosure, chargeback, return, and provider requirements must be validated before optimizing for fewer steps.

## Ledger-first accounting

The backend ledger, not mobile state or an unvalidated provider event, determines displayed balances and activity.

# Future Re-evaluation

Revisit after MVP / App Store submission:

- Bank off-ramp / withdrawal provider
- Additional ACH or onramp providers (only if Coinbase Headless cannot cover a required geography or rail)
- International funding and eligibility
- Gnosis Pay or another card provider
- Additional yield providers
- Additional supported assets or networks

Re-evaluation does not change the active V1 architecture until a new decision is recorded here.

# Decision History

## Original funding architecture (historical)

Early Olimpia planning used a Bridge-centered model for fiat funding and withdrawal. That code still exists in parts of `apps/api` and must be removed under **ADR-013**.

## Provider-separated interim model (historical)

A later model separated Dakota ACH, Privy Fiat Onramp, and Transfer USDC. That model is **superseded**. Dakota and multi-provider Privy Fiat Onramp selection are no longer active V1 architecture.

## Current model (2026-08-07)

- **Add Money** via Coinbase Headless Onramp → USDC to Privy wallet on Base
- **Transfer USDC** via inbound Base USDC to the same Privy wallet
- Backend ledger + Base monitoring
- Optional Aave Growth Account
- Withdrawal deferred

---

When a decision changes, update the existing entry’s status only if its meaning remains the same. For a material reversal, preserve the prior outcome in **Decision History** and add a new dated decision entry.
