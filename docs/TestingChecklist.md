# Olimpia — Testing Checklist (Planning)

**Status:** Planning document for implementation  
**Audience:** Founder, QA, developers, Cursor agents  
**Source of truth:** [UserFlows.md](./product/UserFlows.md) · [BuildPlan.md](./build/BuildPlan.md) · [PRD.md](./product/PRD.md)

---

## What this file is for

This is a **manual testing checklist** — a step-by-step script to confirm Olimpia works before you share it with users or submit to app stores. You do not need to write automated tests to use this document.

Check each box when the behavior matches **Expected result**. If something fails, note what you saw and the environment (local, staging, or production).

**Pia AI coach chat is Future only** — not in MVP checklist below. Marketing may show a static Pia preview; that is not live chat.

---

## How to use this checklist

1. Pick an **environment**: Local · Staging · Production
2. Work **top to bottom** within each section
3. Mark **Pass** or **Fail** (and screenshot if helpful)
4. Do not test provider production flows until sandbox/staging keys are confirmed

---

## MVP features to test (reference)

From approved MVP scope (Pia excluded):

- Onboarding and invisible wallet
- Dashboard, balance, activity
- Add Funds (Dakota bank transfer, Privy fiat onramp, external USDC on Base)
- Withdraw to bank (replacement provider TBD)
- Send and receive (Olimpia users only)
- Savings goals
- Growth account (Aave first)
- Virtual debit card (Gnosis Pay)
- Profile and sign out
- Marketing waitlist

---

## 1. Marketing website

**When:** After Phase 1 deploy (Vercel + Supabase)  
**Reference:** [UserFlows.md](./product/UserFlows.md) marketing flows

### Homepage and content

- [ ] Site loads without errors at production URL **TBD** / local `http://localhost:3000`
- [ ] Hero section: headline, CTAs, paper background visible (may fade in briefly)
- [ ] Navigation links scroll to correct sections
- [ ] “Built on trusted infrastructure” section readable; no visual glitch at hero bottom
- [ ] FAQ accordion opens; answers are readable text (not image-only)
- [ ] Footer: Privacy, Terms, support email links work
- [ ] Page looks acceptable on phone width (responsive)

### Waitlist modal

- [ ] “Download App” opens waitlist modal
- [ ] Valid email → success message
- [ ] Same email again → still treated as success (no error for duplicate)
- [ ] Invalid email → validation error
- [ ] With Supabase env vars missing → friendly “unavailable” error (local test only)

### SEO basics

- [ ] Page `<title>` and meta description present
- [ ] `robots.txt` and `sitemap.xml` load
- [ ] `/privacy` and `/terms` load

### Static Pia preview (marketing only)

- [ ] Pia **preview section** displays static content (if present on site)
- [ ] No live chat input that calls an AI API on the marketing site

**Expected:** Marketing educates and captures waitlist — no wallet, no login, no live Pia.

---

## 2. API health (Phase 0+)

**When:** After first API deploy to staging

- [ ] `GET /health` returns success on staging URL **TBD**
- [ ] API only accepts HTTPS in staging/production
- [ ] Invalid auth token rejected on protected routes **TBD** when auth exists

---

## 3. Mobile — onboarding and profile (Phase 2)

**Reference:** UserFlows onboarding

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open app (fresh install) | Welcome screen |
| 2 | Sign up / sign in via Privy | Auth completes; no crypto jargon |
| 3 | Land on Home or onboarding completion | No wallet address shown |
| 4 | Open Profile tab | Name/email or placeholder profile fields |
| 5 | Sign out | Returns to Welcome; session cleared |
| 6 | View zero-balance Home | “Your account is ready” + Add Funds lead; `$0.00` is secondary; no immediate-yield claim |

**Platforms:** Repeat on **iOS simulator/device** and **Android emulator/device** — **TBD** minimum OS versions.

---

## 4. Dashboard and activity (Phase 3)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Home tab | Balance displays in **dollars** |
| 2 | View activity list | Transactions in plain language |
| 3 | Tap one activity item | Detail screen with amount, status, date |
| 4 | Pull to refresh or reopen app | Data updates without crash |

---

## 5. Add Funds (Phases 4A–4E)

**Requires:** Staging API plus the relevant Dakota, Privy/onramp, and Base-monitor sandbox/test configuration

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Tap Add Funds | Bank Transfer, Apple Pay or Card, and Transfer USDC appear in that order; no provider-name method labels |
| 2 | Bank Transfer | Provider-confirmed arrival, $1 fee after approval, total bank withdrawal, and exact account credit shown before Review Transfer |
| 3 | Complete Dakota sandbox flow | Normalized status completes; ledger credited once |
| 4 | Apple Pay or Card | Supported provider experience opens with final quote/fee and any KYC; no hidden background WebView |
| 5 | Complete/cancel/fail provider flow | App returns to the correct normalized state |
| 6 | Transfer USDC | Address, QR, Copy Address, Coinbase/other-wallet guidance, and prominent Base/USDC warning shown |
| 7 | Send supported USDC on Base | Backend confirms, creates inbound activity, credits once |
| 8 | Send unsupported token / duplicate event | No credit; no duplicate transaction |
| 9 | Return to Home | Balance and activity refreshed |
| 10 | Cancel/close each method | Clear return path; normal navigation retained unless approved focus mode is under test |

---

## 6. Savings goals (Phase 5)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Savings tab | Goals list (empty or existing) |
| 2 | Create new goal (name, target) | Goal appears with 0% or initial progress |
| 3 | Allocate money to goal | Available balance decreases; goal progress increases |
| 4 | Move money out of goal | Available balance increases |
| 5 | Try to spend more than available | Clear error — no silent failure |

---

## 7. Send and receive (Phase 6)

**MVP:** Olimpia-to-Olimpia users only (both need accounts)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | User A: Send → pick User B | Recipient resolves by handle/email **TBD** |
| 2 | Enter amount and confirm | Processing → completed |
| 3 | User B: Home / activity | Incoming transfer visible; balance up |
| 4 | User A: Receive screen | Share handle/link — **no wallet address** |
| 5 | Send more than available | Friendly insufficient-funds error |

---

## 8. Growth account (Phase 8)

**Requires:** Aave integration on Base (sandbox)

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Growth from Savings or Home **TBD** entry | Growth summary |
| 2 | Deposit to growth | Processing → funds in growth |
| 3 | View estimated earnings | Shown with “variable, not guaranteed” tone |
| 4 | Withdraw from growth back to available | Balance updates correctly |
| 5 | UI never says “Aave”, “DeFi”, or “APY optimization” | Brand-aligned copy only |

---

## 9. Withdraw and virtual card (Phase 9)

### Withdraw to bank

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Start withdraw from Home or Profile | Amount + bank destination |
| 2 | Confirm | Processing states in plain English |
| 3 | Complete selected off-ramp sandbox flow | Withdrawal completed; balance down |

### Virtual debit card

| Step | Action | Expected result |
|------|--------|-----------------|
| 1 | Open Card tab | Issue card if first visit |
| 2 | View masked card | Last four digits; no full PAN |
| 3 | Reveal CVV (if MVP includes) | Requires biometric/PIN **TBD** |
| 4 | Freeze card | Status frozen; unfreeze works |
| 5 | If region blocked | Plain-language gate — no provider jargon |

---

## 10. Provider and security smoke tests

Run on **staging** before production.

### Integrations

- [ ] Privy login works on iOS and Android
- [ ] Dakota webhook signature and normalized deposit status handling pass
- [ ] Configured fiat-onramp completion/cancellation/failure handling passes
- [ ] Base monitor rejects wrong token/network/recipient and duplicate events
- [ ] Selected off-ramp webhook updates withdrawal status **TBD provider**
- [ ] Gnosis card webhook creates card transaction **TBD**
- [ ] Resend sends at least one test email **TBD**

### Security (spot checks)

- [ ] No provider secret keys in marketing page source
- [ ] No provider secret keys in mobile app bundle (only public Privy app id + API URL)
- [ ] Wallet address and Base/USDC appear only in Transfer USDC safety UI; gas and provider secrets never appear
- [ ] Webhook endpoint rejects request with wrong/missing signature **TBD**
- [ ] Replayed webhooks and blockchain events do not duplicate ledger credits
- [ ] Card/bank details are not stored by Olimpia unless explicitly required and approved
- [ ] Fee disclosures, limits/velocity controls, audit logs, reconciliation, returned ACH, and chargeback paths are tested as applicable

---

## 11. Pre-release gate (Phase 10)

Before App Store / Google Play submission:

- [ ] Full staging walkthrough: sections 3–9 above all pass
- [ ] Production marketing site live on domain **TBD**
- [ ] Production waitlist stores emails in intended Supabase project
- [ ] Privacy Policy and Terms URLs live and linked
- [ ] Launch geography limitations documented — [launch-geography.md](./architecture/launch-geography.md) **TBD**
- [ ] iOS build uploaded to App Store Connect **TBD**
- [ ] Android build uploaded to Play Console **TBD**
- [ ] Support email monitored — **TBD**

---

## Future — Pia AI coach (not MVP)

When Pia is approved for a later release, add tests such as:

- [ ] Pia opens from Home/Profile entry **TBD**
- [ ] Pia explains product features in plain language
- [ ] Pia **refuses** investment advice (“what stock should I buy?”)
- [ ] Persistent disclaimer visible (coach, not advisor)
- [ ] No Anthropic key in mobile or marketing bundles
- [ ] Rate limiting prevents abuse **TBD**

Do **not** block MVP release on these items.

---

## Decisions still TBD

| Topic | Notes |
|-------|-------|
| Staging URLs | API and marketing preview |
| Test user accounts | Pre-seeded users for P2P tests |
| Dakota / fiat-onramp / off-ramp / Gnosis sandbox test data | Provider-specific |
| Automated tests | Future — MVP uses this manual checklist |
| Min iOS / Android versions | Device matrix **TBD** |
| Biometric gate for CVV reveal | **TBD** |

---

## Related documents

- [UserFlows.md](./product/UserFlows.md) — detailed acceptance criteria per flow
- [ScreenInventory.md](./product/ScreenInventory.md) — screen-by-screen spec
- [DeploymentPlan.md](./DeploymentPlan.md) — where to run tests
- [EnvironmentVariables.md](./EnvironmentVariables.md) — config needed before testing
