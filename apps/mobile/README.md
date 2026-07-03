# Mobile App

React Native **Olimpia** app for **iOS and Android**.

## Phase 2 scaffold

- **Welcome (A1)** — approved copy + static gradient (`src/screens/WelcomeScreen.tsx`)
- **Empty Home (A4 · State 1)** — brief §3.4 layout (`src/screens/EmptyHomeScreen.tsx`)
- **4-tab bar chrome** on Home preview (`src/components/AppTabBar.tsx`)
- **Theme tokens** aligned with `apps/marketing/src/styles.css` (`src/theme/colors.ts`)

## Run locally

```bash
npm install
npm run start -w @olimpia/mobile
```

Press `i` for iOS simulator or `a` for Android emulator (requires Expo Go or dev build).

## Web preview (marketing repo)

High-fidelity browser previews (no Expo required):

- `/app-preview/welcome`
- `/app-preview/home`

```bash
npm run dev:marketing
```

## Out of scope

- Privy auth, backend sync, other tabs (Savings/Card/Profile shells)
- Marketing site — see `apps/marketing/`
