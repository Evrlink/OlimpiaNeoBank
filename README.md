# Olimpia

Monorepo for **Olimpia** — planning docs in `docs/`, implementation in `apps/` and `packages/`.

## Project structure

### Applications (`apps/`)

| Path | Purpose |
|------|---------|
| `apps/marketing/` | Public website (Vercel) + waitlist + GA4 |
| `apps/mobile/` | React Native / Expo app — **iOS first** |
| `apps/api/` | Node.js / Express API, ledger, provider integrations |

### Shared packages (`packages/`)

| Path | Purpose |
|------|---------|
| `packages/ui/` | Reusable UI components |
| `packages/design-system/` | Design tokens |
| `packages/config/` | Shared tooling config |
| `packages/types/` | Shared TypeScript types |

### Documentation (`docs/`) — canonical V1 source of truth

| Path | Purpose |
|------|---------|
| [`docs/product/PRD.md`](docs/product/PRD.md) | Product requirements |
| [`docs/product/V1Scope.md`](docs/product/V1Scope.md) | Launch scope |
| [`docs/architecture/Architecture.md`](docs/architecture/Architecture.md) | System architecture |
| [`docs/architecture/ArchitectureDecisionLog.md`](docs/architecture/ArchitectureDecisionLog.md) | ADRs |
| [`docs/build/BuildPlan.md`](docs/build/BuildPlan.md) | 3–4 day MVP critical path |
| [`docs/TestingChecklist.md`](docs/TestingChecklist.md) | Manual QA |

See [`docs/README.md`](docs/README.md) for the full index.

## Current V1 stack (approved)

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

| Layer | Choice |
|-------|--------|
| Mobile | React Native / Expo (iOS first) |
| Auth + wallet | Privy |
| Chain / asset | Base / USDC |
| Add Money | **Coinbase Headless Onramp** |
| Transfer USDC | Inbound USDC on Base |
| Backend | Node.js / Express + PostgreSQL |
| Growth | Aave on Base |
| Marketing | Existing site on Vercel + GA4 |

**Not in active V1 architecture:** Bridge.xyz, Dakota, bank off-ramp (deferred), virtual card.

## Core V1 features

| Feature | Description |
|---------|-------------|
| Account creation | Privy email auth + embedded wallet |
| Add Money | Coinbase Headless → USDC to Privy wallet on Base |
| Transfer USDC | Receive supported USDC on Base |
| Balance + activity | Backend ledger |
| Savings goals | Named envelopes (no auto yield) |
| Growth | Optional Aave allocation |
| Send / receive | Olimpia-user P2P (tiered in BuildPlan) |

## Development

```bash
npm install
npm run dev:marketing    # http://localhost:3000
npm run dev:api          # API on port 3001
npm run start -w @olimpia/mobile
```

## Current status

Documentation reset to Architecture v3.0 complete. Implementation sprint: remove legacy Bridge funding path, ship Coinbase Headless, prepare iOS App Store submission — see [`docs/build/BuildPlan.md`](docs/build/BuildPlan.md).

---

*Built on Base. Designed for women.*
