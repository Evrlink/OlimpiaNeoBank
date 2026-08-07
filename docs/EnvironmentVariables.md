# Olimpia — Environment Variables (Planning)

**Status:** Aligned with Architecture v3.0  
**Audience:** Founder, developers, Cursor agents  
**Source of truth:** [Architecture.md](./architecture/Architecture.md) · app `.env.example` files

---

## Rules

1. **Never commit real secrets.** Use `.env.local` locally.
2. **Never put server secrets in the marketing site.** `VITE_*` is public.
3. Use sandbox keys in local and staging until production is approved.
4. **Pia / Anthropic is Future only.**

---

## Marketing (`apps/marketing`)

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `VITE_SUPABASE_URL` | Yes | Waitlist |
| `VITE_SUPABASE_ANON_KEY` | Yes | Waitlist insert (RLS) |
| `VITE_SITE_URL` | Optional | Canonical SEO URL |
| `VITE_SUPPORT_EMAIL` | Optional | Footer / contact |
| GA4 measurement ID | As configured | Production-only analytics |

---

## API (`apps/api`)

### Core

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | `development` / `staging` / `production` |
| `PORT` | Local port (e.g. `3001`) |
| `DATABASE_URL` | PostgreSQL |
| `CORS_ORIGINS` | Allowed origins |
| `API_BASE_URL` | Public API URL (optional) |

### Privy

| Variable | Purpose |
|----------|---------|
| `PRIVY_APP_ID` | App id |
| `PRIVY_APP_SECRET` | Server verification — **secret** |

### Funding — Coinbase Headless Onramp (V1)

| Variable | Purpose |
|----------|---------|
| `FUNDING_PROVIDER` | `mock` (non-production only) or `coinbase` |
| Coinbase Headless API credentials | Exact names **TBD from Coinbase dashboard** — server only |
| Coinbase webhook secret | Verify onramp callbacks — **secret** |

### Base monitoring

| Variable | Purpose |
|----------|---------|
| `BASE_RPC_URL` or indexer credentials | Inbound USDC confirmation |

### Optional V1

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `YIELD_PROVIDER` / `AAVE_*` / shared Base RPC | Growth when shipped |

### Removed from active V1 config

Do **not** configure or document as active:

- `BRIDGE_API_KEY`, `BRIDGE_WEBHOOK_SECRET`, `BRIDGE_API_BASE_URL`
- `FUNDING_PROVIDER=bridge`
- Dakota API keys / webhook secrets
- Gnosis Pay keys (post-V1)
- LI.FI keys unless a specific send path requires them

> Note: Legacy Bridge variables may still appear in `apps/api/.env.example` until Day 1 BuildPlan cleanup removes them from code. Treat them as **dead** — not part of the current architecture.

---

## Mobile (`apps/mobile`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_PRIVY_APP_ID` (or project equivalent) | Public Privy app id |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL |

**Never in mobile bundle:** Coinbase secrets, database URL, Resend, relayer keys, Anthropic.

---

## Related documents

- [BuildPlan.md](./build/BuildPlan.md) — Day 1 env cleanup
- [DeploymentPlan.md](./DeploymentPlan.md)
- [TestingChecklist.md](./TestingChecklist.md)
