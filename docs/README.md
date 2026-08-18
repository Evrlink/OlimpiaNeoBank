# Documentation

Canonical planning docs for **Olimpia** V1 (simplified: Privy + Base USDC + Grow).

## Current MVP Architecture

**Privy embedded wallet + Base + USDC + Grow is the active V1 architecture.** Fiat on-ramp / off-ramp are not required for launch. Coinbase Headless work is preserved as post-V1. Start with the source-of-truth table below.

## Primary execution document

| File | Contents |
|------|----------|
| [`MVPLaunchChecklist.md`](./MVPLaunchChecklist.md) | **Work this top-down for App Store submission** — P0 → P1 → submission → P2 |
| [`V1Architecture.md`](./V1Architecture.md) | Simplified V1 product flow + **verified** implementation status |

## Source of truth (read these first)

| File | Contents |
|------|----------|
| [`V1Architecture.md`](./V1Architecture.md) | V1 product, flow, out-of-scope, what exists in code |
| [`product/V1Scope.md`](./product/V1Scope.md) | Launch scope |
| [`product/PRD.md`](./product/PRD.md) | Product requirements |
| [`architecture/Architecture.md`](./architecture/Architecture.md) | System architecture |
| [`architecture/ArchitectureDecisionLog.md`](./architecture/ArchitectureDecisionLog.md) | ADRs (see **ADR-015**) |
| [`build/BuildPlan.md`](./build/BuildPlan.md) | Build critical path |
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
| [`integrations/`](./integrations/) | Provider integration specs (Coinbase = post-V1 reference) |

## Engineering planning

| File | Contents |
|------|----------|
| [`DatabaseSchema.md`](./DatabaseSchema.md) | Data model |
| [`EnvironmentVariables.md`](./EnvironmentVariables.md) | Config by app |
| [`integrations/CoinbaseHeadlessIntegration.md`](./integrations/CoinbaseHeadlessIntegration.md) | **Post-V1** Coinbase Headless reference (preserve; do not delete) |
| [`DeploymentPlan.md`](./DeploymentPlan.md) | Deploy sequence |

## Status

Docs describe the architecture we are shipping for simplified V1. Bridge and Dakota are not active V1 providers. Coinbase Headless Onramp is implemented but **out of scope for V1 launch**. Historical ADRs may mention superseded providers when clearly labeled.
