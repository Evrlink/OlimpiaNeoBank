# Mobile App

React Native / Expo **Olimpia** app — **iOS first** for App Store submission.

## V1 source of truth

```text
Privy embedded wallet → Base → USDC → Receive USDC → real balance → real activity → Grow → withdraw back to the Privy wallet
```

**V1 funding** is inbound **USDC on Base** to the user’s Privy wallet. Fiat onramp, Apple Pay, Dakota, and Bridge are not V1.

## Current implementation

| Area | Status |
|------|--------|
| Welcome, Auth (Privy email OTP), You're in | Shipped |
| Auth sync (`POST /api/v1/auth/sync`) | Shipped — wallet address + `privyWalletId`, chain `base` |
| Session restore (`GET /api/v1/me`) | Shipped |
| Authenticated 4-tab shell (Home, Savings, Card, Profile) | Shipped |
| Home — synced user + Privy USDC balance wiring | Shipped (needs live Privy credentials to prove) |
| **Receive USDC** | Shipped UI — address, QR, copy, Base + USDC warning, Coinbase send steps |
| Recent activity | Hardcoded empty state — not wired to Privy transactions |
| Grow / yield | Placeholder (Choose Yield). Fake 4.2% APY is UI-only |
| Send, Savings, Card | Placeholder / Coming soon |
| Profile | Read-only synced fields |
| Add Money / Coinbase Headless | **Post-V1.** Code exists (`AddMoneyScreen`, checkout WebView) and is **not mounted** in the V1 tab shell |

## V1 product scope

**App Store V1:** Privy email auth, embedded wallet on Base, **Receive USDC**, real USDC balance, real wallet activity, Grow deposit + withdraw back to the Privy wallet, profile.

**Not V1:** Coinbase Headless / Apple Pay Add Money, bank ACH, bank off-ramp, Dakota, Bridge, virtual card, P2P send, functional Pia.

Details: [`docs/product/V1Scope.md`](../../docs/product/V1Scope.md) · [`docs/V1Architecture.md`](../../docs/V1Architecture.md) · [`docs/build/BuildPlan.md`](../../docs/build/BuildPlan.md).

## Run locally

```bash
npm install
npm run start -w @olimpia/mobile
```

Press `i` for iOS (Expo dev client — not Expo Go). Copy `.env.example` → `.env.local` for Privy + `EXPO_PUBLIC_API_BASE_URL`.

Pinned for iOS compile: Expo **52.0.49**, React Native **0.76.9**, `react-native-svg@15.8.0`.

## Web preview

Marketing app-preview routes (no Expo required): `/app-preview/welcome`, `/app-preview/home` via `npm run dev:marketing`.
