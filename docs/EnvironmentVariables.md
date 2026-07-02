# Olimpia — Environment Variables (Planning)

**Status:** Planning document for implementation  
**Audience:** Founder, developers, Cursor agents  
**Source of truth:** [Architecture.md](./architecture/Architecture.md) · [apps/marketing/.env.example](../apps/marketing/.env.example)

---

## What this file is for

Environment variables are **configuration values** your apps read at startup — things like API keys, database URLs, and public site settings. This document lists what each Olimpia app needs, what each value does, and what must **never** be committed to GitHub.

**This is not app code.** Use it when creating `.env.example` files and when setting up Vercel, Supabase, or your API host.

---

## Rules (read this first)

1. **Never commit real secrets.** Use `.env.local` locally. Add `.env.local` to `.gitignore` (already done for marketing).
2. **Never put server secrets in the marketing site.** Anything starting with `VITE_` is visible in the browser.
3. **Use sandbox keys** in local and staging until you are ready for production.
4. If a value is unknown, leave it as **TBD** — do not guess production URLs or keys.
5. **Pia / Anthropic is Future only** — no `ANTHROPIC_API_KEY` required for MVP backend.

---

## By application (overview)

| App | Config file | Status today |
|-----|-------------|--------------|
| **Marketing** (`apps/marketing`) | `.env.local` copied from [.env.example](../apps/marketing/.env.example) | **Partially live** (waitlist) |
| **API** (`apps/api`) | `.env` / `.env.example` | **Not created yet** — Phase 0 |
| **Mobile** (`apps/mobile`) | `.env` or Expo public vars | **Not created yet** — Phase 2 |

---

## Marketing website (MVP — live today)

These power the public site and waitlist. All `VITE_*` variables are **public** (bundled into the browser).

| Variable | Required? | What it does | Where to get it |
|----------|-----------|--------------|-----------------|
| `VITE_SUPABASE_URL` | **Yes** | Supabase project URL for waitlist inserts | Supabase Dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | **Yes** | Anonymous key — insert-only via RLS | Same as above |
| `VITE_SITE_URL` | Optional | Canonical site URL for SEO (sitemap, meta) | Your domain, e.g. `https://olimpia.app` **TBD** |
| `VITE_SUPPORT_EMAIL` | Optional | Footer and contact links | e.g. `hello@olimpia.app` **TBD** |

**Not needed on marketing for MVP:**

- Privy, Bridge, Gnosis, Aave, Anthropic — mobile/API only
- `DATABASE_URL` for main app — marketing waitlist uses Supabase directly today

**Where to set in production:** Vercel → Project → Settings → Environment Variables (Production + Preview).

---

## API backend (MVP — planned Phase 0+)

Create `apps/api/.env.example` when the API skeleton is built. **Do not commit real values.**

### Core server

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `NODE_ENV` | Yes | `development`, `staging`, or `production` |
| `PORT` | Yes | Server port locally — **TBD** (e.g. `3001`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string — **TBD** host |
| `CORS_ORIGINS` | Yes | Allowed mobile app origins — **TBD** |
| `API_BASE_URL` | Optional | Public URL of this API — **TBD** |

### Authentication (Privy)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `PRIVY_APP_ID` | Yes | Privy application ID |
| `PRIVY_APP_SECRET` | Yes | Server-side verification — **secret** |

### Fiat on-ramp / off-ramp (BridgeXYZ)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `BRIDGE_API_KEY` | Yes (Phase 4+) | Bridge API access — **secret** |
| `BRIDGE_WEBHOOK_SECRET` | Yes (Phase 4+) | Verify Bridge webhooks — **secret** |

Exact Bridge env names may differ in their docs — confirm in sandbox (**TBD**).

### Virtual card (Gnosis Pay)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `GNOSIS_PAY_API_KEY` | Yes (Phase 9+) | Card issue and management — **secret** |
| `GNOSIS_PAY_WEBHOOK_SECRET` | Yes (Phase 9+) | Verify card webhooks — **secret** |

Exact names **TBD** from Gnosis Pay sandbox.

### Swaps / routing (LI.FI)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `LIFI_API_KEY` | Yes (if routing used) | Server-side swap routing — **secret** |

MVP should minimize LI.FI usage; still document the key for when needed.

### Yield (Aave first)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `YIELD_PROVIDER` | Yes (Phase 8+) | MVP value: `aave` |
| `AAVE_RPC_URL` or shared `BASE_RPC_URL` | Yes | Base network RPC — **TBD** |
| Provider-specific API keys | **TBD** | From Aave / integration partner docs |

### Email (Resend)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `RESEND_API_KEY` | Yes (Phase 4+) | Send transactional email — **secret** |
| `RESEND_FROM_EMAIL` | Yes | From address — **TBD** verified domain |

### Blockchain / gas sponsorship (Base + EIP-7702)

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `BASE_RPC_URL` | Yes (on-chain ops) | Read chain state, submit txs — **TBD** |
| `RELAYER_PRIVATE_KEY` or vendor-specific | Yes | Sponsor gas so users never pay — **TBD** vendor |

Relayer vendor and key format are **TBD** at implementation.

### Webhooks (inbound)

Store one secret per provider for signature verification:

- Bridge webhook secret (above)
- Gnosis Pay webhook secret (above)
- Yield provider webhook secret — **TBD** if applicable

---

## Mobile app (MVP — planned Phase 2)

Exact naming depends on React Native setup (Expo public env vs native config). **TBD** at scaffold time.

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `PRIVY_APP_ID` | Yes | Client-side Privy SDK (public) |
| `API_BASE_URL` | Yes | Olimpia API base URL — **TBD** staging/production |

**Never in mobile bundle:** Bridge keys, Gnosis keys, Resend, database URL, relayer keys, Anthropic.

---

## Environment matrix

| Surface | Local | Staging | Production |
|---------|-------|---------|------------|
| **Marketing URL** | `http://localhost:3000` | Vercel preview URL | `https://olimpia.app` **TBD** |
| **API URL** | `http://localhost:TBD` | **TBD** | **TBD** |
| **Waitlist DB** | Supabase dev project | Same or separate — **TBD** | Production Supabase — **TBD** |
| **App PostgreSQL** | Local Docker or Supabase — **TBD** | **TBD** | **TBD** |
| **Provider keys** | Sandbox | Sandbox | Production — **TBD** approval |

---

## Where secrets live in production

| Surface | Where to configure |
|---------|-------------------|
| Marketing | Vercel environment variables |
| API | Host secrets (Railway / Fly / Render / AWS — **TBD**) |
| Mobile | Build-time public vars only; no server secrets |
| Supabase | Supabase Dashboard (URL + anon key for marketing) |

---

## Future — Pia AI coach (not MVP)

When Pia is approved for a later release, add on the **API only**:

| Variable | What it does |
|----------|--------------|
| `ANTHROPIC_API_KEY` | Server-side LLM for Pia — **never** in mobile or marketing |

Optional tuning vars (rate limits, model name) — **TBD**.

---

## Decisions still TBD

| Topic | Notes |
|-------|-------|
| API hosting provider | Drives how secrets are stored |
| PostgreSQL provider | Supabase Postgres vs dedicated — **TBD** |
| Exact Bridge / Gnosis env var names | Confirm from provider dashboards |
| Relayer / EIP-7702 vendor | **TBD** |
| Mobile env naming convention | Expo `EXPO_PUBLIC_*` vs other — **TBD** |
| Production domain and email | **TBD** |

---

## Related documents

- [DatabaseSchema.md](./DatabaseSchema.md) — what `DATABASE_URL` connects to
- [DeploymentPlan.md](./DeploymentPlan.md) — where to paste these values
- [TestingChecklist.md](./TestingChecklist.md) — verify config before QA
