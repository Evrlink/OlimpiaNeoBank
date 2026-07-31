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
| **Dakota** | Bank transfer | _TBD_ | Confirm customer/KYC, bank linking, fees, returns | Bank Transfer |
| **Privy + configured provider** | Apple Pay / card onramp | _TBD_ | Confirm payment methods, KYC, fees, limits | Apple Pay or Card |
| **Base monitoring provider/RPC** | External USDC receipt | Base access; provider availability _TBD_ | Confirm monitoring and sanctions responsibilities | Transfer USDC |
| **Off-ramp provider (TBD)** | Withdraw | _TBD_ | Select provider; confirm payout rails and KYC | Withdraw |
| **Gnosis Pay** | Virtual card | _TBD_ | _TBD_ | Card tab (gate with plain copy) |
| **Privy** | Auth | _TBD_ | _TBD_ | Onboarding |
| **LI.FI** | Routing | Generally global — confirm | _TBD_ | Internal only |
| **Aave** | Growth deposits | On-chain — confirm sanctions | _TBD_ | Growth (if blocked) |

---

## Globally accessible layers (minimal geo friction expected)

- **Privy** — auth / wallets
- **Base** — chain settlement
- **LI.FI** — routing
- **Yield layer** — on-chain; regulatory posture for end users TBD

---

## Recommended initial launch countries

| Country / region | Bank transfer | Apple Pay/card | Transfer USDC | Off-ramp | Card | Auth | Notes |
|------------------|---------------|----------------|---------------|----------|------|------|-------|
| _TBD_ | | | | | | | |

**Founder decision:** _Pending — confirm before Phase 9/10._

---

## Product gating plan

| Feature | Eligibility flag (proposed) | UX when blocked |
|---------|----------------------------|-----------------|
| Card | `eligibility.card.available` | Gated Card tab — plain-language copy (UserFlows §13; ScreenInventory A14) |
| Bank Transfer | `eligibility.bankTransfer.available` | Keep other eligible funding methods available |
| Apple Pay or Card | `eligibility.fiatOnramp.available` | Keep other eligible funding methods available |
| Transfer USDC | `eligibility.externalUsdc.available` | Disable only this method with a plain explanation |
| Withdraw | `eligibility.offRamp.available` | Withdraw disabled with explanation |
| Growth | `eligibility.growth.available` | Growth entry disabled if provider blocks jurisdiction |

Eligibility delivery requires a separate API implementation review; Architecture §16 defines the mobile/backend boundary.

---

## Phase 0 sign-off

- [ ] All provider sandboxes/docs reviewed
- [ ] Restriction matrix filled in above
- [ ] Initial supported countries recommended (or explicitly TBD)
- [ ] Founder notified for launch strategy confirmation

---

*Last updated: Phase 0 — TBD*
