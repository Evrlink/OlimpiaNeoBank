# Olimpia — Product Requirements Document

**Version:** 2.0
**Status:** Draft for founder review
**Platform:** React Native mobile app for iOS and Android
**Architecture:** [Architecture.md](../architecture/Architecture.md)
**V1 scope:** [V1Scope.md](./V1Scope.md)
**Build plan:** [BuildPlan.md](../build/BuildPlan.md)

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
3. Add funds through one of three methods.
4. See an authoritative balance and activity history.
5. Send and receive money.
6. Create and fund savings goals.
7. Move eligible Available funds into or out of Growth.
8. Withdraw Available funds to a bank after an off-ramp provider is selected.
9. Manage profile and sign out.

Pia remains a static **Coming soon** preview. Card spending remains post-V1.

---

## 3. V1 funding methods

The canonical Add Funds experience has exactly three primary methods, in this order:

1. **Bank Transfer**
2. **Apple Pay or Card**
3. **Transfer USDC**

These labels describe what the user has and how she wants to fund the account. Infrastructure-provider names are not funding-method labels.

### Starting points

| User starting point | Method |
|---------------------|--------|
| Has dollars in a bank account | Bank Transfer |
| Wants to buy USDC quickly | Apple Pay or Card |
| Already owns USDC in Coinbase or another compatible wallet | Transfer USDC |

All three methods ultimately deliver supported USDC to the authenticated user's Privy wallet on Base and produce one validated Olimpia ledger credit.

---

## 4. Add Funds method chooser

### Conceptual wireframe

```text
Add Funds
Choose how you would like to add money.

Bank Transfer
Recommended
Best for larger deposits
Expected arrival: provider-confirmed estimate
$1 total transfer fee (after approval)

Apple Pay or Card
Fastest option
Provider fee shown before confirmation
Identity verification may be required

Transfer USDC
Send USDC from Coinbase or another wallet
Use the Base network
Usually arrives after network confirmation
```

This is an information hierarchy, not final copy or pixel-perfect design. Spacing, icons, borders, colors, and component treatment require design review.

### Method hierarchy requirements

- Keep the order fixed.
- Mark Bank Transfer **Recommended** only when confirmed as the lowest-cost or most suitable option for regular/larger deposits.
- Emphasize relative speed for Apple Pay/card without promising an exact time.
- Keep Transfer USDC visible; do not bury it.
- Use provider-confirmed fees and arrival estimates. Do not hardcode the conceptual 1–2 business-day example.
- Do not show Dakota, Privy, Coinbase Headless, Stripe, or another provider as the primary method label.

---

## 5. Bank Transfer requirements

### Conceptual amount/review hierarchy

```text
Add money from your bank

Amount
[$100.00]

From
Connected bank account

To
Your Olimpia account

Summary
Deposit amount
Olimpia transfer fee
Total bank withdrawal
Exact amount your Olimpia account receives
Expected arrival

[Review Transfer]
```

### Requirements

- Show the complete amount withdrawn from the bank.
- Show the exact amount credited to the Olimpia account.
- Disclose the intended $1 fee before confirmation, after commercial/compliance approval.
- Show provider-confirmed expected arrival.
- Use **Your Olimpia account** or another approved account name.
- Do not use **High-Yield Wealth Account** unless legal and product terminology is approved.
- Use **Review Transfer** or **Review & Continue** because the transfer is not complete.
- Do not promise that funds begin earning immediately.
- Explain that funds become eligible for Growth only after settlement, compliance checks, and required user authorization.

### Pricing assumption

Dakota has indicated an approximate $0.25 transaction cost. Olimpia intends to charge a $1 total bank-transfer fee, producing an intended $0.75 gross margin before other costs.

This is not finalized or compliance-approved. It requires Dakota markup permission plus legal, compliance, and disclosure review.

---

## 6. Apple Pay or Card requirements

### Conceptual hierarchy

```text
Add funds instantly

Amount
[$100.00]

Payment method
Apple Pay or Card

You receive
Estimated USDC amount after provider quote

Provider fee
Shown before confirmation

[Continue]
```

### Requirements

- Use Privy's supported Fiat Onramp experience for MVP unless technical validation shows it cannot satisfy requirements.
- The configured provider supplies the final quote and fee.
- Do not promise an exact USDC amount before the quote.
- Apple Pay and debit card are intended.
- Show credit card only if supported and approved.
- Explain that identity verification may be required, particularly on a first transaction.
- Do not promise every later transaction requires only one biometric click.
- Do not build a hidden background WebView.
- Do not imply Olimpia controls or bypasses provider checkout.
- Provider fees may vary by provider, payment method, geography, amount, and percentage schedule.
- Do not assume an Olimpia markup is allowed.
- Do not apply the $1 Bank Transfer fee to this method without separate validation.

---

## 7. Transfer USDC requirements

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

- Display the authenticated user's Privy wallet address.
- Provide a QR code and one-tap Copy Address.
- Show **Base network** prominently near the QR code and address.
- Provide beginner-friendly Coinbase instructions.
- Allow other compatible wallets.
- Warn:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

- Do not promise arrival within three to five seconds.
- Keep the transfer pending until backend confirmation policy is met.
- Update balance and activity only through validated backend processing.
- Never credit unsupported assets merely because they reach the address.

---

## 8. Funding status and recovery

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
- Cancel/close/return where the provider permits it
- Retry or support path on failure
- Explicit activity and balance correction on reversal

---

## 9. Empty-account onboarding

When balance is zero, the primary message is setup—not the number.

### Conceptual hierarchy

```text
Your account is ready
Add your first funds to begin using Olimpia.
[Add Funds]
```

- `$0.00` may remain visible as secondary information.
- Do not make zero balance the only dominant message.
- Do not say **start earning immediately**.
- Do not imply automatic enrollment into Growth.
- The Add Funds CTA opens the same canonical three-method chooser from onboarding and Home.

---

## 10. Navigation during funding

- Keep normal app navigation available by default.
- User testing may support reducing distractions during provider checkout or confirmation.
- A focused state must not make users feel trapped.
- Every provider checkout and confirmation has a clear cancel, close, or return path.
- Success returns to Home with refreshed balance/activity.

---

## 11. Copy requirements

### Prefer

- Add Funds
- Bank Transfer
- Apple Pay or Card
- Transfer USDC
- Receive USDC
- Base network
- Your Olimpia account
- Review Transfer
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

## 12. Authentication and profile

- Privy handles sign-up, sign-in, session, and embedded wallet provisioning.
- Onboarding uses familiar account language.
- Users never manage private keys or seed phrases.
- Profile includes account information, security/session controls, support, notification preferences, and sign out.
- Pia appears only as a static Coming soon preview in V1.

---

## 13. Home, balance, and activity

Home answers: **What should I do next?**

- Available balance
- Savings allocation
- Growth allocation and estimated earnings where real
- Add Funds, Send, Receive
- Recent activity
- Friendly processing and empty states

The backend ledger is authoritative. Activity covers deposits, reversals, sends, receives, goal movements, Growth movements/earnings, and withdrawals.

---

## 14. Send and receive

### Send

- Send to another registered Olimpia user using the approved account identifier.
- Enter amount and optional note.
- Review, authorize, and receive a clear status.
- Prevent sends above Available balance.

### Receive from another Olimpia user

- Share approved handle/link/QR.
- Keep this P2P receive flow distinct from **Receive USDC** funding.
- Update balance and activity through backend processing.

---

## 15. Savings goals

- Create a named goal with target amount and optional date.
- Allocate from Available and move funds back to Available.
- Show progress and goal activity.
- Goals are logical envelopes and do not automatically earn yield.
- Do not put fake APY or automatic-yield copy on goal creation.

---

## 16. Growth Account

- Aave on Base is the intended future yield destination.
- Users see one provider-neutral Growth Account.
- Growth uses eligible Available funds only.
- Moving funds to Growth requires explicit user authorization.
- Earnings/rates are estimated and variable, never guaranteed.
- Users can withdraw Growth funds back to Available.
- Provider names do not appear in mobile.

---

## 17. Withdrawal

Withdrawal to a linked bank remains a V1 requirement.

- Provider is unresolved.
- Withdraw from Available only.
- Use provider-neutral UX and normalized statuses.
- Validate fees, timing, KYC, destinations, returns, and reversals before release.

---

## 18. V1 navigation

Bottom tabs:

```text
Home · Savings · Card · Profile
```

Stack/overlay flows:

- Add Funds
- Send
- Receive
- Receive USDC
- Transaction detail
- New goal / goal detail
- Growth Account
- Withdrawal

Card may remain a post-V1 placeholder.

---

## 19. Security and compliance requirements

- Provider secrets stay server-side.
- Verify webhook signatures and blockchain events.
- Use idempotency for all deposit and ledger processing.
- Do not store sensitive card/bank details unless explicitly required and approved.
- Assign provider KYC, sanctions, fraud, chargeback, and return responsibilities.
- Apply limits and velocity controls.
- Maintain audit logs and reconciliation.
- Disclose fees, timing, network, and asset limitations clearly.
- Do not move funding into Aave before finality, compliance checks, and user authorization.

---

## 20. Success criteria

- Users understand which funding method fits what they already have.
- Users can identify total cost, expected receipt, and timing before confirmation.
- Users never need provider or blockchain knowledge except Base/USDC safety instructions.
- Balance and activity never update from unvalidated mobile state.
- Zero-balance onboarding provides one encouraging next step.
- Savings and Growth remain conceptually separate.
- The experience feels like a calm account product, not a crypto trading app.

---

## 21. Out of V1

- Functional Pia chat
- Functional debit card spending
- Physical card
- Additional networks or assets
- Multi-provider yield routing
- Automatic yield enrollment
- Request money
- Full investment advice

---

## 22. Open decisions

- Dakota KYC, linking, conversion, settlement, webhook, return, and markup capabilities
- Initial configured Privy Fiat Onramp provider
- Fiat-onramp mobile/KYC/fee/callback behavior
- Base monitoring provider and confirmation threshold
- Withdrawal provider
- Final account terminology
- Final arrival copy and fee approvals
- Whether user testing supports focused funding navigation

---

*End of PRD v2.0*
