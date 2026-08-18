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
- **V1 deposits:** inbound **USDC on Base** to the Privy wallet (Receive USDC)
- Savings goals (logical envelopes)
- Growth allocations (Aave / Privy Earn) when Grow ships
- Provider webhook / event idempotency logs (including post-V1 Coinbase events if that path is enabled later)
- Marketing waitlist emails (Supabase today)

### Deferred / out of App Store V1

- Withdrawal / off-ramp tables until a provider is selected
- Virtual debit card tables
- Pia message tables
- Coinbase Headless deposit rows as a **V1 requirement** (schema may still store post-V1 `coinbase` deposits; not a launch dependency)
- Bridge — **removed**. Do not add Bridge columns or treat Bridge as upcoming work.

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
| **Wallet** | `id`, `user_id`, `address`, `chain` (= base), `privy_wallet_id` — address not shown except Receive USDC |

### Money and activity

| Entity | Key fields |
|--------|------------|
| **Transaction** | `id`, `user_id`, `type`, `amount_usd`, `status`, `counterparty_id`, `provider_ref`, `metadata`, `created_at` |
| **Deposit** | `id`, `user_id`, `funding_method`, `provider`, `provider_transaction_id`, `blockchain_transaction_hash`, `destination_wallet_address`, `chain_id`, `asset`, amounts, fees, `status`, failure fields, `confirmed_at`, `credited_at` |
| **Transfer** | P2P when shipped: sender, recipient, amount, note, status |

### Funding field values

- V1 inbound USDC: `funding_method` = `external_usdc`, `provider` = `base_blockchain`
- Post-V1 Add Money (optional, not required): `funding_method` = `coinbase_onramp`, `provider` = `coinbase`
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

## Legacy Bridge column (removed — not upcoming work)

Historical migration `004_deposits_and_webhooks.sql` created `deposits.bridge_intent_id`. Migration `005_rename_bridge_intent_to_provider_transaction.sql` already renamed it to `provider_transaction_id`. **Do not alter 004 or 005.** Bridge is not an active provider and is not a Day 1 cleanup task.

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
