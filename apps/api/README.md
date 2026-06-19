# Backend API

**Olimpia** Node.js backend — orchestration, persistence, and provider integrations.

## What belongs here

- REST API (`/api/v1`) and health endpoints
- Privy auth verification middleware
- Provider clients: BridgeXYZ, Gnosis Pay, LI.FI, yield layer, Resend, Anthropic (Pia)
- Webhook handlers and idempotent event processing
- PostgreSQL migrations, ledger, and transaction state normalization
- Environment and secrets configuration (`.env.example` only in repo — never commit secrets)

## Out of scope

- Mobile or marketing UI — see `apps/mobile/` and `apps/marketing/`
- Shared types — see `packages/types/` (imported by API)
- Product requirements — see `docs/product/` and `docs/architecture/`

## Status

Folder scaffold only — no dependencies or server code yet.
