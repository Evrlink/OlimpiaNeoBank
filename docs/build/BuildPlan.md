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
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base
  → Balance + transaction activity
  → Grow → withdraw back to wallet
```

Prefer [MVPLaunchChecklist.md](../MVPLaunchChecklist.md) for day-to-day task order. This plan summarizes critical path vs deferred work.

**Post-V1 (preserve):** Coinbase Headless Onramp / Apple Pay. Do not delete; gate rather than remove.

---

## Current codebase baseline (verified)

| Area | Status today |
|------|----------------|
| Marketing (`apps/marketing`) | Live pattern: Vercel + waitlist + GA4 |
| Mobile auth | Privy email OTP, auth sync, session restore — **shipped** |
| Mobile shell | Home, Savings, Card, Profile tabs — **shipped**; Savings/Card/Send/Receive mostly placeholders |
| Mobile Add Money | Coinbase Headless path **implemented** (post-V1; preserve) |
| Mobile Receive | **Coming soon stub** — no address/QR |
| API auth / me / balance / activity | Present under `apps/api/src/routes/v1/` |
| API ledger | `apps/api/src/ledger/` — balances + credit on **deposit finalization** |
| API activity | Reads `transactions` — today only app-created deposit rows |
| Base deposit monitor | **Not implemented** |
| Grow / Aave | UI placeholder only; no adapter |
| App Store packaging | `app.json` minimal; **no** `eas.json`, icons, splash |

Details: [V1Architecture.md](../V1Architecture.md).

---

## Work tiers

### REQUIRED BEFORE APP STORE SUBMISSION

1. Privy embedded wallet reliable on device  
2. Receive USDC screen (address, QR, Base warning, instructions)  
3. Detect inbound USDC + update balance  
4. Transaction activity reflects wallet USDC + wire Home to API  
5. Grow deposit + withdraw (or gate Choose Yield and remove fake APY)  
6. End-to-end verification with **real Base USDC** transfers  
7. Gate / de-emphasize Coinbase Add Money as post-V1  
8. iOS App Store packaging: icons, splash, EAS, privacy questionnaire, support + privacy URLs  
9. Staging / production API with Privy (+ Base monitor credentials as needed)  
10. Legal pages live (Privacy, Terms) and linked  

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
| 1 | Privy embedded wallet working reliably |
| 2 | Receive USDC on Base |
| 3 | Detect and display USDC balance |
| 4 | Display actual wallet transaction activity |
| 5 | Grow / yield flow |
| 6 | Withdraw from Grow back to wallet |
| 7 | Verify complete flow with real Base USDC transfers |

Do not prioritize Coinbase production credentials for V1 launch.

---

## Explicit non-goals for this plan

- Deleting Coinbase Headless modules  
- Reintroducing Bridge or Dakota  
- Shipping fiat offramp  
- Claiming Grow works before Aave deposit/withdraw exist  

---

*End of Build Plan v4.0*
