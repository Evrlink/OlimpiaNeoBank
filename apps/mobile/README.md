# Mobile App

React Native / Expo **Olimpia** app — **iOS first** for App Store submission.

## Current implementation

| Area | Status |
|------|--------|
| Welcome, Auth (Privy email OTP), You're in | Shipped |
| Auth sync (`POST /api/v1/auth/sync`) | Shipped |
| Session restore (`GET /api/v1/me`) | Shipped |
| Authenticated 4-tab shell (Home, Savings, Card, Profile) | Shipped |
| Home — synced user + balance | Shipped |
| Add Money UI + funding API client | Present — must move off legacy Bridge to **Coinbase Headless** |
| Savings, Card, Send, Receive | Placeholder / Coming soon (except where wired) |
| Profile | Read-only synced fields |

## V1 product scope

**App Store V1:** Privy auth + embedded wallet, **Add Money** (Coinbase Headless → USDC on Base to Privy wallet), **Transfer USDC**, balance + activity, savings goals, optional Growth (Aave), profile.

**Deferred:** bank withdrawal, virtual card spending, functional Pia.

Details: [`docs/product/V1Scope.md`](../../docs/product/V1Scope.md) · sprint plan: [`docs/build/BuildPlan.md`](../../docs/build/BuildPlan.md).

## Run locally

```bash
npm install
npm run start -w @olimpia/mobile
```

Press `i` for iOS (Expo dev client — not Expo Go). Copy `.env.example` → `.env.local` for Privy + `EXPO_PUBLIC_API_BASE_URL`.

## Web preview

Marketing app-preview routes (no Expo required): `/app-preview/welcome`, `/app-preview/home` via `npm run dev:marketing`.
