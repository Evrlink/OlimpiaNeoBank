# AGENTS.md

## Cursor Cloud specific instructions

Olimpia is an npm-workspaces monorepo (Node >= 18; VM has Node 22, npm 10) with three apps under `apps/`:

| App | Package | What it is | Run (dev) | Notes |
|-----|---------|-----------|-----------|-------|
| `apps/api` | `@olimpia/api` | Express + PostgreSQL backend (port 3001) | `npm run dev:api` | Needs Postgres + `apps/api/.env.local`. Auth endpoints need Privy creds. |
| `apps/marketing` | `@olimpia/marketing` | TanStack Start + Vite web site (port 3000) | `npm run dev:marketing` | Runs standalone; fully browser-testable. |
| `apps/mobile` | `@olimpia/mobile` | Expo / React Native app | `npm run dev:mobile` | Requires an iOS/Android device or simulator — not runnable headless. |

Standard commands live in the root `package.json` and each app's `README.md`; prefer those over duplicating here.

### Backend API (`apps/api`)
- Requires a running PostgreSQL. The update script does NOT install/start Postgres — see below to start it in a fresh VM.
- Env: copy `apps/api/.env.example` to `apps/api/.env.local` (git-ignored). The default `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/olimpia_dev` matches the local Postgres setup described below.
- Migrations are raw SQL in `apps/api/migrations/`, applied by `npm run migrate:api` (idempotent; tracked in `schema_migrations`). Run this after starting the DB and before `npm run dev:api`.
- `GET /health` returns DB status; `GET /api/v1` is a stub. Auth-protected routes (`POST /api/v1/auth/sync`, `GET /api/v1/me`) require valid Privy tokens. Without `PRIVY_APP_ID`/`PRIVY_APP_SECRET` set, `requireAuth` returns `500 INTERNAL_ERROR "Authentication is not configured."` for a presented token, and `401 UNAUTHORIZED` when no `Authorization: Bearer` header is sent — both are expected in this environment.

### Starting PostgreSQL in a fresh VM (one-time per boot, not in update script)
Postgres 16 is installed via apt during setup but is not auto-started and apt cannot `service` it here. Start it and seed the dev DB with:
```
sudo pg_ctlcluster 16 main start
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres createdb olimpia_dev   # ignore error if it already exists
```
Then `npm run migrate:api`.

### Marketing (`apps/marketing`)
- `npm run dev:marketing` (port 3000, `--strictPort`). `predev`/`prebuild` run `generate:seo` automatically.
- Supabase powers only the waitlist form and is optional: without `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, `getSupabase()` returns `null` and waitlist submits fail gracefully ("Waitlist is unavailable right now"). Everything else works.
- Interactive product flows are previewable in the browser at `/app-preview/welcome` (pill nav: Welcome, Auth, You're in, Empty Home, Add funds, Savings, Card, Profile) — the highest-fidelity way to exercise the neobank UX without Expo.
- `npm run lint -w @olimpia/marketing` currently reports many pre-existing `prettier/prettier` errors on committed files (not caused by env setup). Lint is not clean on `main`; do not treat these as regressions.
- This app is Lovable-connected (see `apps/marketing/AGENTS.md`): never rewrite pushed git history; keep the branch working.

### Mobile (`apps/mobile`)
- Expo/React Native; running the app requires a simulator/device, which is unavailable in this headless VM. Use `npm run typecheck -w @olimpia/mobile` to validate, and the marketing `/app-preview/*` routes to view the equivalent UI.
- Env: `apps/mobile/.env.example` -> `.env.local` with `EXPO_PUBLIC_PRIVY_APP_ID`, `EXPO_PUBLIC_PRIVY_CLIENT_ID`, `EXPO_PUBLIC_API_BASE_URL` (the app throws on startup if `EXPO_PUBLIC_API_BASE_URL` is unset).

### Checks (no automated test suite exists)
There are no unit/integration test scripts in this repo. Use these as the quality gates:
- `npm run typecheck -w @olimpia/api` / `npm run build:api`
- `npm run typecheck -w @olimpia/mobile`
- `npm run build:marketing` (passes) and `npm run lint -w @olimpia/marketing` (has pre-existing failures — see above).
