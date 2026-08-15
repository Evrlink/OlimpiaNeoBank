# Olimpia — V1 Build Plan

**Version:** 4.0  
**Status:** Canonical — aligned to simplified V1 (no fiat on-ramp required)  
**PRD:** [PRD.md](../product/PRD.md)  
**Architecture:** [V1Architecture.md](../V1Architecture.md) · [Architecture.md](../architecture/Architecture.md)  
**Scope:** [V1Scope.md](../product/V1Scope.md)  
**Execution checklist:** [MVPLaunchChecklist.md](../MVPLaunchChecklist.md)  
**Decisions:** [ADR-015](../architecture/ArchitectureDecisionLog.md)

---

## Current MVP Architecture

**Privy + Base + USDC + Grow is the active V1 architecture.**

```text
Privy embedded wallet
  → Receive USDC on Base
  → USDC balance via Privy
  → Real wallet transaction activity via Privy
  → Grow → withdraw back to Privy wallet
```

Prefer [MVPLaunchChecklist.md](../MVPLaunchChecklist.md) for day-to-day task order. This plan summarizes critical path vs deferred work.

**Post-V1 (preserve):** Coinbase Headless Onramp / Apple Pay / fiat offramp. Do not delete; gate rather than remove.

---

## Current codebase baseline (verified)

| Area | Status today |
|------|----------------|
| Marketing (`apps/marketing`) | Live pattern: Vercel + waitlist + GA4 |
| Mobile auth | Privy email OTP, auth sync, session restore — **partial** (device validation pending) |
| Mobile shell | Home, Savings, Card, Profile tabs — **shipped**; Savings/Card/Send/Receive mostly placeholders |
| Mobile Add Money | Coinbase Headless path **implemented** (**post-V1**; preserve) |
| Mobile Receive | **Coming soon stub** — no address/QR |
| API auth / me / ledger balance / activity | Present; balance/activity are **ledger/deposit-based**, not Privy Get Balance / Get Transactions |
| Privy Get Balance / Get Transactions | SDK methods exist in `@privy-io/node` — **not wired**; live smoke not completed |
| Grow / Privy Earn | UI placeholder only; no Earn wiring / no vault_id |
| App Store packaging | `app.json` minimal; **no** `eas.json`, icons, splash |

Details: [V1Architecture.md](../V1Architecture.md).

---

## Work tiers

### REQUIRED BEFORE APP STORE SUBMISSION

1. Set up and validate Privy  
2. Privy embedded wallet reliable on device  
3. Receive USDC screen (address, QR, Base warning, instructions)  
4. USDC balance via Privy  
5. Real wallet transaction activity via Privy  
6. Grow deposit + withdraw (Privy Earn / Aave vault) — or gate Choose Yield and remove fake APY  
7. End-to-end verification with **real Base USDC** transfers  
8. Gate / de-emphasize Coinbase Add Money as post-V1  
9. iOS App Store packaging: icons, splash, EAS, privacy questionnaire, support + privacy URLs  
10. Staging / production API with Privy  
11. Legal pages live (Privacy, Terms) and linked  

### POST-LAUNCH / V1.1+

1. Coinbase Headless production Add Money / Apple Pay  
2. Fiat offramp / bank withdrawal (no provider selected — ADR-014)  
3. Virtual debit card  
4. Functional Pia  
5. Android store submission polish  
6. Savings goals persistence / P2P if cut from submission  

---

## Critical path (engineering priority order)

| Rank | Focus |
|------|--------|
| 1 | Set up and validate Privy |
| 2 | Privy embedded wallet working reliably |
| 3 | Receive USDC on Base |
| 4 | USDC balance via Privy |
| 5 | Real wallet transaction activity via Privy |
| 6 | Grow / yield |
| 7 | Withdraw from Grow back to wallet |
| 8 | Verify complete flow with real Base USDC transfers |

Do not prioritize Coinbase production credentials for V1 launch.

---

## Explicit non-goals for this plan

- Deleting Coinbase Headless modules  
- Reintroducing Bridge or Dakota  
- Shipping fiat onramp/offramp  
- Claiming Privy balance, transactions, or Grow work before they are wired and verified  

---

*End of Build Plan v4.0*
