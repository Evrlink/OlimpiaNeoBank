# Documentation

Canonical planning docs for **Olimpia** V1 (Architecture v3.0).

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.** Bridge and Dakota are not active providers. Start with the source-of-truth table below.

## Primary execution document

| File | Contents |
|------|----------|
| [`MVPLaunchChecklist.md`](./MVPLaunchChecklist.md) | **Work this top-down for App Store submission** — P0 → P1 → submission → P2 |

## Source of truth (read these first)

| File | Contents |
|------|----------|
| [`product/PRD.md`](./product/PRD.md) | Product requirements |
| [`product/V1Scope.md`](./product/V1Scope.md) | Launch scope |
| [`architecture/Architecture.md`](./architecture/Architecture.md) | System architecture — Privy → Coinbase Headless → Base USDC → ledger → Aave |
| [`architecture/ArchitectureDecisionLog.md`](./architecture/ArchitectureDecisionLog.md) | ADRs (see **ADR-013**) |
| [`build/BuildPlan.md`](./build/BuildPlan.md) | 3–4 day MVP critical path |
| [`TestingChecklist.md`](./TestingChecklist.md) | Manual QA |

## Folders

| Folder | Contents |
|--------|----------|
| [`product/`](./product/) | PRD, V1 scope, flows, screens, navigation |
| [`architecture/`](./architecture/) | Architecture, ADRs, launch geography |
| [`brand/`](./brand/) | Brand and visual identity |
| [`build/`](./build/) | Build plan |
| [`providers/`](./providers/) | Active provider index; **archive/** is historical only |
| [`design/`](./design/) | Screen briefs |
| [`engineering/`](./engineering/) | Phase readiness notes |

## Engineering planning

| File | Contents |
|------|----------|
| [`DatabaseSchema.md`](./DatabaseSchema.md) | Data model |
| [`EnvironmentVariables.md`](./EnvironmentVariables.md) | Config by app |
| [`DeploymentPlan.md`](./DeploymentPlan.md) | Deploy sequence |

## Status

Docs describe **only** the architecture we are building now. Bridge and Dakota are not active V1 providers. Historical ADRs and archived evaluations may mention them when clearly labeled superseded / historical.
