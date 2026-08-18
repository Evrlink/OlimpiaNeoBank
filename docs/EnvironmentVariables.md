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

### Funding — Coinbase Headless Onramp (post-V1 optional)

**Not required for V1.** V1 funding is Receive USDC on Base (Privy). Set these only if enabling preserved post-V1 Add Money via `FUNDING_PROVIDER=coinbase`.

| Variable | Purpose |
|----------|---------|
| `FUNDING_PROVIDER` | Unset or `mock` for V1. `coinbase` opts into post-V1 Headless. `bridge` is **rejected**. |
| `COINBASE_ONRAMP_API_KEY` | CDP Secret API Key ID — server only — **post-V1** |
| `COINBASE_ONRAMP_API_SECRET` | CDP Secret API Key secret (PEM EC or base64 Ed25519) — **secret**, **post-V1** |
| `COINBASE_WEBHOOK_SECRET` | CDP webhook subscription secret (`X-Hook0-Signature`) — **secret**, **post-V1** |
| `COINBASE_SANDBOX` | `true` outside production by default. Prefixes `partnerUserRef` with `sandbox-` and appends `useApplePaySandbox=true` |
| `COINBASE_PROJECT_ID` | **Not loaded by the API.** CDP Portal / CLI only — required when creating the webhook subscription (`labels.project`) |

Full Headless contract (docs, endpoints, webhooks, sandbox / production): [integrations/CoinbaseHeadlessIntegration.md](./integrations/CoinbaseHeadlessIntegration.md).

### Base monitoring

| Variable | Purpose |
|----------|---------|
| `BASE_RPC_URL` or indexer credentials | Inbound USDC confirmation |

### Optional V1

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Transactional email |
| `YIELD_PROVIDER` / `AAVE_*` / shared Base RPC | Growth when shipped |

### Removed — not active V1 providers

Bridge and Dakota are **removed** from the active architecture. Do not configure them and do not treat them as upcoming setup.

Do **not** set:

- `BRIDGE_API_KEY`, `BRIDGE_WEBHOOK_SECRET`, `BRIDGE_API_BASE_URL`
- `FUNDING_PROVIDER=bridge` (API startup **rejects** this value)
- Dakota API keys / webhook secrets
- Gnosis Pay keys (post-V1)
- LI.FI keys unless a specific send path requires them

---

## Mobile (`apps/mobile`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_PRIVY_APP_ID` (or project equivalent) | Public Privy app id |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL |

**Never in mobile bundle:** Coinbase secrets, database URL, Resend, relayer keys, Anthropic.

---

## Related documents

- [BuildPlan.md](./build/BuildPlan.md)
- [DeploymentPlan.md](./DeploymentPlan.md)
- [TestingChecklist.md](./TestingChecklist.md)
