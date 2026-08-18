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
Privy embedded wallet
  → Receive USDC on Base
  → USDC balance via Privy
  → Real wallet transaction activity via Privy
  → Grow → withdraw back to Privy wallet
```

| Layer | Choice |
|-------|--------|
| Mobile | React Native / Expo (iOS first) |
| Auth + wallet | Privy embedded wallet |
| Chain / asset | Base / USDC |
| Funding (V1) | Inbound USDC on Base |
| Balance / activity (V1 intent) | Privy Get Balance / Get Transactions (**planned — not wired**) |
| Backend | Node.js / Express + PostgreSQL |
| Grow (V1 intent) | Privy Earn / Aave vault (**planned — not wired**) |
| Marketing | Existing site on Vercel + GA4 |

**Post-V1 (code preserved):** Coinbase Headless Onramp, Apple Pay funding, fiat offramp, virtual card.

**Not in active V1 architecture:** Bridge.xyz, Dakota.

## Core V1 features

| Feature | Description | Status |
|---------|-------------|--------|
| Account creation | Privy email auth + embedded wallet | Partially implemented |
| Receive USDC | Supported USDC on Base into Privy wallet | Planned (UI stub) |
| Balance | Privy USDC balance on Base | Planned (ledger display exists today — not Privy) |
| Transaction activity | Privy wallet transfers | Planned (app-deposit activity API only today) |
| Grow | Privy Earn deposit / withdraw + earnings | Planned (UI placeholder) |

## Development

```bash
npm install
npm run dev:marketing    # http://localhost:3000
npm run dev:api          # API on port 3001
npm run start -w @olimpia/mobile
```

## Current status

V1 does **not** use Coinbase Onramp/Offramp. Immediate priorities: validate Privy → embedded wallet → Receive USDC → Privy balance → Privy activity → Grow → withdraw → real Base USDC verification — see [`docs/MVPLaunchChecklist.md`](docs/MVPLaunchChecklist.md) and [`docs/V1Architecture.md`](docs/V1Architecture.md).

---

*Built on Base. Designed for women.*
