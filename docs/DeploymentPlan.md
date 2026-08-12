# Olimpia — Deployment Plan (Planning)

**Status:** Aligned with simplified V1 (Architecture v4.0 / ADR-015)  
**Source of truth:** [MVPLaunchChecklist.md](./MVPLaunchChecklist.md) · [V1Architecture.md](./V1Architecture.md) · [BuildPlan.md](./build/BuildPlan.md)

---

## Surfaces

| Surface | Technology | Deploy |
|---------|------------|--------|
| Marketing | TanStack Start + Vite | **Vercel** (live pattern) |
| Mobile | React Native / Expo | **iOS App Store first** |
| Backend API | Node.js / Express | Host **TBD** (HTTPS required for webhooks / monitors) |

### Supporting services

| Service | Purpose |
|---------|---------|
| Supabase | Marketing waitlist |
| PostgreSQL | App database |
| Privy | Auth + embedded wallets |
| Base RPC / monitor | **V1** Receive USDC confirmation |
| Aave on Base | Grow (when shipped) |
| **Coinbase Headless Onramp** | **Post-V1** fiat Add Money (code preserved) |
| Resend | Optional transactional email |
| GA4 | Marketing analytics (already installed) |

**Not deployed for App Store V1:** Bridge, Dakota, off-ramp provider, Gnosis Pay, Pia/Anthropic.

---

## What exists today

| Component | Status |
|-----------|--------|
| Marketing | Built; Vercel + Supabase waitlist + GA4 |
| API | Auth, ledger, activity; Coinbase funding preserved (post-V1); Base receive monitor **not built** |
| Mobile | Privy auth + shell; Receive USDC stub; Add Money UI preserved for post-V1; App Store packaging incomplete |
| Main PostgreSQL | Migrations present; host TBD for staging/production |

---

## Deploy sequence (simplified V1)

| When | Deploy / provision | Done when |
|------|-------------------|-----------|
| Early | Staging API + Postgres + Privy | Health OK; auth sync works |
| Critical | Base monitor / RPC config | Receive USDC confirmation works |
| Critical | TestFlight build → staging API | Founder walkthrough: receive USDC → balance → activity |
| When Grow ready | Aave / Grow credentials + config | Deposit + withdraw verified |
| Packaging | App Store archive; Privacy/Terms URLs | Upload ready |
| Post-V1 | Coinbase production credentials + webhook URL | Fiat Add Money optional |

---

## Marketing on Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `apps/marketing` |
| Build | `npm run build` |

Env: `VITE_SUPABASE_*`, optional `VITE_SITE_URL`, `VITE_SUPPORT_EMAIL`, GA4 as configured.

---

## API webhooks / monitors (current architecture)

| Provider | Path pattern |
|----------|--------------|
| Base monitor | Provider webhook or secure backend polling **TBD** (required for V1 Receive) |
| Coinbase Headless | `https://{api-host}/webhooks/coinbase` — **post-V1**; preserve route |

**Do not register Bridge webhook URLs.** Bridge funding path is removed from the active API.

---

## Mobile release (iOS first)

| Step | Notes |
|------|-------|
| Apple Developer account | Required |
| Bundle ID | `app.olimpia.mobile` (from `app.json`) |
| EAS / archive | Add `eas.json`; icons + splash |
| Privy iOS config | Match bundle ID + scheme `olimpia` |
| TestFlight | Staging API first |
| App Store Connect | Privacy Policy, Terms, support URL |

Android Play submission is post–iOS priority unless capacity remains.

---

## Related documents

- [EnvironmentVariables.md](./EnvironmentVariables.md)
- [TestingChecklist.md](./TestingChecklist.md)
- [BuildPlan.md](./build/BuildPlan.md)
