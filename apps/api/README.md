# Backend API

**Olimpia** Node.js / Express backend — orchestration, persistence, and provider integrations.

## Current state

- Express server with `GET /health`
- Privy auth sync / `/me`
- Ledger balances + activity routes
- Funding module present but **legacy Bridge-coupled** — must be removed on BuildPlan Day 1
- SQL migrations including deposits / webhook idempotency

**V1 funding target:** Coinbase Headless Onramp → USDC to user’s Privy wallet on Base.  
**Not in active architecture:** Bridge.xyz, Dakota, off-ramp, Gnosis Pay, Pia/Anthropic.

## Local development

```bash
# From repo root
npm install
cp apps/api/.env.example apps/api/.env.local
# Set DATABASE_URL, PRIVY_*, and (after Day 1) Coinbase credentials — not Bridge

npm run migrate:api
npm run dev:api
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Hot reload (port 3001) |
| `npm run migrate:api` | Apply SQL migrations |
| `npm run build:api` | Compile TypeScript |
| `npm run start:api` | Run compiled server |

## Environment

See [`.env.example`](./.env.example) and [`docs/EnvironmentVariables.md`](../../docs/EnvironmentVariables.md). Until Day 1 cleanup, Bridge vars in `.env.example` are **legacy** — do not use for new work.

Canonical architecture: [`docs/architecture/Architecture.md`](../../docs/architecture/Architecture.md).
