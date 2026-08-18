# Phase 2 Auth Readiness

**Status:** Engineering readiness assessment  
**Audience:** Founder, backend/mobile agents, Cursor  
**Scope:** Backend foundation for Phase 2 (Welcome → Auth → onboarding shell → empty Home → Profile)  
**Sources:** [BuildPlan.md](../build/BuildPlan.md) · [Architecture.md](../architecture/Architecture.md) · [DatabaseSchema.md](../DatabaseSchema.md) · [EnvironmentVariables.md](../EnvironmentVariables.md) · [MobilePhase2ScreenBrief.md](../design/MobilePhase2ScreenBrief.md) · `apps/api/`

**Out of scope for this document:** Mobile UI implementation, Privy theming, Pia API, funding-provider integrations, marketing waitlist migration.

**V1 alignment:** See [V1Scope.md](../product/V1Scope.md). **Savings goals** and **USDC yield** are V1 launch requirements (Build Phases 5 and 8). **Functional Pia** and **virtual card** are post-V1.

---

## 1. Current backend foundation status

### What exists today (committed)

Phase 0 backend is live in the monorepo at `apps/api/` (commit `cec57d1` — *feat(api): add Phase 0 backend foundation*).

| Area | Status | Notes |
|------|--------|-------|
| **Monorepo wiring** | Done | Root `package.json` workspaces; scripts `dev:api`, `migrate:api`, `build:api`, `start:api` |
| **HTTP server** | Done | Express 4, JSON body parser, port from env (default `3001`) |
| **Health check** | Done | `GET /health` — service name, environment, database connectivity (`connected` / `not_configured` / `error`) |
| **API v1 router** | Stub only | `GET /api/v1` returns `{ api, version, status }` — no auth, no business routes |
| **Config** | Partial | `src/config/env.ts` reads `NODE_ENV`, `PORT`, `DATABASE_URL` from `.env.local` / `.env` |
| **PostgreSQL pool** | Done | `pg` connection pool; graceful shutdown on SIGINT/SIGTERM |
| **Migrations runner** | Done | Sequential SQL files in `migrations/`; tracks applied files in `schema_migrations` |
| **Schema v0** | Done | `001_init.sql`: `users`, `wallets`, `transactions` (stub) |
| **TypeScript** | Done | ESM, `tsx` dev, `tsc` build |

### What BuildPlan Phase 0 listed but is not implemented yet

| Deliverable | Status |
|-------------|--------|
| Privy auth middleware stub | **Not started** — no `src/auth/` module |
| Privy dashboard app (iOS + Android bundle IDs) | **External / TBD** — not in repo |
| Staging API + DB deploy | **Not started** |
| Launch geography assessment completion | **Partial** — [launch-geography.md](../architecture/launch-geography.md) is a template with TBD cells |

### What Phase 2 backend requires (not built)

| Capability | Status |
|------------|--------|
| Privy server SDK — token verification | Not started |
| `POST /api/v1/auth/sync` | Not started |
| `GET /api/v1/me` | Not started |
| Ledger initialization (zero balances) | Not started — no balance table in migrations |
| Protected-route middleware | Not started |
| Error response shape / auth error codes | Not started |
| CORS for mobile dev clients | Not started — `CORS_ORIGINS` not in env config |

### Mobile app (dependency context)

`apps/mobile/` is a **folder scaffold only** (README placeholder). Phase 2 mobile work depends on the API contracts in §5 and Privy credentials in §3–§4.

---

## 2. Supabase / Postgres status

Olimpia uses **two separate data stores** today. Phase 2 auth does **not** unify them.

### Marketing waitlist — Supabase (live)

| Item | Detail |
|------|--------|
| **Purpose** | Capture emails from marketing site waitlist modal |
| **Table** | `public.waitlist_emails` — see [waitlist_emails.sql](../../apps/marketing/supabase/waitlist_emails.sql) |
| **Access** | Browser inserts via Supabase anon key + RLS (insert-only) |
| **Env** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` on marketing app |
| **Phase 2 impact** | **None** — auth/users do not touch this database |

### App data — PostgreSQL (Phase 0 schema, local/dev)

| Item | Detail |
|------|--------|
| **Purpose** | Users, wallets, ledger, transactions, and all mobile/API state |
| **Connection** | `DATABASE_URL` in `apps/api/.env.local` |
| **Migration tool** | Custom runner (`npm run migrate:api`) — raw SQL files |
| **Applied schema** | `users`, `wallets`, `transactions` (stub), `schema_migrations` |
| **Host decision** | **TBD** — local Docker, Supabase Postgres (separate project from waitlist), or managed host per [DeploymentPlan.md](../DeploymentPlan.md) |
| **Production/staging** | **Not provisioned** in repo |

### Honest gap for Phase 2 auth

`POST /auth/sync` requires the **app PostgreSQL** database with:

1. Migrations applied (`users`, `wallets` at minimum).
2. A **ledger/balance** table or equivalent row created on first sync (see §6) — required by Architecture onboarding step *“initializes ledger with zero balances”* but **missing from `001_init.sql`**.

**Recommendation:** Use one PostgreSQL instance for app data in dev/staging. Whether that is Supabase Postgres or another host is a founder/ops decision; the API only needs a valid `DATABASE_URL`.

---

## 3. Privy setup checklist for Phase 2

Complete these in the [Privy Dashboard](https://dashboard.privy.io) before implementing auth routes or mobile SDK integration.

### Dashboard — application

- [ ] Create Privy app (or confirm existing) for **Olimpia mobile**
- [ ] Note **App ID** → `PRIVY_APP_ID` (public; used by mobile + API)
- [ ] Note **App Secret** → `PRIVY_APP_SECRET` (server-only; never in mobile bundle)
- [ ] Enable login methods aligned with Phase 2 brief: **email** and **phone** (OTP); enable **passkey** where supported
- [ ] Configure **embedded wallets** — automatic creation on sign-up; chain **Base** only (hardcoded in product; confirm Privy wallet config matches)
- [ ] Set session / token lifetime appropriate for mobile (document chosen values internally)

### Mobile platforms (required before device testing)

- [ ] Register **iOS bundle ID** (TBD — e.g. `app.olimpia.mobile`)
- [ ] Register **Android package name** (TBD — must match future `apps/mobile` config)
- [ ] Configure redirect / deep-link URLs if Privy requires them for RN SDK (confirm in Privy React Native docs at integration time)
- [ ] Add team members who need dashboard access

### Server verification (API)

- [ ] Install Privy server SDK in `apps/api` when implementing (package name TBD from current Privy Node docs)
- [ ] Verify **access tokens** from `Authorization: Bearer <token>` on every protected route
- [ ] Map verified token → `privy_user_id` (Privy DID / user id field per SDK)
- [ ] Fetch embedded wallet address + `privy_wallet_id` from Privy user/wallet APIs during sync (exact SDK calls TBD at implementation)

### Security / compliance (Phase 2 minimum)

- [ ] Confirm Privy **restricted jurisdictions** for target launch countries — cross-check [launch-geography.md](../architecture/launch-geography.md)
- [ ] Use **sandbox / development** app credentials locally; separate staging app recommended before production
- [ ] Never log full access tokens or app secret

### Mobile SDK (parallel track — mobile agent)

- [ ] Add Privy React Native SDK to `apps/mobile` when scaffold exists
- [ ] Pass only `PRIVY_APP_ID` + `API_BASE_URL` in mobile env — no server secrets
- [ ] After Privy login success, call `POST /api/v1/auth/sync` before navigating to onboarding completion / Home
- [ ] On sign-in, skip onboarding confirmation screen per [MobilePhase2ScreenBrief.md](../design/MobilePhase2ScreenBrief.md)
- [ ] Sign out via Privy SDK only — no backend logout route required for Phase 2

---

## 4. Required environment variables (Phase 2)

Placeholder values only. Copy patterns from [apps/api/.env.example](../../apps/api/.env.example). Store real values in `.env.local` — **never commit secrets**.

### API (`apps/api/.env.local`)

```bash
# Core
NODE_ENV=development
PORT=3001

# App PostgreSQL (not the marketing Supabase project)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/olimpia_dev

# Auth — Phase 2 required
PRIVY_APP_ID=privy-app-id-placeholder
PRIVY_APP_SECRET=privy-app-secret-placeholder

# Mobile clients (comma-separated origins for local dev)
CORS_ORIGINS=http://localhost:8081,http://localhost:19006

# Optional Phase 2
API_BASE_URL=http://localhost:3001
```

### Mobile (`apps/mobile` — when scaffold exists)

Exact prefix TBD (Expo `EXPO_PUBLIC_*` vs native config). Placeholders:

```bash
PRIVY_APP_ID=privy-app-id-placeholder
API_BASE_URL=http://localhost:3001
```

### Not required for Phase 2 auth

Do **not** block auth implementation on these (later phases):

- Coinbase / funding secrets, `GNOSIS_*`, `LIFI_*`, `AAVE_*`, `BASE_RPC_URL`, `RELAYER_*`, `RESEND_*`, `ANTHROPIC_*` (and any legacy `BRIDGE_*` — remove in Day 1 cleanup; not required for auth)

Marketing Supabase vars remain on `apps/marketing` only.

---

## 5. Proposed API contract

Base path: `/api/v1`.  
Auth header (protected routes): `Authorization: Bearer <privy_access_token>`.  
Content-Type: `application/json`.  
All dollar amounts are **strings or numbers in USD display semantics** — never expose USDC, chain, or wallet address in responses.

### Shared types

```typescript
// Illustrative — not implemented code

interface ApiError {
  error: {
    code: string;       // e.g. "UNAUTHORIZED", "SYNC_FAILED", "NOT_FOUND"
    message: string;    // safe for client display
  };
}

interface UserProfile {
  id: string;                 // Olimpia user UUID
  email: string | null;
  phone: string | null;
  displayName: string | null;
  username: string | null;    // receive handle; may be null until assigned
  createdAt: string;          // ISO 8601
}

interface BalanceSummary {
  availableUsd: string;         // e.g. "0.00"
  goalsAllocatedUsd: string;
  growthAllocatedUsd: string;
  totalDisplayUsd: string;    // sum of the three buckets
}

interface EligibilityFlags {
  card: { available: boolean; reason?: string };
  onRamp: { available: boolean; reason?: string };
  offRamp: { available: boolean; reason?: string };
  growth: { available: boolean; reason?: string };
}
```

### `POST /api/v1/auth/sync`

**Purpose:** Idempotent post-login provisioning — verify Privy token, upsert Olimpia user + wallet, initialize ledger at zero. Called after every successful Privy sign-up or sign-in (safe to retry).

**Auth:** Required — Bearer Privy access token.

**Request body:** Empty object `{}` or omitted body. All identity and wallet data comes from verified Privy token + Privy server API lookups — **do not trust client-supplied wallet addresses**.

**Success — `200 OK`**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": null,
    "displayName": null,
    "username": null,
    "createdAt": "2026-07-02T12:00:00.000Z"
  },
  "wallet": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "chain": "base"
  },
  "balance": {
    "availableUsd": "0.00",
    "goalsAllocatedUsd": "0.00",
    "growthAllocatedUsd": "0.00",
    "totalDisplayUsd": "0.00"
  },
  "isNewUser": true
}
```

**Notes on response fields:**

- `wallet` must **not** include `address` or `privyWalletId` — internal only.
- `isNewUser`: `true` on first Olimpia record creation; `false` on subsequent syncs. Mobile may use this to route sign-up → “You’re in.” confirmation vs sign-in → Home (per Phase 2 brief).
- Email/phone populated from Privy verified claims where available.

**Error responses**

| Status | Code | When |
|--------|------|------|
| `401` | `UNAUTHORIZED` | Missing, invalid, or expired Privy token |
| `403` | `FORBIDDEN` | Privy user valid but jurisdiction / app policy blocks provisioning (future; optional Phase 2) |
| `502` | `PRIVY_UNAVAILABLE` | Privy API error during verification or wallet fetch |
| `500` | `SYNC_FAILED` | Database or unexpected server error |

**Idempotency behavior**

- Same `privy_user_id` → update email/phone if changed; do not duplicate user or wallet rows.
- Ledger row must exist with zeros if missing; never reset non-zero balances on re-sync.

---

### `GET /api/v1/me`

**Purpose:** Read profile for Profile tab and session hydration. Phase 2 is **read-only** on mobile (no `PATCH /me` yet).

**Auth:** Required — Bearer Privy access token.

**Request:** No body.

**Success — `200 OK`**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "phone": null,
    "displayName": null,
    "username": null,
    "createdAt": "2026-07-02T12:00:00.000Z"
  },
  "balance": {
    "availableUsd": "0.00",
    "goalsAllocatedUsd": "0.00",
    "growthAllocatedUsd": "0.00",
    "totalDisplayUsd": "0.00"
  },
  "eligibility": {
    "card": { "available": false, "reason": "not_available_phase_2" },
    "onRamp": { "available": false, "reason": "not_available_phase_2" },
    "offRamp": { "available": false, "reason": "not_available_phase_2" },
    "growth": { "available": false, "reason": "not_available_phase_2" }
  }
}
```

**Phase 2 simplification:** Return static `eligibility` flags (all features false) until launch geography assessment is complete. Replace with server-driven flags in a later phase.

**Error responses**

| Status | Code | When |
|--------|------|------|
| `401` | `UNAUTHORIZED` | Invalid / missing token |
| `404` | `USER_NOT_FOUND` | Valid Privy token but no Olimpia user — client should call `POST /auth/sync` first |
| `500` | `INTERNAL_ERROR` | Unexpected failure |

**Explicit exclusions from Phase 2 responses**

- Wallet address, chain name, USDC, Privy user id
- Linked bank / payment methods are handled inside **Coinbase Headless Onramp** for Add Money; bank withdrawal / off-ramp is deferred (see [V1Scope.md](../product/V1Scope.md))
- Pia thread or coach data (Future)
- Notification preferences (defer `PATCH /me` to later MVP phase)

---

## 6. Database changes needed before auth sync

`001_init.sql` is **necessary but not sufficient**. Apply the following before implementing `POST /auth/sync`.

### Required: new migration (proposed `002_ledger.sql`)

**`user_balances`** — one row per user, initialized at sync:

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | `uuid` PK, FK → `users(id)` ON DELETE CASCADE | |
| `available_usd` | `numeric(12,2)` NOT NULL DEFAULT 0 | Spend/send/withdraw pool |
| `goals_allocated_usd` | `numeric(12,2)` NOT NULL DEFAULT 0 | Phase 2 always 0 |
| `growth_allocated_usd` | `numeric(12,2)` NOT NULL DEFAULT 0 | Phase 2 always 0 |
| `updated_at` | `timestamptz` NOT NULL DEFAULT now() | |

**Constraint:** All balance columns `>= 0` (check constraints recommended).

**Invariant (Architecture MVP):**

```
total_display_usd = available_usd + goals_allocated_usd + growth_allocated_usd
```

Compute `totalDisplayUsd` in API responses; optional generated column later.

### Existing tables — no structural change required for Phase 2

| Table | Phase 2 usage |
|-------|----------------|
| `users` | Insert/update on sync from Privy claims |
| `wallets` | Insert once per user; store `address`, `chain='base'`, `privy_wallet_id` |
| `transactions` | Unused in Phase 2 — stub remains empty |

### Optional (defer unless needed for Profile)

| Change | Recommendation |
|--------|----------------|
| `users.updated_at` | Defer — not required for read-only Profile |
| `users.notification_prefs jsonb` | Defer — `PATCH /me` not in Phase 2 |
| Username auto-generation | **Decision needed** — nullable `username` acceptable for Phase 2 empty Profile |
| Unique index on `wallets(address)` | Recommended before mainnet traffic; optional for dev |

### Migration order

1. Ensure `001_init.sql` applied.
2. Apply ledger migration.
3. Implement sync to INSERT `users`, `wallets`, `user_balances` in a **single transaction**.

---

## 7. Security requirements

Phase 2 auth must meet Architecture §15 security requirements.

### Authentication and authorization

- Verify Privy access token on **every** request to `/api/v1/auth/sync`, `/api/v1/me`, and all future protected routes.
- Derive Olimpia `user_id` from DB lookup by `privy_user_id` — never accept Olimpia user id from client body.
- Users may only read/write their own resources (`userId` from token mapping).

### Secrets and data exposure

- `PRIVY_APP_SECRET` server-only; never in mobile or marketing bundles.
- Do not return wallet `address`, `privy_wallet_id`, or Privy user id in API JSON.
- Do not log bearer tokens, secrets, or full Privy API responses containing PII.

### Transport and headers

- HTTPS only in staging and production.
- Configure `CORS_ORIGINS` explicitly — no `*` in production.

### Abuse prevention (Phase 2 minimum)

- Rate-limit `POST /auth/sync` per IP and/or per token (exact limits TBD at implementation).
- Return generic `401` for bad tokens — avoid leaking validation internals.

### Database

- Use parameterized queries (already pattern with `pg`).
- Wrap sync in a transaction to prevent partial user without wallet or balance.

### Out of scope for Phase 2 (document for later)

- Webhook signature verification (no provider webhooks yet)
- Idempotency keys on money movement
- PII encryption at rest (best-effort MVP — document as future hardening)
- Card PAN/CVV handling (no card in Phase 2)

---

## 8. Testing checklist

### Local prerequisites

- [ ] PostgreSQL running; `DATABASE_URL` set in `apps/api/.env.local`
- [ ] `npm run migrate:api` applies `001_init` + ledger migration without error
- [ ] `npm run dev:api` starts; `GET /health` shows `"database": "connected"`
- [ ] Privy app credentials set (`PRIVY_APP_ID`, `PRIVY_APP_SECRET`)

### API — auth middleware

- [ ] Request without `Authorization` header → `401 UNAUTHORIZED`
- [ ] Request with malformed token → `401 UNAUTHORIZED`
- [ ] Request with expired token → `401 UNAUTHORIZED`

### API — `POST /api/v1/auth/sync`

- [ ] Valid Privy token (new user) → `200`; `isNewUser: true`; user + wallet + balance rows in DB
- [ ] Response JSON contains **no** wallet address or crypto fields
- [ ] Repeat sync (same user) → `200`; `isNewUser: false`; no duplicate users/wallets
- [ ] Balance row exists with all zeros after first sync
- [ ] Re-sync does not alter balances if non-zero (simulate by manual DB update in test)
- [ ] Privy API down / misconfigured secret → `502` or `500` with safe message

### API — `GET /api/v1/me`

- [ ] After sync → `200` with user + zero balance + eligibility stub
- [ ] Before sync (token valid, no DB user) → `404 USER_NOT_FOUND`
- [ ] Invalid token → `401`

### Integration — mobile (when app exists)

- [ ] Sign up on iOS → Privy auth → sync → “You’re in.” → empty Home
- [ ] Sign in on iOS → sync → Home (skip confirmation)
- [ ] Same flows on Android emulator/device
- [ ] Profile tab shows email/name from `GET /me`; no wallet address
- [ ] Sign out → Welcome; subsequent API calls with old token fail
- [ ] No crypto/DeFi vocabulary on auth or post-auth screens (Phase 2 copy rules)

### Regression

- [ ] `GET /health` still `200` when DB up
- [ ] `GET /api/v1` stub still reachable (or gated consistently if policy changes)
- [ ] No secrets in git diff; `.env.local` gitignored

### Staging (when deployed)

- [ ] HTTPS enforced
- [ ] Migrations applied on staging DB
- [ ] Mobile `API_BASE_URL` points to staging
- [ ] CORS allows staging mobile build origin

---

## 9. Single recommended next backend implementation task

**Implement Privy token verification middleware and `POST /api/v1/auth/sync` end-to-end** (including `002_ledger.sql` migration and transactional user + wallet + zero-balance creation).

**Why this task first:**

- It is the **critical path** for Phase 2 — mobile cannot complete sign-up/sign-in without it ([BuildPlan.md](../build/BuildPlan.md) acceptance: *“POST /auth/sync creates user + wallet records”*).
- `GET /api/v1/me` is a thin read layer over the same tables and middleware; build it immediately after sync in the same PR or follow-up.
- Ledger initialization belongs in sync — deferring it blocks Phase 3 balance endpoints and violates Architecture onboarding sequence.

**Suggested implementation order within that task:**

1. Add `002_ledger.sql` + run migration.
2. Extend `env.ts` with `PRIVY_APP_ID`, `PRIVY_APP_SECRET`, `CORS_ORIGINS`.
3. Add `src/auth/` — Privy verify middleware + attach `privyUserId` to request context.
4. Add `src/routes/v1/auth.ts` — `POST /auth/sync` with transaction.
5. Add `src/routes/v1/me.ts` — `GET /me`.
6. Manual test with a real Privy sandbox token from Privy dashboard or mobile dev client.

---

## Related documents

- [BuildPlan.md — Phase 2](../build/BuildPlan.md)
- [Architecture.md — §5 Wallet, §14 API, §17 Security](../architecture/Architecture.md)
- [DatabaseSchema.md](../DatabaseSchema.md)
- [EnvironmentVariables.md](../EnvironmentVariables.md)
- [TestingChecklist.md — §3 Mobile onboarding](../TestingChecklist.md)
- [apps/api/README.md](../../apps/api/README.md)
