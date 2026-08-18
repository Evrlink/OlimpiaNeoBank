# Olimpia — Architecture Decision Log

**Status:** Active  
**Last Updated:** 2026-08-12  
**Last Reviewed:** 2026-08-12  
**Next Review:** Before App Store submission  
**Purpose:** Single source of truth for major product and architecture decisions.

---

## Current MVP Architecture

**Privy + Base + USDC + Grow is the active V1 architecture.** Fiat on-ramp / off-ramp are not required for V1.

```text
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base
  → Balance + transaction activity
  → Grow → withdraw back to wallet
```

Governing decision: **ADR-015**. ADR-013 remains historical for the Coinbase Headless implementation that is **preserved as post-V1**. Superseded for V1 funding dependency: treating Coinbase Headless as a launch requirement. Bridge remains excluded. Do not implement from superseded ADRs.

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
| ADR-002 | Use supported USDC as the primary V1 asset | Confirmed | High | 2026-07-20 | USDC supports a dollar-denominated experience while allowing funding, transfers, and Grow on Base. | Fiat-only ledger; other stablecoins; multiple assets | Confirm canonical Base USDC contract, decimal handling, provider support, reconciliation, and user disclosures. | Product & Engineering |
| ADR-003 | Use Privy for authentication and embedded wallets | Confirmed | High | 2026-07-20 | Privy provides familiar authentication and embedded wallets without requiring users to manage keys or seed phrases. | Custom authentication and wallet infrastructure; other embedded-wallet providers | Confirm production configuration, session recovery, wallet ownership model, mobile support, security controls, and restricted geographies. | Engineering |
| ADR-004 | Use Dakota as the planned ACH / Bank Transfer provider | **Superseded by ADR-013** | — | 2026-07-20 | Historical: Dakota was evaluated for low-cost bank funding. **No longer active.** | Other ACH providers; delaying bank funding | N/A — superseded | Founder, Product & Engineering |
| ADR-005 | Use Privy Fiat Onramp as the Apple Pay / Card strategy | **Superseded by ADR-013** | — | 2026-07-20 | Historical: Privy’s configurable Fiat Onramp was the interim card strategy. Replaced by Coinbase Headless (then deferred from V1 by ADR-015). | Direct Coinbase; Stripe; other onramp SDKs | N/A — superseded | Product & Engineering |
| ADR-006 | Support direct receipt of existing USDC from another Base wallet | Confirmed | High | 2026-07-20 (updated 2026-08-12) | **V1 funding path** under ADR-015. Users fund by sending USDC on Base into their Privy address. | P2P receive only; Coinbase-only transfer integration; no external wallet funding | Validate backend monitoring provider/RPC, canonical token contract, address ownership, confirmation threshold, duplicate prevention, reorg/reversal policy, unsupported-token handling, operational monitoring, and recovery messaging. | Product & Engineering |
| ADR-007 | Use Aave as the intended V1 Grow/yield protocol | Confirmed | Medium | 2026-07-20 (updated 2026-08-12) | One protocol limits V1 complexity while supporting a provider-neutral Grow experience. | Morpho; Compound; multiple-provider routing; no Grow at V1 | Validate Base market/contracts, security review, compliance and geography, rate source, deposit/withdrawal behavior, liquidity, user authorization, accounting, reconciliation, failure handling, and production readiness. | Founder, Product & Engineering |
| ADR-008 | Exclude Bridge from the active V1 architecture | Rejected (historical) / cleanup completed under ADR-013 | High | 2026-07-20 | Bridge was evaluated and excluded. Remaining Bridge code was removed from the active funding path. | Continue with Bridge-centered onramp/off-ramp | N/A | Founder |
| ADR-009 | Defer Coinbase Headless as a dedicated fiat-onramp integration | **Superseded by ADR-013** (then funding requirement superseded by ADR-015) | — | 2026-07-20 | Historical oscillation on Coinbase Headless timing. | Select Coinbase Headless at MVP | N/A — superseded | Founder, Product & Engineering |
| ADR-010 | Implement provider integrations behind thin abstraction layers | Confirmed | High | 2026-07-20 (updated 2026-08-12) | Keep thin Funding / Ledger boundaries. Coinbase-specific code stays in one backend module for post-V1. | Heavy multi-provider adapter matrix; provider logic in screens | Validate interface contracts stay thin | Engineering |
| ADR-011 | Treat the backend ledger as the source of truth | Confirmed | High | 2026-07-20 | A server-authoritative ledger enables idempotent credits, consistent balances/activity, reversals, auditability, and provider/blockchain reconciliation. | Wallet balance as UI truth; mobile-computed balances; provider status as direct balance authority | Validate ledger invariants, idempotency constraints, reversal semantics, reconciliation jobs, audit logs, and operational recovery before real-money launch. | Engineering |
| ADR-012 | Keep funding mobile UI provider-neutral | Confirmed | High | 2026-07-20 (updated 2026-08-12) | V1 primary label is **Receive USDC**. Post-V1 may reintroduce **Add Money**. Do not use vendor names as method labels. | Provider-branded primary method labels | Validate usability; confirm disclosures and accessible cancel/return behavior. | Product & Design |
| ADR-013 | Coinbase Headless Onramp selected as fiat funding integration; Bridge and Dakota removed | **Superseded for V1 launch dependency by ADR-015** | High | 2026-08-07 | Implemented and sandbox-verified Coinbase Headless path. Still the intended post-V1 fiat Add Money integration. **No longer a V1 launch requirement.** Preserve code. | Keep Dakota ACH + Privy Fiat Onramp; keep Bridge; multi-provider funding matrix | Production credentials deferred to V1.1+ | Founder, Product & Engineering |
| ADR-014 | Defer bank withdrawal / offramp from App Store V1 submission | Deferred | High | 2026-08-07 | No offramp provider is selected. | Keep withdrawal as App Store gate | Select provider later; then validate KYC, payout rails, fees, webhooks, returns | Founder |
| **ADR-015** | **Simplify V1: no fiat on-ramp/off-ramp required; fund via Receive USDC on Base; preserve Coinbase Headless as post-V1** | **Confirmed** | High | **2026-08-12** | Ship a self-custodial USDC experience faster: Privy wallet → receive USDC → balance → Grow → withdraw from Grow. Fiat onramp adds KYC/Apple Pay/credential risk not needed for first launch. | Keep Coinbase Headless as V1 gate (ADR-013); delete Coinbase code | Receive UI + Base monitor + activity wiring + Grow deposit/withdraw; gate Add Money; verify with real Base USDC | Founder, Product & Engineering |

Future decisions continue sequentially with **ADR-016** and so on.

# Cross-reference Guidance

- Active V1 funding architecture → **ADR-015** and [V1Architecture.md](../V1Architecture.md)
- Coinbase Headless implementation (post-V1) → ADR-013 (historical selection) + [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md)
- Do **not** cite ADR-004, ADR-005, or ADR-009 as current direction
- Grow → **ADR-007**
- Ledger authority → **ADR-011**
- Thin abstractions → **ADR-010**

# Guiding Principles

## V1 funding without fiat rails

Receive USDC on Base is the V1 funding path. Do not treat Coinbase Headless, Apple Pay, or offramp as launch blockers.

## Preserve post-V1 Coinbase work

Do not delete Coinbase Headless modules. Prefer feature flag / eligibility / inactive route.

## Thin provider boundaries

Coinbase-specific SDKs, payloads, statuses, and webhooks stay in one backend module. Mobile consumes normalized states.

## Beginner-first UX

Primary V1 funding label: **Receive USDC**. Protocol names stay out of primary UI.

## Hide blockchain complexity

Balances are presented in dollars. Wallet, token, and network mechanics remain hidden except where required for safe Receive USDC instructions.

## Ledger-first accounting

The backend ledger, not mobile state or an unvalidated chain event, determines displayed balances and transaction activity.

# Future Re-evaluation

Revisit after MVP / App Store submission:

- Coinbase Headless production Add Money / Apple Pay (V1.1+)
- Bank offramp / withdrawal provider
- International funding and eligibility
- Gnosis Pay or another card provider
- Additional yield providers
- Additional supported assets or networks

Re-evaluation does not change the active V1 architecture until a new decision is recorded here.

# Decision History

## Original funding architecture (historical)

Early Olimpia planning used a Bridge-centered model for fiat funding and withdrawal. Bridge was removed from the active path under ADR-013.

## Provider-separated interim model (historical)

A later model separated Dakota ACH, Privy Fiat Onramp, and Transfer USDC. That model is **superseded**.

## Coinbase Headless as V1 fiat gate (2026-08-07 → superseded 2026-08-12)

ADR-013 selected Coinbase Headless as the V1 fiat funding provider. Implementation and sandbox E2E completed. **ADR-015** removes fiat onramp as a V1 launch dependency while preserving the code for post-V1.

## Current model (2026-08-12)

- **Receive USDC** via inbound Base USDC to the Privy embedded wallet
- Backend ledger + Base monitoring (monitor still to build)
- Grow via Aave (adapter still to build)
- Coinbase Headless Add Money preserved as post-V1
- Fiat offramp deferred

---

*End of Architecture Decision Log*
