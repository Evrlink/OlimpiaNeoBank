# Olimpia — Deployment Plan (Planning)

**Status:** Aligned with Architecture v3.0 / BuildPlan v3.0  
**Source of truth:** [BuildPlan.md](./build/BuildPlan.md) · [Architecture.md](./architecture/Architecture.md)

---

## Surfaces

| Surface | Technology | Deploy |
|---------|------------|--------|
| Marketing | TanStack Start + Vite | **Vercel** (live pattern) |
| Mobile | React Native / Expo | **iOS App Store first** |
| Backend API | Node.js / Express | Host **TBD** (HTTPS required for webhooks) |

### Supporting services

| Service | Purpose |
|---------|---------|
| Supabase | Marketing waitlist |
| PostgreSQL | App database |
| Privy | Auth + embedded wallets |
| **Coinbase Headless Onramp** | V1 fiat Add Money |
| Base RPC / monitor | Transfer USDC + onramp delivery confirmation |
| Aave on Base | Growth (when shipped) |
| Resend | Optional transactional email |
| GA4 | Marketing analytics (already installed) |

**Not deployed for App Store V1:** Bridge, Dakota, off-ramp provider, Gnosis Pay, Pia/Anthropic.

---

## What exists today

| Component | Status |
|-----------|--------|
| Marketing | Built; Vercel + Supabase waitlist + GA4 |
| API | Auth, ledger, activity, funding module — **funding still Bridge-coupled until Day 1 cleanup** |
| Mobile | Privy auth + shell + Add Money UI; App Store packaging incomplete |
| Main PostgreSQL | Migrations present; host TBD for staging/production |

---

## Sprint deploy sequence

| When | Deploy / provision | Done when |
|------|-------------------|-----------|
| Day 1 | Staging API + Postgres; remove Bridge from config | Health OK; no Bridge env required |
| Day 1–2 | Coinbase sandbox credentials on API | Onramp session creates |
| Day 2–3 | Base monitor config | Transfer USDC / delivery confirm works |
| Day 3 | TestFlight build → staging API | Founder walkthrough on device |
| Day 4 | Production API keys (Privy + Coinbase); App Store archive | Upload ready |

---

## Marketing on Vercel

| Setting | Value |
|---------|-------|
| Root Directory | `apps/marketing` |
| Build | `npm run build` |

Env: `VITE_SUPABASE_*`, optional `VITE_SITE_URL`, `VITE_SUPPORT_EMAIL`, GA4 as configured.

---

## API webhooks (current architecture)

| Provider | Path pattern |
|----------|--------------|
| Coinbase Headless | `https://{api-host}/api/v1/webhooks/coinbase` **TBD confirm Coinbase docs** |
| Base monitor | Provider webhook or secure backend polling **TBD** |

**Do not register Bridge webhook URLs.** Legacy `/webhooks/bridge` is removed in Day 1 cleanup.

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
