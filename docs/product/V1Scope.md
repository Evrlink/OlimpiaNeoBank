# Olimpia — V1 Launch Scope

**Version:** 3.0  
**Status:** Canonical — current V1 build  
**Architecture:** [Architecture.md](../architecture/Architecture.md)  
**PRD:** [PRD.md](./PRD.md)  
**Build plan:** [BuildPlan.md](../build/BuildPlan.md)

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

iOS App Store first. Add Funds = **Add Money** + **Transfer USDC**. Withdrawal deferred. Bridge and Dakota are not active. Details: [Architecture.md](../architecture/Architecture.md) · [ADR-013](../architecture/ArchitectureDecisionLog.md).

---

## V1 definition

V1 is the first public Olimpia mobile release, **iOS first**, prepared for App Store submission.

```text
Authenticate (Privy)
    → Privy embedded wallet
    → Add Money (Coinbase Headless) and/or Transfer USDC
    → See balance and activity
    → Save in goals
    → Optional Growth (Aave on Base)
    → Send / receive (tiered — see BuildPlan)
```

Balances are presented in dollars. Infrastructure uses Privy wallets, supported USDC on Base, and Coinbase Headless Onramp. Provider names stay out of primary funding labels.

---

## Required V1 capabilities

| Capability | V1 requirement |
|------------|----------------|
| Authentication | Privy email authentication and session restore |
| Embedded wallet | Privy wallet associated automatically with the user |
| Add Money | Coinbase Headless Onramp → USDC to Privy wallet on Base |
| Transfer USDC | Inbound supported USDC on Base to Privy address |
| Balance | Backend-ledger Available, Savings, Growth, and total display |
| Activity | Deposits, reversals, P2P (when shipped), goal / Growth movements |
| Savings goals | Create, allocate, remove, track progress |
| Growth | Explicit user-authorized movement to Aave on Base |
| Send / receive | Registered Olimpia-user P2P (see BuildPlan tiering) |
| Profile | Account, support, preferences, sign out |
| Pia | Static Coming soon preview only |
| Withdrawal | **Deferred** — not required for App Store V1 |
| Card | **Post-V1** placeholder only |

---

## Canonical Add Funds scope

### 1. Add Money (Coinbase Headless Onramp)

- Sole V1 fiat funding provider ([ADR-013](../architecture/ArchitectureDecisionLog.md)).
- Coinbase delivers USDC to the user’s Privy embedded wallet on Base.
- Payment methods are those Coinbase Headless supports for the user (typically bank / debit / Apple Pay).
- Provider supplies final quote, fee, KYC, and checkout.
- No hidden background WebView.
- No exact USDC promise before quote.
- No assumption that Olimpia may add a fee.

### 2. Transfer USDC

- Accept supported USDC on Base only.
- Show authenticated Privy address, QR code, Copy Address, and Base network.
- Include beginner Coinbase instructions and allow compatible wallets.
- Keep pending until validated backend confirmation.
- Credit balance / activity only through idempotent backend processing.

Required warning:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

---

## Funding outcome

Every Add Funds method must:

1. Deliver supported USDC to the user’s Privy wallet on Base.
2. Produce one validated ledger credit.
3. Create matching activity.
4. Refresh balance from the backend.
5. Leave funds Available until the user separately authorizes Growth.

No automatic yield enrollment is in scope.

---

## User experience requirements

- Explain methods by user starting point, cost, and speed.
- Do not use infrastructure provider names as method labels.
- Keep Transfer USDC easy to find.
- Arrival times and fees come from Coinbase or network confirmation reality — do not hardcode unverified claims.
- Every provider / confirmation step has cancel, close, or return.
- Conceptual wireframes in PRD are not final visual designs.

### Empty account

```text
Your account is ready
Add your first funds to begin using Olimpia.
[Add Funds]
```

`$0.00` remains secondary. Do not claim that funding starts earning immediately.

---

## Confirmed infrastructure

| Layer | V1 decision |
|-------|-------------|
| Auth and wallet | Privy |
| Network | Base |
| Asset | Supported USDC on Base |
| Fiat Add Money | **Coinbase Headless Onramp** |
| External USDC | Coinbase or another compatible Base wallet |
| Ledger | Olimpia backend / PostgreSQL |
| Yield destination | Aave on Base |
| Withdrawal | Deferred — provider unresolved |
| Mobile priority | **iOS App Store first** |
| Marketing | Existing site on Vercel; GA4 installed |

**Removed from active V1 architecture:** Bridge.xyz, Dakota, Bridge-specific deposit / withdrawal / webhook design, multi-provider bank-transfer + Privy Fiat Onramp selection matrix.

---

## Required normalized statuses

`pending` · `processing` · `completed` · `failed` · `cancelled` · `reversed`

Mobile may combine pending and processing. Raw provider statuses never define the UI.

---

## Launch blockers (App Store submission)

See [BuildPlan.md](../build/BuildPlan.md) for the full tier split. Critical blockers:

- Remove Bridge funding code, env vars, webhook route, and schema coupling from the active path
- Coinbase Headless Onramp integrated and sandbox-tested on iOS
- Base USDC monitor and confirmation policy for Transfer USDC (and onramp delivery confirmation)
- Idempotent ledger credit verified
- App Store packaging: icons, splash, EAS / archive, privacy disclosures, support URL
- Privacy Policy and Terms live and linked

---

## Explicitly out of scope for App Store V1

- Bridge.xyz or Dakota as funding providers
- Bank withdrawal / off-ramp
- Additional networks or assets
- Automatic Growth enrollment
- Multi-provider yield routing
- Functional Pia chat
- Functional card spending
- Physical card
- Custom payment or wallet infrastructure

---

*End of V1 Scope v3.0*
