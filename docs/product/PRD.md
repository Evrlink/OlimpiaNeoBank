# Olimpia — Product Requirements Document

**Version:** 3.0  
**Status:** Canonical — current V1 build  
**Platform:** React Native / Expo mobile app — **iOS first** for App Store submission  
**Architecture:** [Architecture.md](../architecture/Architecture.md)  
**V1 scope:** [V1Scope.md](./V1Scope.md)  
**Build plan:** [BuildPlan.md](../build/BuildPlan.md)

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

Funding UI labels: **Add Money** (Coinbase Headless) and **Transfer USDC**. Provider names are not method labels. Bridge and Dakota are not part of V1. Full system design: [Architecture.md](../architecture/Architecture.md) · [ADR-013](../architecture/ArchitectureDecisionLog.md).

---

## 1. Product vision

Olimpia is a women-first financial experience that helps users add, hold, save, send, receive, and grow money with confidence. Stablecoin and provider infrastructure remain behind a calm, familiar account experience.

Olimpia is a wrapper and orchestration product. It does not issue a bank account, mint USDC, operate payment networks, hold private keys, or build a yield protocol.

### Product principles

- **Confidence over complexity**
- **Dollars and goals before technical infrastructure**
- **Provider-neutral mobile experience**
- **Clear fees, timing, and status**
- **User authorization before Growth**
- **One useful next action per state**
- **No guaranteed yield or unsupported security claims**
- **Women-first, not women-only**

---

## 2. V1 product outcome

A V1 user can:

1. Sign up and restore a session through Privy.
2. Receive an embedded Privy wallet without managing keys.
3. Add funds through **Add Money** (Coinbase Headless Onramp) and/or **Transfer USDC**.
4. See an authoritative balance and activity history.
5. Create and fund savings goals.
6. Move eligible Available funds into or out of Growth (Aave on Base).
7. Send and receive money between Olimpia users (when included in the sprint critical path).
8. Manage profile and sign out.

**Not in App Store V1:** bank withdrawal / off-ramp, functional Pia chat, virtual debit card spending.

---

## 3. V1 funding methods

The canonical Add Funds experience has exactly **two** primary methods:

1. **Add Money** — Coinbase Headless Onramp delivers USDC to the user’s Privy wallet on Base
2. **Transfer USDC** — user sends supported USDC on Base to their Privy address

These labels describe what the user wants to do. Infrastructure-provider names are not funding-method labels.

### Starting points

| User starting point | Method |
|---------------------|--------|
| Has dollars (bank / debit / Apple Pay) | Add Money |
| Already owns USDC in Coinbase or another compatible wallet | Transfer USDC |

Both methods ultimately deliver supported USDC to the authenticated user’s Privy wallet on Base and produce one validated Olimpia ledger credit.

---

## 4. Add Funds method chooser

### Conceptual wireframe

```text
Add Funds
Choose how you would like to add money.

Add Money
Recommended
Buy USDC with bank, debit card, or Apple Pay
Provider fee shown before confirmation
Identity verification may be required

Transfer USDC
Send USDC from Coinbase or another wallet
Use the Base network
Usually arrives after network confirmation
```

This is an information hierarchy, not final copy or pixel-perfect design.

### Method hierarchy requirements

- Keep **Add Money** first.
- Keep **Transfer USDC** visible; do not bury it.
- Use provider-confirmed fees and arrival estimates from Coinbase where available.
- Do not show Coinbase, Privy, Aave, or another provider as the primary method label.

---

## 5. Add Money requirements (Coinbase Headless Onramp)

### Conceptual hierarchy

```text
Add Money

Amount
[$100.00]

You receive
Estimated USDC amount after provider quote

Provider fee
Shown before confirmation

[Continue]
```

### Requirements

- Use **Coinbase Headless Onramp** as the sole V1 fiat funding integration ([ADR-013](../architecture/ArchitectureDecisionLog.md)).
- Destination wallet is the authenticated user’s Privy embedded wallet on Base; asset is supported USDC.
- Coinbase supplies the final quote, fee, payment methods, and KYC.
- Do not promise an exact USDC amount before the quote.
- Do not build a hidden background WebView.
- Do not imply Olimpia controls or bypasses Coinbase checkout.
- Do not assume an Olimpia markup is allowed on this path.
- Explain that identity verification may be required, particularly on a first transaction.

---

## 6. Transfer USDC requirements

### Conceptual Receive USDC hierarchy

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

### Requirements

- Display the authenticated user’s Privy wallet address.
- Provide a QR code and one-tap Copy Address.
- Show **Base network** prominently near the QR code and address.
- Provide beginner-friendly Coinbase instructions.
- Allow other compatible wallets.
- Warn:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

- Keep the transfer pending until backend confirmation policy is met.
- Update balance and activity only through validated backend processing.
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
Add your first funds to begin using Olimpia.
[Add Funds]
```

- `$0.00` may remain visible as secondary information.
- Do not say **start earning immediately**.
- Do not imply automatic enrollment into Growth.
- The Add Funds CTA opens the same canonical two-method chooser from onboarding and Home.

---

## 9. Navigation during funding

- Keep normal app navigation available by default.
- Every provider checkout and confirmation has a clear cancel, close, or return path.
- Success returns to Home with refreshed balance / activity.

---

## 10. Copy requirements

### Prefer

- Add Funds
- Add Money
- Transfer USDC
- Receive USDC
- Base network
- Your Olimpia account
- Expected arrival
- Provider fee
- Growth Account

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

## 15. Growth Account

- Aave on Base is the V1 yield destination.
- Users see one provider-neutral Growth Account.
- Growth uses eligible Available funds only.
- Moving funds to Growth requires explicit user authorization.
- Earnings / rates are estimated and variable, never guaranteed.
- Users can withdraw Growth funds back to Available.
- Provider names do not appear in mobile.

---

## 16. Withdrawal

Bank withdrawal / off-ramp is **deferred** (not required for App Store V1). No provider is selected. Do not implement withdrawal UI as if a provider exists.

---

## 17. V1 navigation

Bottom tabs:

```text
Home · Savings · Card · Profile
```

Stack / overlay flows:

- Add Funds
- Add Money (Coinbase Headless)
- Transfer USDC / Receive USDC
- Send
- Receive (P2P)
- Transaction detail
- New goal / goal detail
- Growth Account

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

- Users understand which funding method fits what they already have.
- Users can identify cost, expected receipt, and timing before confirmation where Coinbase provides a quote.
- Users never need provider or blockchain knowledge except Base / USDC safety instructions.
- Balance and activity never update from unvalidated mobile state.
- Zero-balance onboarding provides one encouraging next step.
- Savings and Growth remain conceptually separate.
- The experience feels like a calm account product, not a crypto trading app.

---

## 20. Out of V1 (App Store submission)

- Bank withdrawal / off-ramp
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

- Coinbase Headless production credentials, geography, and fee presentation
- Base monitoring provider and confirmation threshold
- Final account terminology
- Whether send / receive ships before or immediately after App Store submission (see BuildPlan tiers)
- Off-ramp provider for a later release

---

*End of PRD v3.0*
