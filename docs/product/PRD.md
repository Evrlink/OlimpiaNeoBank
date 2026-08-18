# Olimpia — Product Requirements Document

**Version:** 4.0  
**Status:** Canonical — simplified V1  
**Platform:** React Native / Expo mobile app — **iOS first** for App Store submission  
**Architecture:** [V1Architecture.md](../V1Architecture.md) · [Architecture.md](../architecture/Architecture.md)  
**V1 scope:** [V1Scope.md](./V1Scope.md)  
**Execution:** [MVPLaunchChecklist.md](../MVPLaunchChecklist.md)

---

## Current MVP Architecture

**Privy + Base + USDC + Grow is the active V1 architecture.** Fiat on-ramp / off-ramp are not required for V1.

```text
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base
  → Balance + transaction activity
  → Grow → withdraw back to wallet
```

Funding UI label for V1: **Receive USDC**. Coinbase Headless / Apple Pay **Add Money** is post-V1 (code preserved). Bridge and Dakota are not part of V1. Full design: [V1Architecture.md](../V1Architecture.md) · [ADR-015](../architecture/ArchitectureDecisionLog.md).

---

## 1. Product vision

Olimpia is a women-first financial experience that helps users hold, save, receive, and grow money with confidence. Stablecoin and provider infrastructure remain behind a calm, familiar account experience.

Olimpia is a wrapper and orchestration product. It does not issue a bank account, mint USDC, operate payment networks, hold private keys, or build a yield protocol.

### Product principles

- **Confidence over complexity**
- **Dollars and goals before technical infrastructure**
- **Provider-neutral mobile experience**
- **Clear fees, timing, and status**
- **User authorization before Grow**
- **One useful next action per state**
- **No guaranteed yield or unsupported security claims**
- **Women-first, not women-only**

---

## 2. V1 product outcome

A V1 user can:

1. Sign up and restore a session through Privy.
2. Receive an embedded Privy wallet without managing keys.
3. Fund by receiving USDC on Base (from Coinbase or another compatible wallet).
4. See an authoritative balance and transaction activity.
5. Move eligible Available funds into or out of Grow (Aave on Base).
6. Manage profile and sign out.

**Not in App Store V1:** Coinbase Headless / Apple Pay Add Money, fiat offramp, functional Pia chat, virtual debit card spending. Savings goals and Olimpia-user P2P may ship if schedule allows; they are not the simplified V1 funding gate.

---

## 3. V1 funding method

The canonical V1 funding experience is:

1. **Receive USDC** — user sends supported USDC on Base to their Privy address

### Starting point

| User starting point | Method |
|---------------------|--------|
| Owns USDC in Coinbase or another compatible wallet | Receive USDC |

This delivers supported USDC to the authenticated user’s Privy wallet on Base and produces one validated Olimpia ledger credit (or equivalent verified balance update) plus transaction activity.

### Post-V1 funding

**Add Money** via Coinbase Headless Onramp (bank / debit / Apple Pay) remains implemented in the repository for a later release. Do not delete; gate rather than remove. See [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md).

---

## 4. Add Funds method chooser (post-V1 when Add Money returns)

When fiat Add Money ships (V1.1+), the chooser may present **Add Money** and **Receive USDC**. For V1 launch, prioritize **Receive USDC** as the empty-state path; do not require fiat onramp.

### Conceptual Receive USDC hierarchy (V1)

```text
Receive USDC
Your Olimpia deposit address

[QR code]
0x1234...abcd
[Copy Address]

Base network

Sending from Coinbase?
1. Open Coinbase and choose USDC.
2. Select Send.
3. Paste your Olimpia address.
4. Select Base as the network.
5. Review and send.

Only send supported USDC using the Base network.
```

### Method hierarchy requirements (V1)

- Make **Receive USDC** easy to find from empty Home.
- Do not bury Base / USDC safety warnings.
- Do not show Coinbase, Privy, Aave, or another provider as the primary method label (instructional copy may mention Coinbase as a familiar sending wallet).

---

## 5. Add Money requirements (Coinbase Headless Onramp) — post-V1

Preserved requirements for when fiat funding ships:

- Destination wallet is the authenticated user’s Privy embedded wallet on Base; asset is supported USDC.
- Coinbase supplies the final quote, fee, payment methods, and KYC.
- Do not promise an exact USDC amount before the quote.
- Do not build a hidden background WebView.
- Do not imply Olimpia controls or bypasses Coinbase checkout.
- Spec and sandbox status: [CoinbaseHeadlessIntegration.md](../integrations/CoinbaseHeadlessIntegration.md) · historical ADR-013.

---

## 6. Receive USDC requirements

### Requirements

- Display the authenticated user’s Privy wallet address.
- Provide a QR code and one-tap Copy Address.
- Show **Base network** prominently near the QR code and address.
- Provide beginner-friendly Coinbase instructions.
- Allow other compatible wallets.
- Warn:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

- Keep the transfer pending until backend confirmation policy is met.
- Update balance and transaction activity only through validated backend processing.
- Never credit unsupported assets merely because they reach the address.

---

## 7. Funding status and recovery

Canonical backend states:

- `pending`
- `processing`
- `completed`
- `failed`
- `cancelled`
- `reversed`

Mobile may combine pending and processing. Every method must support:

- Clear processing copy
- Duplicate-submit prevention
- Cancel / close / return where the provider permits it
- Retry or support path on failure
- Explicit activity and balance correction on reversal

---

## 8. Empty-account onboarding

When balance is zero, the primary message is setup — not the number.

```text
Your account is ready
Receive USDC on Base to begin using Olimpia.
[Receive USDC]
```

- `$0.00` may remain visible as secondary information.
- Do not say **start earning immediately**.
- Do not imply automatic enrollment into Grow.
- The primary CTA opens Receive USDC (not fiat Add Money).

---

## 9. Navigation during funding

- Keep normal app navigation available by default.
- Every provider checkout and confirmation has a clear cancel, close, or return path.
- Success returns to Home with refreshed balance / activity.

---

## 10. Copy requirements

### Prefer

- Receive USDC
- Add Funds (generic)
- Add Money (post-V1 label when fiat returns)
- Base network
- Your Olimpia account
- Expected arrival
- Grow
- Transaction activity

### Avoid on beginner-facing screens

- Payment rails
- Liquidity engine
- EVM wallet
- Gas
- Smart wallet
- Onchain settlement
- Automated yield immediately
- High-yield wealth account, unless approved
- Bank-level security, unless legally substantiated
- Provider names as method labels

---

## 11. Authentication and profile

- Privy handles sign-up, sign-in, session, and embedded wallet provisioning.
- Onboarding uses familiar account language.
- Users never manage private keys or seed phrases.
- Profile includes account information, security / session controls, support, notification preferences, and sign out.
- Pia appears only as a static Coming soon preview in V1.

---

## 12. Home, balance, and activity

Home answers: **What should I do next?**

- Available balance
- Savings allocation
- Growth allocation and estimated earnings where real
- Add Funds, Send, Receive
- Recent activity
- Friendly processing and empty states

The backend ledger is authoritative. Activity covers deposits, reversals, sends, receives, goal movements, Growth movements / earnings.

---

## 13. Send and receive

### Send

- Send to another registered Olimpia user using the approved account identifier.
- Enter amount and optional note.
- Review, authorize, and receive a clear status.
- Prevent sends above Available balance.

### Receive from another Olimpia user

- Share approved handle / link / QR.
- Keep this P2P receive flow distinct from **Transfer USDC** funding.
- Update balance and activity through backend processing.

---

## 14. Savings goals

- Create a named goal with target amount and optional date.
- Allocate from Available and move funds back to Available.
- Show progress and goal activity.
- Goals are logical envelopes and do not automatically earn yield.
- Do not put fake APY or automatic-yield copy on goal creation.

---

## 15. Grow

- Aave on Base is the intended V1 yield destination.
- Users see one provider-neutral **Grow** experience (mobile UI may still say Growth / Choose Yield until renamed).
- Grow uses eligible Available funds only.
- Moving funds to Grow requires explicit user authorization.
- Earnings / rates are estimated and variable, never guaranteed.
- Users can withdraw Grow funds back to Available / Privy wallet.
- Provider names do not appear in mobile.

---

## 16. Withdrawal (fiat offramp)

Bank withdrawal / offramp is **deferred** (not required for App Store V1). No provider is selected. Do not implement withdrawal UI as if a provider exists. (Withdraw from **Grow** back to wallet is in V1 scope — see §15.)

---

## 17. V1 navigation

Bottom tabs:

```text
Home · Savings · Card · Profile
```

Stack / overlay flows:

- Receive USDC (V1 funding)
- Add Money (Coinbase Headless — post-V1; preserve)
- Send
- Receive (P2P — may defer)
- Transaction activity / detail
- New goal / goal detail (may defer)
- Grow

Card remains a post-V1 placeholder.

---

## 18. Security and compliance requirements

- Provider secrets stay server-side.
- Verify webhook signatures and blockchain events.
- Use idempotency for all deposit and ledger processing.
- Do not store sensitive card / bank details.
- Coinbase owns Headless Onramp KYC, sanctions, fraud, chargeback, and return responsibilities for that path.
- Apply limits and velocity controls where available.
- Maintain audit logs and reconciliation.
- Disclose fees, timing, network, and asset limitations clearly.
- Do not move funding into Aave before finality, compliance checks, and user authorization.

---

## 19. Success criteria

- Users understand how to fund by receiving USDC on Base.
- Users never need provider or blockchain knowledge except Base / USDC safety instructions.
- Balance and transaction activity never update from unvalidated mobile state.
- Zero-balance onboarding provides one encouraging next step (Receive USDC).
- Savings and Grow remain conceptually separate.
- The experience feels like a calm account product, not a crypto trading app.

---

## 20. Out of V1 (App Store submission)

- Coinbase Headless Onramp / Apple Pay funding (preserve code for V1.1+)
- Fiat USD → USDC conversion
- Fiat offramp / bank withdrawal
- Functional Pia chat
- Functional debit card spending
- Physical card
- Additional networks or assets
- Multi-provider yield routing
- Automatic yield enrollment
- Request money
- Full investment advice
- Bridge.xyz or Dakota funding integrations

---

## 21. Open decisions

- Base monitoring provider and confirmation threshold
- Whether ledger mirrors on-chain wallet balance or credits only confirmed inbound events
- Final account terminology (Grow vs Growth UI labels)
- Whether savings goals / P2P ship before or immediately after App Store submission
- Coinbase Headless production credentials for V1.1+
- Off-ramp provider for a later release

---

*End of PRD v4.0*
