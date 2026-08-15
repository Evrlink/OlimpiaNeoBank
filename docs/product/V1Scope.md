# Olimpia — V1 Launch Scope

**Version:** 4.0  
**Status:** Canonical — simplified V1  
**Architecture:** [V1Architecture.md](../V1Architecture.md) · [Architecture.md](../architecture/Architecture.md)  
**PRD:** [PRD.md](./PRD.md)  
**Execution:** [MVPLaunchChecklist.md](../MVPLaunchChecklist.md)

---

## Current V1 Architecture

**Privy + Base + USDC + Grow is the active V1 architecture.** Fiat on-ramp / off-ramp are **not** required for V1.

```text
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base (from Coinbase or compatible wallet)
  → Balance + transaction activity
  → Grow (yield) → withdraw back to wallet
```

iOS App Store first. Users fund by sending USDC on Base. Coinbase Headless Onramp / Apple Pay / fiat offramp are **post-V1** (code preserved). Bridge and Dakota are not active. Details: [V1Architecture.md](../V1Architecture.md) · [ADR-015](../architecture/ArchitectureDecisionLog.md).

---

## V1 definition

V1 is the first public Olimpia mobile release, **iOS first**, prepared for App Store submission.

```text
Authenticate (Privy)
    → Privy embedded wallet
    → Receive USDC on Base
    → See balance and transaction activity
    → Move USDC into Grow to earn yield
    → Withdraw from Grow back to Privy wallet
```

Balances are presented in dollars. Infrastructure uses Privy embedded wallets and USDC on Base. Provider / protocol names stay out of primary UI labels.

---

## Required V1 capabilities

| Capability | V1 requirement |
|------------|----------------|
| Authentication | Privy email authentication and session restore |
| Embedded wallet | Privy wallet associated automatically with the user |
| Receive USDC | Inbound USDC on Base to Privy address (address, QR, Base warning) |
| Balance | Display USDC balance after receipt (backend-authoritative) |
| Transaction activity | Inbound / outbound wallet USDC activity (not only app deposit rows) |
| Grow | Explicit user-authorized move of USDC into yield; show earnings |
| Withdraw from Grow | Return USDC from Grow to Privy wallet / Available |
| Profile | Account, support, preferences, sign out |
| Pia | Static Coming soon preview only |
| Card | **Post-V1** placeholder only |
| Fiat Add Money | **Post-V1** — Coinbase Headless preserved, not required |
| Fiat withdrawal / offramp | **Post-V1** — deferred |

---

## Canonical funding (V1)

### Receive USDC (required)

- Accept supported USDC on Base only.
- Show authenticated Privy address, QR code, Copy Address, and Base network.
- Include beginner Coinbase instructions and allow compatible wallets.
- Keep pending until validated backend confirmation.
- Credit balance / activity only through idempotent backend processing.

Required warning:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

### Add Money / Coinbase Headless (post-V1)

- Coinbase Headless Onramp (including Apple Pay) is **implemented** in the repo and sandbox-tested historically.
- It is **not** required for V1 launch.
- Preserve API + mobile code for V1.1+; gate via eligibility / inactive route rather than deleting.
- Spec: [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md).

---

## Funding outcome (V1)

Every V1 funding path must:

1. Deliver supported USDC to the user’s Privy wallet on Base.
2. Produce one validated ledger credit (or equivalent verified balance update).
3. Create matching transaction activity.
4. Refresh balance from the backend.
5. Leave funds Available until the user separately authorizes Grow.

No automatic yield enrollment is in scope.

---

## Confirmed infrastructure

| Layer | V1 decision |
|-------|-------------|
| Auth and wallet | Privy embedded wallet |
| Network | Base |
| Asset | USDC on Base |
| Funding | Inbound USDC transfer |
| Fiat Add Money | **Post-V1** (Coinbase Headless preserved) |
| Ledger | Olimpia backend / PostgreSQL |
| Yield destination | Grow via Aave on Base |
| Fiat offramp | Deferred — provider unresolved |
| Mobile priority | **iOS App Store first** |
| Marketing | Existing site on Vercel; GA4 installed |

**Removed from active V1 architecture:** Coinbase Headless as a launch dependency, Bridge.xyz, Dakota, multi-provider bank-transfer matrices.

---

## Launch blockers (App Store submission)

See [MVPLaunchChecklist.md](../MVPLaunchChecklist.md). Critical blockers for simplified V1:

- Privy credentials + config validated; `privy_wallet_id` persisted
- Privy embedded wallet reliable on device
- Receive USDC UI + Base/USDC safety copy
- USDC balance via Privy (not Coinbase onramp credits)
- Transaction activity via Privy
- Grow deposit + withdraw (or clearly gated with no fake APY)
- End-to-end verification with real Base USDC transfers
- App Store packaging: icons, splash, EAS / archive, privacy disclosures, support URL
- Privacy Policy and Terms live and linked

---

## Explicitly out of scope for App Store V1

- Coinbase Headless Onramp / Apple Pay funding
- Fiat USD → USDC conversion
- Fiat offramp / bank withdrawal
- Bridge.xyz or Dakota as funding providers
- Additional networks or assets
- Automatic Grow enrollment
- Multi-provider yield routing
- Functional Pia chat
- Functional card spending
- Physical card
- Custom payment or wallet infrastructure

---

*End of V1 Scope v4.0*
