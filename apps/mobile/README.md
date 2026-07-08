# Mobile App

React Native **Olimpia** app for **iOS and Android**.

## Current implementation

| Area | Status |
|------|--------|
| Welcome, Auth (Privy email OTP), You're in | Shipped |
| Auth sync (`POST /api/v1/auth/sync`) | Shipped |
| Session restore on cold start (`GET /api/v1/me`) | Shipped |
| Authenticated 4-tab shell (Home, Savings, Card, Profile) | Shipped |
| Home — synced user greeting + balance | Shipped |
| Savings, Card | Placeholder **Coming soon** screens (non-functional) |
| Profile | Read-only — name, email, balance, account created (from synced API data) |
| Add money, Send, Receive | **Coming soon** UI (non-functional until V1 funding) |

## V1 product scope (founder confirmed)

**V1 requires working features at launch:** Privy email auth, embedded wallet, backend sync, session restore, **Add money** and **Withdraw** via [Bridge.xyz](https://bridge.xyz), **Send** and **Receive**, Home balance, activity history, **savings goals**, and **USDC yield**.

**Not in V1:** functional Pia (Profile **Coming soon** preview only), **card spending / virtual card**.

Most V1 features are **not live yet** in the current build — see Build Plan Phases 3–6, 8, and 9 (withdraw). Details: [`docs/product/V1Scope.md`](../../docs/product/V1Scope.md).

## Run locally

```bash
npm install
npm run start -w @olimpia/mobile
```

Press `i` for iOS simulator or `a` for Android emulator (requires Expo dev build — not Expo Go).

Copy `apps/mobile/.env.example` → `.env.local` and set Privy + `EXPO_PUBLIC_API_BASE_URL`.

## Web preview (marketing repo)

High-fidelity browser previews (no Expo required):

- `/app-preview/welcome`
- `/app-preview/home`

```bash
npm run dev:marketing
```

## Out of scope (current sprint)

- V1 money loop, savings goals, USDC yield, and activity (Build Phases 3–6, 8, 9 withdraw — not live yet)
- Virtual card spending (post-V1)
- Marketing site — see `apps/marketing/`
