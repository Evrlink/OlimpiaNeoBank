# Olimpia — Launch Geography Assessment

**Status:** Template — complete during BuildPlan Phase 0  
**Owner:** Engineering + founder  
**References:** [Architecture.md §4A](./Architecture.md) · [BuildPlan.md Phase 0](../build/BuildPlan.md)

---

## Summary

**Initial supported countries:** TBD based on provider capabilities and launch strategy.

Olimpia does not default to US-only. Geographic scope is driven by provider coverage and founder launch strategy. Display currency (USD / dollar-denominated USDC) is separate from user residency / service geography.

---

## Provider restriction matrix

Complete during Phase 0 by reviewing each provider's sandbox, API docs, and compliance materials.

| Provider | Capability | Supported geographies (document findings) | KYC / compliance notes | Blocks feature when unavailable |
|----------|------------|-------------------------------------------|------------------------|----------------------------------|
| **BridgeXYZ** | On-ramp | _TBD_ | _TBD_ | Add money |
| **BridgeXYZ** | Off-ramp | _TBD_ | _TBD_ | Withdraw |
| **Gnosis Pay** | Virtual card | _TBD_ | _TBD_ | Card tab (gate with plain copy) |
| **Privy** | Auth | _TBD_ | _TBD_ | Onboarding |
| **LI.FI** | Routing | Generally global — confirm | _TBD_ | Internal only |
| **Yield (Aave/Morpho/Compound)** | Growth deposits | On-chain — confirm sanctions | _TBD_ | Growth (if blocked) |

---

## Globally accessible layers (minimal geo friction expected)

- **Privy** — auth / wallets
- **Base** — chain settlement
- **LI.FI** — routing
- **Yield layer** — on-chain; regulatory posture for end users TBD

---

## Recommended initial launch countries

| Country / region | On-ramp | Off-ramp | Card | Auth | Notes |
|------------------|---------|----------|------|------|-------|
| _TBD_ | | | | | |

**Founder decision:** _Pending — confirm before Phase 9/10._

---

## Product gating plan

| Feature | Eligibility flag (proposed) | UX when blocked |
|---------|----------------------------|-----------------|
| Card | `eligibility.card.available` | Gated Card tab — plain-language copy (UserFlows §13; ScreenInventory A14) |
| Add money | `eligibility.onRamp.available` | Fund action disabled with explanation |
| Withdraw | `eligibility.offRamp.available` | Withdraw disabled with explanation |
| Growth | `eligibility.growth.available` | Growth entry disabled if provider blocks jurisdiction |

Backend: extend `GET /me` or add `GET /config/eligibility` per Architecture §4A.

---

## Phase 0 sign-off

- [ ] All provider sandboxes/docs reviewed
- [ ] Restriction matrix filled in above
- [ ] Initial supported countries recommended (or explicitly TBD)
- [ ] Founder notified for launch strategy confirmation

---

*Last updated: Phase 0 — TBD*
