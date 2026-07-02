# Backend API

**Olimpia** Node.js backend — orchestration, persistence, and provider integrations.

## Phase 0 (current)

- Express server with `GET /health`
- `/api/v1` router stub
- PostgreSQL connection via `DATABASE_URL`
- SQL migrations: `users`, `wallets`, stub `transactions`

**Not connected yet:** Privy, Bridge, Gnosis Pay, Aave, LI.FI, Resend, Anthropic, Base.

## Local development

```bash
# From repo root
npm install

# Configure env (once)
cp apps/api/.env.example apps/api/.env.local
# Edit DATABASE_URL for your PostgreSQL instance

# Run migrations
npm run migrate:api

# Start dev server (port 3001)
npm run dev:api
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:api` | Start API with hot reload |
| `npm run migrate:api` | Apply SQL migrations |
| `npm run build:api` | Compile TypeScript to `dist/` |
| `npm run start:api` | Run compiled server |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness + database status |
| GET | `/api/v1` | API v1 stub |

## Environment

See [`.env.example`](./.env.example). Use `.env.local` locally — never commit secrets.
