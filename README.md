# GirlNeoBank

Neobank only for girls.

## Project Structure

Monorepo for **Olimpia** (Olympia Neobank) — planning docs in `docs/`, implementation in `apps/` and `packages/`.

### Applications (`apps/`)

| Path | Purpose |
|------|---------|
| `apps/marketing/` | Public website and landing page |
| `apps/mobile/` | React Native iOS and Android app |
| `apps/api/` | Backend API, webhooks, and provider integrations |

### Shared packages (`packages/`)

| Path | Purpose |
|------|---------|
| `packages/ui/` | Reusable UI components |
| `packages/design-system/` | Colors, typography, spacing, and design tokens |
| `packages/config/` | Shared ESLint, TypeScript, and tooling configuration |
| `packages/types/` | Shared TypeScript types |

### Documentation (`docs/`)

| Path | Purpose |
|------|---------|
| `docs/product/` | PRD, user flows, screens, navigation |
| `docs/architecture/` | System architecture, launch geography |
| `docs/brand/` | Brand, tone, and visual identity |
| `docs/build/` | Build plan and implementation phases |

### Root

| File | Purpose |
|------|---------|
| `README.md` | Repository overview (this file) |
| `llms.txt` | Agent/crawler summary for marketing SEO |

Each folder contains a `README.md` with scope details. See [`docs/README.md`](./docs/README.md) for the full doc index.

### Development

```bash
npm install
npm run dev:marketing    # http://localhost:3000
npm run build:marketing  # Vite build → apps/marketing/dist/
npm run start:marketing  # preview production build
```

---

# Women First


A modern financial experience designed for women — powered by crypto infrastructure behind the scenes.




Vision

Women First is building a new kind of neobank: one that helps women save, spend, move money, and build wealth through a simple, elegant, and trustworthy platform.

Users should never feel like they are using crypto. Crypto serves as invisible infrastructure — powering faster payments, global access, programmable money, and modern financial products. The goal is to combine the best of fintech, stablecoins, and wealth-building tools into a single consumer experience designed specifically for women.


The Problem

Traditional banks were not designed around financial empowerment. Most fintech apps focus on transactions. Most crypto apps focus on technology. Neither focuses on creating a financial experience that feels approachable, supportive, and empowering for women.

Women First aims to bridge that gap.


Product Principles


User experience first
Crypto should be invisible
Simplicity over complexity
Wealth building over speculation
Trust over hype
Mobile-first design
Integration over invention
MVP before scale

## Core MVP Features

| Feature | Description |

| Account Creation | Simple onboarding with email-based registration |
| Smart Wallet | Secure wallet provisioned automatically — no blockchain knowledge required |
| Fiat On-Ramp | Fund accounts directly from traditional banking |
| Stablecoin Balance | Hold digital dollars through stablecoin infrastructure |
| Send & Receive | Fast peer-to-peer payments on modern rails |
| Savings Vault | Create savings goals and track progress |
| Yield Generation | Earn yield through selected infrastructure partners |
| Debit Card Access | Spend funds in the real world via integrated card infrastructure |
| Financial Insights | Actionable insights focused on wealth building and financial confidence |



## Technology Stack

| Layer | Provider |

| Blockchain | Base |
| Wallet Infrastructure | Privy |
| Fiat On / Off Ramp | Bridge XYZ |
| Card Infrastructure | Gnosis Pay |
| Transaction Sponsorship | EIP-7702 |
| Swaps | LI.FI |
| Yield | Aave, Morpho, Compound |
| Notifications | Resend |
| Frontend | React Native |
| Backend | Node.js |


Architecture Philosophy

Build on proven infrastructure. Do not reinvent systems that already exist.

Priorities:


Speed to MVP
User experience
Reliability
Security
Scalability



Development Workflow


Product Requirements Document (PRD)
Technical Architecture
Build Plan
MVP Development
User Testing
Iteration



Current Status

🚧 In Development

Active focus:


Product Requirements Document
System Architecture
MVP Planning



Long-Term Vision

Build the most trusted financial platform for women by combining modern fintech experiences with next-generation financial infrastructure.

The future of finance should feel simple, empowering, and accessible to everyone.


Built on Base. Designed for women.

---

*Built on Base. Designed for women.*
