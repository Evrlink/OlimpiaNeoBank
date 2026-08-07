# Olimpia — Launch Geography Assessment

**Status:** Template — complete during sprint Day 1–2  
**Owner:** Engineering + founder  
**References:** [Architecture.md](./Architecture.md) · [BuildPlan.md](../build/BuildPlan.md) · [ADR-013](./ArchitectureDecisionLog.md)

---

## Summary

**Initial supported countries:** TBD based on Coinbase Headless + Privy coverage and founder launch strategy.

Olimpia does not default to US-only. Geographic scope is driven by provider coverage. Display currency (USD / dollar-denominated USDC) is separate from residency.

---

## Provider restriction matrix

| Provider | Capability | Supported geographies | KYC / compliance notes | Blocks feature when unavailable |
|----------|------------|----------------------|------------------------|----------------------------------|
| **Coinbase Headless Onramp** | Add Money (fiat → USDC) | _TBD_ | Confirm payment methods, KYC, fees, limits, destination wallet on Base | Add Money |
| **Base monitoring / RPC** | Transfer USDC receipt | Base access; provider _TBD_ | Monitoring + sanctions responsibilities | Transfer USDC |
| **Privy** | Auth + embedded wallet | _TBD_ | Restricted geographies | Onboarding |
| **Aave on Base** | Growth | On-chain — confirm sanctions | _TBD_ | Growth |
| Off-ramp (deferred) | Withdraw | N/A until provider selected | — | Withdraw (not in V1) |

**Not in active V1 matrix:** Bridge, Dakota, Gnosis Pay, LI.FI.

---

## Recommended initial launch countries

| Country / region | Add Money | Transfer USDC | Growth | Auth | Notes |
|------------------|-----------|---------------|--------|------|-------|
| _TBD_ | | | | | |

**Founder decision:** Pending before public user testing.

---

## Product gating plan

| Feature | Eligibility flag (proposed) | UX when blocked |
|---------|----------------------------|-----------------|
| Add Money | `eligibility.coinbaseOnramp.available` | Keep Transfer USDC if available |
| Transfer USDC | `eligibility.externalUsdc.available` | Disable only this method |
| Growth | `eligibility.growth.available` | Disable Growth entry |
| Withdraw | N/A for App Store V1 | Do not show |

---

## Sign-off

- [ ] Coinbase Headless geography reviewed
- [ ] Privy restrictions reviewed
- [ ] Initial countries recommended
- [ ] Founder confirmed before public testing

---

*Last updated: 2026-08-07 — Architecture v3.0*
