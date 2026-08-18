# Olimpia — Launch Geography Assessment

**Status:** Template — update for simplified V1  
**Owner:** Engineering + founder  
**References:** [V1Architecture.md](../V1Architecture.md) · [Architecture.md](./Architecture.md) · [ADR-015](./ArchitectureDecisionLog.md)

---

## Summary

**Initial supported countries:** TBD based on Privy coverage, Base access, and founder launch strategy. Fiat onramp geography is **not** a V1 launch gate.

Olimpia does not default to US-only. Geographic scope is driven by provider coverage. Display currency (USD / dollar-denominated USDC) is separate from residency.

---

## Provider restriction matrix

| Provider | Capability | Supported geographies | KYC / compliance notes | Blocks feature when unavailable |
|----------|------------|----------------------|------------------------|----------------------------------|
| **Privy** | Auth + embedded wallet | _TBD_ | Restricted geographies | Onboarding |
| **Base monitoring / RPC** | Receive USDC receipt | Base access; provider _TBD_ | Monitoring + sanctions responsibilities | Receive USDC |
| **Aave on Base** | Grow | On-chain — confirm sanctions | _TBD_ | Grow |
| **Coinbase Headless Onramp** | Add Money (fiat → USDC) — **post-V1** | _TBD_ | Confirm payment methods, KYC, fees, limits | Add Money only (not V1) |
| Off-ramp (deferred) | Withdraw | N/A until provider selected | — | Fiat withdraw (not in V1) |

**Not in active V1 matrix:** Bridge, Dakota, Gnosis Pay, LI.FI. Coinbase Headless is preserved but not a V1 dependency.

---

## Recommended initial launch countries

| Country / region | Receive USDC | Grow | Auth | Notes |
|------------------|--------------|------|------|-------|
| _TBD_ | | | | |

**Founder decision:** Pending before public user testing.

---

## Product gating plan

| Feature | Eligibility flag (proposed) | UX when blocked |
|---------|----------------------------|-----------------|
| Receive USDC | `eligibility.externalUsdc.available` (or equivalent) | Clear unavailable messaging |
| Grow | `eligibility.growth.available` | Hide / gate Choose Yield; no fake APY |
| Add Money (post-V1) | `eligibility.onRamp.available` | Keep Receive USDC as funding path |
| Fiat withdraw | N/A for App Store V1 | Do not show |

---

## Sign-off

- [ ] Privy restrictions reviewed
- [ ] Base / Receive USDC path reviewed
- [ ] Initial countries recommended
- [ ] Founder confirmed before public testing
- [ ] Coinbase Headless geography reviewed (post-V1 only)

---

*Last updated: 2026-08-12 — simplified V1 / ADR-015*
