# Olimpia — Testing Checklist

**Status:** Canonical for current V1 sprint  
**Audience:** Founder, QA, developers, Cursor agents  
**Source of truth:** [UserFlows.md](./product/UserFlows.md) · [BuildPlan.md](./build/BuildPlan.md) · [PRD.md](./product/PRD.md) · [Architecture.md](./architecture/Architecture.md)

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

Test **Add Money** (Coinbase Headless → USDC to Privy wallet on Base) and **Transfer USDC**. Do not test Bridge, Dakota, bank withdrawal, or virtual card as V1 paths. Full design: [Architecture.md](./architecture/Architecture.md) · [ADR-013](./architecture/ArchitectureDecisionLog.md).

---

## What this file is for

Manual testing script before TestFlight, public user testing, or App Store submission.

Check each box when behavior matches **Expected result**. Note environment (local, staging, production).

**Pia AI coach chat is Future only.** Card spending is post-V1.

---

## MVP features to test (current architecture)

- Onboarding and invisible Privy wallet
- Dashboard, balance, activity
- **Add Money** (Coinbase Headless Onramp → USDC to Privy wallet on Base)
- **Transfer USDC** (inbound supported USDC on Base)
- Savings goals
- Growth account (Aave) — when shipped
- Send and receive (Olimpia users) — when shipped
- Profile and sign out
- Marketing waitlist + GA4 (production)

**Not in App Store V1 checklist:** bank withdrawal, Gnosis / virtual card, Bridge, Dakota.

---

## 1. Marketing website

- [ ] Site loads at production URL / local `http://localhost:3000`
- [ ] Hero, nav, FAQ, footer (Privacy, Terms, support) work
- [ ] Waitlist accepts valid email; invalid email shows error
- [ ] GA4 fires on production only (waitlist / CTA events as configured)
- [ ] `robots.txt` and `sitemap.xml` load
- [ ] `/privacy` and `/terms` load

---

## 2. API health

- [ ] `GET /health` succeeds on staging
- [ ] Invalid auth token rejected on protected routes
- [ ] **No Bridge webhook route is mounted** (`/webhooks/bridge` absent or returns unused)
- [ ] Production config cannot use `FUNDING_PROVIDER=bridge` or mock funding

---

## 3. Mobile — onboarding and profile

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Fresh install | Welcome screen |
| 2 | Sign up / sign in via Privy | Auth completes; no crypto jargon |
| 3 | Land on Home | No wallet address shown |
| 4 | Profile tab | Name / email from synced API |
| 5 | Sign out | Returns to Welcome |
| 6 | Zero-balance Home | “Your account is ready” + Add Funds; `$0.00` secondary; no immediate-yield claim |

**Platform priority:** iOS device / TestFlight first.

---

## 4. Dashboard and activity

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Home | Balance in **dollars** from backend |
| 2 | Activity list | Plain-language transactions |
| 3 | Tap activity item | Detail: amount, status, date |
| 4 | Pull to refresh / reopen | No crash; data consistent |

---

## 5. Add Funds

**Requires:** Staging API + Coinbase Headless sandbox (or mock in local only) + Base monitor for Transfer USDC

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Tap Add Funds | **Add Money** and **Transfer USDC** appear; no Bridge / Dakota / Coinbase as method labels |
| 2 | Add Money | Amount → Coinbase Headless experience with quote / fee / KYC as applicable |
| 3 | Complete sandbox onramp | Status completes; ledger credited **once**; USDC destination is Privy wallet on Base |
| 4 | Cancel / fail onramp | Safe return; no credit |
| 5 | Transfer USDC | Address, QR, Copy, Base + unsupported-asset warning |
| 6 | Send supported USDC on Base | Backend confirms; activity + balance once |
| 7 | Unsupported token / duplicate event | No credit; no duplicate |
| 8 | Return to Home | Balance and activity refreshed |

---

## 6. Savings goals (before public testing)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Savings | Goals list or empty create |
| 2 | Create goal | Appears without fake APY |
| 3 | Allocate / remove | Available and goal balances stay consistent |
| 4 | Over-allocate | Clear error |

---

## 7. Send and receive (when shipped)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | User A sends to User B | Recipient resolves by approved identifier |
| 2 | Confirm | Processing → completed |
| 3 | User B Home / activity | Incoming transfer; balance up |
| 4 | P2P Receive | Share handle / link — **not** funding Receive USDC |
| 5 | Overspend | Friendly insufficient-funds error |

---

## 8. Growth account (when shipped)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Growth / Choose Yield | Summary; explicit authorization required |
| 2 | Deposit | Funds move from Available |
| 3 | Estimated earnings | Variable, not guaranteed |
| 4 | Withdraw to Available | Balances update |
| 5 | UI | No “Aave” / “DeFi” in user copy |

---

## 9. Provider and security smoke tests

- [ ] Privy login works on iOS
- [ ] Coinbase Headless completion / cancel / fail handled
- [ ] Base monitor rejects wrong token / network / recipient and duplicates
- [ ] Replayed webhooks / events do not double-credit
- [ ] No provider secrets in mobile bundle or marketing source
- [ ] Wallet address only on Transfer USDC safety UI
- [ ] Bridge API keys and webhook secrets absent from staging / production config

---

## 10. App Store submission gate

- [ ] Sections 1–5 pass on staging / TestFlight
- [ ] Production marketing live; Privacy + Terms URLs work
- [ ] Support email monitored
- [ ] iOS archive uploaded to App Store Connect
- [ ] App metadata does not claim bank status or guaranteed yield
- [ ] Launch geography / eligibility documented if restricted — [launch-geography.md](./architecture/launch-geography.md)

---

## 11. Before public user testing (additional)

- [ ] Savings (§6) pass
- [ ] Growth (§8) pass if advertised to testers
- [ ] Send / receive (§7) pass if advertised
- [ ] Stuck-deposit / support playbook exists
- [ ] Withdrawal is **not** offered unless a provider is live

---

## Future — Pia (not V1)

Do not block App Store or public testing on Pia.

---

## Decisions still TBD

| Topic | Notes |
|-------|-------|
| Staging API URL | |
| Coinbase Headless sandbox accounts | |
| Base monitor provider / RPC | |
| Min iOS version | |
| Test users for P2P | |

---

## Related documents

- [BuildPlan.md](./build/BuildPlan.md) — Day 1–4 critical path
- [EnvironmentVariables.md](./EnvironmentVariables.md)
- [DeploymentPlan.md](./DeploymentPlan.md)
