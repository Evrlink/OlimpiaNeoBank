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
| [`docs/V1Architecture.md`](docs/V1Architecture.md) | Simplified V1 product + verified implementation status |
| [`docs/MVPLaunchChecklist.md`](docs/MVPLaunchChecklist.md) | Execution checklist (work top-down) |
| [`docs/product/V1Scope.md`](docs/product/V1Scope.md) | Launch scope |
| [`docs/product/PRD.md`](docs/product/PRD.md) | Product requirements |
| [`docs/architecture/Architecture.md`](docs/architecture/Architecture.md) | System architecture |
| [`docs/architecture/ArchitectureDecisionLog.md`](docs/architecture/ArchitectureDecisionLog.md) | ADRs |
| [`docs/build/BuildPlan.md`](docs/build/BuildPlan.md) | Build plan (aligned to simplified V1) |
| [`docs/TestingChecklist.md`](docs/TestingChecklist.md) | Manual QA |

See [`docs/README.md`](docs/README.md) for the full index.

## Current V1 stack (approved)

```text
User → Privy auth → Privy embedded wallet
  → Receive USDC on Base
  → Balance + transaction activity
  → Grow → withdraw back to wallet
```

| Layer | Choice |
|-------|--------|
| Mobile | React Native / Expo (iOS first) |
| Auth + wallet | Privy embedded wallet |
| Chain / asset | Base / USDC |
| Funding (V1) | Inbound USDC on Base |
| Backend | Node.js / Express + PostgreSQL |
| Grow | Aave on Base (intended) |
| Marketing | Existing site on Vercel + GA4 |

**Post-V1 (code preserved):** Coinbase Headless Onramp, Apple Pay funding, fiat offramp, virtual card.

**Not in active V1 architecture:** Bridge.xyz, Dakota.

## Core V1 features

| Feature | Description |
|---------|-------------|
| Account creation | Privy email auth + embedded wallet |
| Receive USDC | Supported USDC on Base into Privy wallet |
| Balance + transaction activity | Backend-authoritative display |
| Grow | Optional yield allocation; withdraw back to wallet |

## Development

```bash
npm install
npm run dev:marketing    # http://localhost:3000
npm run dev:api          # API on port 3001
npm run start -w @olimpia/mobile
```

## Current status

V1 simplified: no fiat on-ramp required for launch. Immediate priorities — Privy wallet, Receive USDC, balance, wallet transaction activity, Grow deposit/withdraw, real Base USDC verification — see [`docs/MVPLaunchChecklist.md`](docs/MVPLaunchChecklist.md) and [`docs/V1Architecture.md`](docs/V1Architecture.md).

---

*Built on Base. Designed for women.*
