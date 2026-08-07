# Olimpia — V1 Build Plan (3–4 Day MVP Sprint)

**Version:** 3.0  
**Status:** Canonical — aggressive completion plan against the **current codebase**  
**PRD:** [PRD.md](../product/PRD.md)  
**Architecture:** [Architecture.md](../architecture/Architecture.md)  
**Scope:** [V1Scope.md](../product/V1Scope.md)  
**Decisions:** [ADR-013](../architecture/ArchitectureDecisionLog.md)

---

## Current MVP Architecture

**Coinbase Headless Onramp + Privy + Base + USDC + Aave is the only active V1 architecture.**

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Headless Onramp → USDC on Base to Privy wallet
  → Olimpia balance / activity → optional Aave Growth
```

This sprint finishes that stack on the **current codebase** (not a rebuild). Day 1 removes legacy Bridge funding code. Do not implement Dakota, multi-provider ACH, or withdrawal. See [Architecture.md](../architecture/Architecture.md) · [ADR-013](../architecture/ArchitectureDecisionLog.md).

This plan assumes we finish the shippable iOS MVP in approximately **3–4 days**, then prepare App Store submission.

---

## Current codebase baseline (do not rebuild)

| Area | Status today |
|------|----------------|
| Marketing (`apps/marketing`) | Live pattern: Vercel + waitlist + GA4 |
| Mobile auth | Privy email OTP, auth sync, session restore — **shipped** |
| Mobile shell | Home, Savings, Card, Profile tabs — **shipped**; Savings/Card/Send/Receive mostly placeholders |
| Mobile Add Money | UI + API client exist; talks to mock / **legacy Bridge** funding path |
| API auth / me / balance / activity | Present under `apps/api/src/routes/v1/` |
| API ledger | `apps/api/src/ledger/` — balances + credit |
| API funding | **Bridge-coupled** (`provider.ts`, `/webhooks/bridge`, `bridge_intent_id`, `FUNDING_PROVIDER=bridge`) |
| Coinbase Headless | **Not implemented** |
| Transfer USDC / Base monitor | **Not implemented** |
| Savings goals / Growth / P2P | Mostly UI stubs or missing |
| App Store packaging | `app.json` minimal; **no** `eas.json`, icons, splash |

---

## Work tiers

### REQUIRED BEFORE APP STORE SUBMISSION

Must be done before uploading to App Store Connect.

1. **Remove Bridge from the active funding path** (Day 1 — blocking)
2. **Coinbase Headless Onramp → USDC to Privy wallet on Base** (Days 1–2)
3. **Ledger credit + activity** for completed onramp deposits (extend existing ledger)
4. **Transfer USDC** screen + Base deposit monitor (minimum viable confirmation)
5. **Home**: real Available balance + recent activity from API
6. **Empty-account → Add Funds** path polished
7. **iOS App Store packaging**: icons, splash, EAS build, privacy questionnaire, support + privacy URLs
8. **Production / staging API** with Privy + Coinbase credentials (no Bridge keys)
9. Legal pages live (Privacy, Terms) and linked from app / marketing

### REQUIRED BEFORE PUBLIC USER TESTING

Needed before inviting real users with real money beyond internal TestFlight.

1. Savings goals (create / allocate / return to Available)
2. Growth Account (Aave deposit / withdraw) with explicit authorization
3. Send / receive between Olimpia users (if not already in submission build)
4. Full funding failure / cancel / reverse playbooks
5. Reconciliation job or manual ops checklist for stuck deposits
6. Support email monitored; fee / KYC / Base-USDC disclosures finalized

### POST-LAUNCH / DEFERRED

1. Bank withdrawal / off-ramp (no provider selected — [ADR-014](../architecture/ArchitectureDecisionLog.md))
2. Virtual debit card
3. Functional Pia
4. Android store submission polish
5. Multi-provider funding, additional chains / assets
6. Admin dashboard, push notifications

---

## Critical path (Day 1 → Day 4)

### Day 1 — Kill Bridge; stand up Coinbase path

**Goal:** No production path can call Bridge. Coinbase Headless session creation is stubbed or sandbox-live.

| Task | Where | Notes |
|------|-------|-------|
| Remove / replace Bridge funding provider | `apps/api/src/funding/provider.ts` | Delete `createBridgeOnRamp`; stop selecting `bridge` |
| Remove Bridge webhook route | `apps/api/src/routes/webhooks/bridge.ts`, `apps/api/src/app.ts` | Unmount `/webhooks/bridge` |
| Replace Bridge env | `apps/api/src/config/env.ts`, `apps/api/.env.example` | Remove `BRIDGE_*`; add Coinbase Headless env vars |
| Rename / migrate deposit provider ref | `apps/api/migrations/*`, `types.ts`, `completeDeposit.ts`, `deposits.ts`, `mappers.ts`, `webhooks.ts` | Replace `bridge_intent_id` with generic `provider_transaction_id` (or equivalent) |
| Keep mock provider for local UI | `funding/provider.ts` | `FUNDING_PROVIDER=mock` for non-production only |
| Start Coinbase Headless session API | New module under `funding/` or `coinbase/` | Create session; destination = Privy wallet, Base, USDC |
| Wire mobile Add Money to new session launch | `AddMoneyScreen.tsx`, `services/api/funding.ts` | Provider-neutral labels |

**Exit criteria:** `FUNDING_PROVIDER=bridge` does not exist. Staging can create a Coinbase (or mock) deposit session without Bridge credentials.

### Day 2 — Complete Add Money + ledger; start Transfer USDC

| Task | Where | Notes |
|------|-------|-------|
| Coinbase completion webhook / poll | API | Idempotent finalize → ledger credit |
| Confirm USDC lands on Privy address | Base monitor or Coinbase status | Same credit path as ledger |
| Activity row for deposit | Existing activity routes | Plain-language copy |
| Transfer USDC UI | New or extend Receive screen | Address, QR, Copy, Base warning |
| Base inbound monitor (MVP) | API | Confirmations + duplicate guard |

**Exit criteria:** One sandbox Add Money completes → balance + activity update once. Transfer USDC screen shows correct Privy address.

### Day 3 — Product surfaces for a credible V1

| Task | Where | Notes |
|------|-------|-------|
| Home empty + funded states | Mobile | One clear next action |
| Savings goals MVP | Mobile + API | Logical envelopes; no fake APY |
| Growth entry (if time) | ChooseYield + API Aave adapter | Else ship Growth as Coming soon with honest copy — **prefer ship real Aave if hours allow** |
| Send / Receive | Mobile + API | Prefer ship; if cut, move to “before public testing” |
| End-to-end iOS TestFlight build | EAS | Against staging API |

**Exit criteria:** Founder can walk Welcome → Auth → Add Money (sandbox) → Home balance on a device build.

### Day 4 — App Store submission readiness

| Task | Notes |
|------|-------|
| App icon, splash, display name | `app.json` / assets |
| `eas.json` + production profile | Bundle `app.olimpia.mobile` |
| Privacy Policy / Terms / support URL | Marketing already has routes — confirm production domain |
| App Store Connect metadata | Screenshots, description, age rating, finance disclosures |
| Remove debug / mock-only paths from production builds | Mock funding forbidden in production |
| Smoke test checklist | [TestingChecklist.md](../TestingChecklist.md) — App Store section |
| Submit or upload for review | Depends on Apple account readiness |

**Exit criteria:** Archive uploaded (or ready to upload) with no Bridge dependency and working Coinbase sandbox path documented for reviewers if needed.

---

## Explicit Day 1 Bridge removal checklist

Do not leave Bridge as “deprecated but still callable.”

- [ ] `createBridgeOnRamp` removed
- [ ] `/webhooks/bridge` unmounted and file deleted or moved out of active tree
- [ ] `BRIDGE_API_KEY`, `BRIDGE_WEBHOOK_SECRET`, `BRIDGE_API_BASE_URL` removed from env resolution and `.env.example`
- [ ] `resolveFundingProvider()` no longer returns `"bridge"`; production uses Coinbase (or fails closed)
- [ ] `bridge_intent_id` column / fields replaced or migrated
- [ ] Docs and READMEs no longer describe Bridge as active (this plan + Architecture v3.0)
- [ ] Smoke: production config cannot start a Bridge transfer

---

## What not to build in this sprint

- Multi-provider `BankTransferProvider` / Dakota adapter
- Configurable Privy Fiat Onramp provider matrix
- Withdrawal / off-ramp UI backed by a nonexistent provider
- Gnosis Pay card
- Pia chat
- LI.FI routing unless a concrete send path requires it
- Heavy new abstraction layers beyond FundingService + LedgerService

---

## Risk blockers that can prevent App Store submission

| Blocker | Why it matters | Mitigation |
|---------|----------------|------------|
| Bridge still in production funding path | Wrong provider; compliance / ops / broken deposits | Day 1 removal — non-negotiable |
| Coinbase Headless credentials or RN/iOS support gap | No fiat Add Money | Validate Day 1 morning; fall back to Transfer USDC-only only if founder accepts |
| Privy production app / bundle ID mismatch | Auth fails in TestFlight / review | Confirm Privy dashboard iOS config Day 1 |
| No Base USDC confirmation | Credits without finality or missed Transfer USDC | MVP monitor before submission |
| Missing Privacy Policy / support URL | Apple rejection | Marketing pages + App Store Connect fields |
| Missing icons / splash / EAS | Cannot archive | Day 4 morning dedicated |
| Apple Developer account / agreements | Cannot submit | Founder checklist Day 1 |
| Claiming banking / guaranteed yield in metadata | Review rejection | Align copy with PRD |

---

## Mapping old phases → this sprint

| Old BuildPlan v2 phase | Disposition |
|------------------------|-------------|
| 0–3 Foundation / auth / dashboard | Largely done — polish only |
| 4A Funding cleanup | **Day 1 Bridge removal** |
| 4C Dakota ACH | **Cancelled** — not in architecture |
| 4D Privy Fiat Onramp | **Replaced** by Coinbase Headless |
| 4B Transfer USDC | **Day 2** |
| 4E Reconciliation | Before public testing |
| 5 Savings | Day 3 / before public testing |
| 6 Send / receive | Day 3 or before public testing |
| 7 Growth / Aave | Day 3 if capacity; else before public testing |
| 8 Withdrawal | **Deferred** |
| 9 Hardening / stores | **Day 4** iOS focus |

---

*End of Build Plan v3.0*
