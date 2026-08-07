# Olimpia — Database Schema (Planning)

**Status:** Aligned with Architecture v3.0  
**Audience:** Founder, developers, Cursor agents  
**Source of truth:** [PRD.md](./product/PRD.md) · [Architecture.md](./architecture/Architecture.md) · [BuildPlan.md](./build/BuildPlan.md)

---

## What this file is for

Plain-English map of what Olimpia stores. Exact SQL types and migrations are owned by `apps/api/migrations/` — review those before inventing parallel schema.

---

## MVP scope reminder

### In App Store V1 (database needed)

- User accounts and Privy wallets
- Balances, transactions, activity
- Deposits via **Coinbase Headless Onramp** and **external USDC on Base**
- Savings goals (logical envelopes)
- Growth allocations (Aave) when Growth ships
- Provider webhook / event idempotency logs
- Marketing waitlist emails (Supabase today)

### Deferred / out of App Store V1

- Withdrawal / off-ramp tables until a provider is selected
- Virtual debit card tables
- Pia message tables
- Bridge-specific columns as the active design (`bridge_intent_id` is legacy — replace in Day 1 cleanup)

---

## Two databases today

| Part | Where | Status |
|------|-------|--------|
| Marketing waitlist | Supabase (`waitlist_emails`) | Live |
| App data | PostgreSQL | Migrations exist under `apps/api/migrations/` |

---

## How balances work

```
Total balance (what the user sees)
├── Available — spend, send, allocate
├── Savings goals — named envelopes
└── Growth account — optional Aave allocation
```

Rules:

- `totalDisplay = available + goalsAllocated + growthAllocated`
- Send uses **Available** only
- Money in a goal or Growth must return to Available first (or clear error)

---

## Entities

### Core identity

| Entity | Key fields |
|--------|------------|
| **User** | `id`, `privy_user_id`, `email`, `phone`, `username`, `display_name`, `created_at` |
| **Wallet** | `id`, `user_id`, `address`, `chain` (= base), `privy_wallet_id` — address not shown except Transfer USDC |

### Money and activity

| Entity | Key fields |
|--------|------------|
| **Transaction** | `id`, `user_id`, `type`, `amount_usd`, `status`, `counterparty_id`, `provider_ref`, `metadata`, `created_at` |
| **Deposit** | `id`, `user_id`, `funding_method`, `provider`, `provider_transaction_id`, `blockchain_transaction_hash`, `destination_wallet_address`, `chain_id`, `asset`, amounts, fees, `status`, failure fields, `confirmed_at`, `credited_at` |
| **Transfer** | P2P when shipped: sender, recipient, amount, note, status |

### Funding field values (current architecture)

- `funding_method`: `coinbase_onramp` · `external_usdc`
- `provider`: `coinbase` · `base_blockchain`
- `status`: `pending` · `processing` · `completed` · `failed` · `cancelled` · `reversed`

### Savings / Growth

| Entity | Notes |
|--------|-------|
| **Goal** / **GoalMovement** | Logical envelopes; no auto yield |
| **GrowthAllocation** | `provider` = `aave` for V1 |

### Infrastructure

| Entity | Notes |
|--------|-------|
| **WebhookEvent** | `provider`, `event_id`, payload, `processed_at` — unique `(provider, event_id)` |

---

## Legacy cleanup (implementation — not active design)

Existing migration `004_deposits_and_webhooks.sql` still defines `bridge_intent_id`. Day 1 BuildPlan work replaces this with a provider-neutral reference. Do not document Bridge as the intended schema.

---

## Activity feed types (V1)

- `deposit`
- `transfer_in` / `transfer_out` (when P2P ships)
- `goal_allocation` / `goal_withdrawal`
- `growth_deposit` / `growth_withdrawal` / `growth_earning`

Deferred: `withdrawal`, `card_spend`

---

## Related documents

- [Architecture.md](./architecture/Architecture.md)
- [EnvironmentVariables.md](./EnvironmentVariables.md)
- [BuildPlan.md](./build/BuildPlan.md)
