# Olimpia — V1 Launch Scope

**Version:** 2.0
**Status:** Draft for founder review
**Architecture:** [Architecture.md](../architecture/Architecture.md)
**PRD:** [PRD.md](./PRD.md)
**Build plan:** [BuildPlan.md](../build/BuildPlan.md)

---

## V1 definition

V1 is the first public Olimpia mobile release for iOS and Android.

```text
Authenticate
    → Add Funds
    → See balance and activity
    → Save in goals
    → Send and receive
    → Choose Growth
    → Withdraw
```

Balances are presented in dollars. The infrastructure uses Privy wallets, supported USDC, and Base. Provider names stay out of primary funding labels.

---

## Required V1 capabilities

| Capability | V1 requirement |
|------------|----------------|
| Authentication | Privy email authentication and session restore |
| Embedded wallet | Privy wallet associated automatically with the user |
| Add Funds | Bank Transfer, Apple Pay or Card, Transfer USDC |
| Balance | Backend-ledger Available, Savings, Growth, and total display |
| Activity | Deposits, reversals, P2P, goal/ growth movements, withdrawals |
| Send/receive | Registered Olimpia-user P2P |
| Savings goals | Create, allocate, remove, track progress |
| Growth | Explicit user-authorized movement to intended Aave strategy |
| Withdrawal | Bank off-ramp; provider selection required |
| Profile | Account, support, preferences, sign out |
| Pia | Static Coming soon preview only |

Functional card spending and live Pia chat are post-V1.

---

## Canonical Add Funds scope

The V1 method order is:

1. **Bank Transfer**
2. **Apple Pay or Card**
3. **Transfer USDC**

### Bank Transfer

- Current backend provider: Dakota ACH.
- Provider remains replaceable.
- Show total bank withdrawal, exact account credit, fee, and provider-confirmed expected arrival before confirmation.
- Intended fee: $1 total, pending Dakota, legal, compliance, and disclosure approval.
- CTA: **Review Transfer** or **Review & Continue**.

### Apple Pay or Card

- Use Privy Fiat Onramp with a configurable provider.
- Intended payment methods: Apple Pay and debit card.
- Credit card only when supported and approved.
- Provider supplies final quote, fee, KYC, and checkout.
- No hidden background WebView.
- No exact USDC promise before quote.
- No assumption that Olimpia may add a fee.

### Transfer USDC

- Accept supported USDC on Base only.
- Show authenticated Privy address, QR code, Copy Address, and Base network.
- Include beginner Coinbase instructions and allow compatible wallets.
- Keep pending until validated backend confirmation.
- Credit balance/activity only through idempotent backend processing.

Required warning:

> Transfers sent using an unsupported asset or network may not appear in Olimpia and may be difficult or impossible to recover.

---

## Funding outcome

Every Add Funds method must:

1. Deliver supported USDC to the user's Privy wallet on Base.
2. Produce one validated ledger credit.
3. Create matching activity.
4. Refresh balance from the backend.
5. Leave funds Available until the user separately authorizes Growth.

No automatic yield enrollment is in scope.

---

## User experience requirements

- Explain methods by user starting point, cost, and speed.
- Do not use infrastructure provider names as method labels.
- Bank Transfer is Recommended only when confirmed as suitable/lower cost.
- Transfer USDC remains easy to find.
- Arrival times come from confirmed provider information.
- Apple Pay/card fee is not assumed to be $1.
- Keep normal app navigation unless testing validates focus mode.
- Every provider/confirmation step has cancel, close, or return.
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
| Bank funding | Dakota ACH behind an adapter |
| Apple Pay/card | Privy Fiat Onramp, provider configurable |
| External USDC | Coinbase or another compatible Base wallet |
| Ledger | Olimpia backend/database |
| Yield destination | Aave intended, subject to validation |
| Withdrawal | Provider unresolved |

---

## Required normalized statuses

`pending` · `processing` · `completed` · `failed` · `cancelled` · `reversed`

Mobile may combine pending and processing. Raw provider statuses never define the UI.

---

## Launch blockers

- Dakota capability and commercial validation
- Approved $1 fee disclosure
- Configured fiat-onramp provider selected and tested
- Apple Pay/card/KYC/fee behavior validated
- Base USDC monitor and confirmation policy implemented
- Idempotent ledger credit and reconciliation verified
- Deposit schema reviewed and migrated in a separate implementation task
- Withdrawal provider selected and validated
- Security/compliance ownership approved
- All funding paths tested on iOS and Android

---

## Explicitly out of scope

- Additional networks or assets
- Automatic Growth enrollment
- Multi-provider yield routing
- Functional Pia chat
- Functional card spending
- Physical card
- Custom payment or wallet infrastructure

---

*End of V1 Scope v2.0*
