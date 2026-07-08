# Olimpia — V1 Launch Scope (Founder Confirmed)

**Status:** Approved  
**Last updated:** 2026-07-07  
**Related:** [PRD.md](./PRD.md) · [BuildPlan.md](../build/BuildPlan.md) · [Architecture.md](../architecture/Architecture.md)

---

## What V1 means

**V1** is the first public MVP launch of the Olimpia mobile app (iOS + Android). Users must be able to complete the **full basic money loop** and manage money with confidence:

**Add money → hold balance → save in goals → earn USDC yield → send → receive → withdraw**

Without **on-ramp and off-ramp**, the app does not serve its core purpose. V1 is not a preview or auth-only release.

Balances are presented in **dollars**, not crypto. Privy, Base, USDC, Bridge, and yield protocols operate invisibly behind the scenes.

---

## V1 — In scope (working features at launch)

| Capability | User sees | Integration / implementation |
|------------|-----------|----------------------------|
| **Privy email authentication** | Welcome → email OTP → authenticated app | **Privy** |
| **Embedded wallet** | Automatic; no keys or wallet UI | **Privy** on **Base** |
| **Backend auth sync** | Account created on first login | `POST /api/v1/auth/sync` |
| **Session restore** | Returning users land on Home | Privy session + `GET /api/v1/me` |
| **Add money (on-ramp)** | Fund from bank; balance updates | **Bridge.xyz** on-ramp |
| **Withdraw (off-ramp)** | Cash out to linked bank | **Bridge.xyz** off-ramp |
| **Send money** | Pay another user by contact/handle | Olimpia ledger + P2P (Build Phase 6) |
| **Receive money** | Share link / username; incoming payments | Olimpia ledger + P2P (Build Phase 6) |
| **Home balance** | Greeting, total balance, quick actions | Olimpia API (`GET /me`, balance fields) |
| **Activity history** | Recent transfers on Home; detail on tap | `GET /activity`, transaction detail (Build Phase 3) |
| **Savings goals** | Create goals, allocate funds, track progress | Build Phase 5 — ledger goal envelopes |
| **USDC yield** | Growth on allocated savings; estimated earnings | Build Phase 8 — single yield provider on Base |
| **Profile** | Account info, sign out | `GET /me` |
| **Pia (preview only)** | Static **Coming soon** card on Profile | No chat, input, or AI |

**USD ↔ USDC conversion** (Add money and Withdraw) is **invisible** — users never swap manually.

---

## V1 — Out of scope

| Capability | Notes |
|------------|--------|
| **Functional Pia AI coach** | Profile shows static Coming soon preview only — no live chat (Build Phase 7 / Future) |
| **Card spending / virtual debit card** | Gnosis Pay — **post-V1** (Build Phase 9 card work) |
| **Push notifications, physical card, multi-provider yield** | Later MVP / post-launch |

The **Card** tab may show a placeholder before V1 launch; **functional card spend is not V1**. **Savings** and **Growth/yield are V1 requirements**, not placeholders at launch.

---

## Money flows (V1)

**Provider:** [Bridge.xyz](https://bridge.xyz) (Architecture: **BridgeXYZ**) for fiat on-ramp and off-ramp.

### Add money (on-ramp)

```
User taps Add money
    → Mobile calls Olimpia API (POST /funding/deposits)
    → Backend creates Bridge on-ramp intent
    → User completes bank flow in Bridge-hosted UI
    → Bridge converts USD → USDC and settles to embedded wallet on Base
    → Bridge webhook → Olimpia credits ledger → Home balance updates
```

### Withdraw (off-ramp)

```
User taps Withdraw
    → Mobile calls Olimpia API (POST /funding/withdrawals)
    → Backend creates Bridge off-ramp intent
    → User confirms amount and destination bank
    → Bridge converts USDC → USD and sends to bank
    → Bridge webhook → Olimpia debits ledger → Home balance updates
```

### Send / Receive (P2P)

```
Send: Home → Send → recipient + amount → confirm → ledger transfer → activity updates
Receive: Home → Receive → share link/username → payer sends → incoming activity on Home
```

### Savings goals & USDC yield

```
Savings: Create goal → allocate from available balance → progress on Home and Savings tab
Yield: Deposit to Growth from available or goal context → estimated earnings → withdraw back to available
```

**What the user experiences:** A neobank — add, save, grow, send, receive, withdraw in dollars.  
**What happens in infrastructure:** Privy wallet on Base, Bridge for bank in/out, Olimpia ledger, single yield provider for Growth.

### Stack roles in V1

| Provider | Role in V1? |
|----------|-------------|
| **Privy** | Yes — auth, embedded wallet |
| **Base** | Yes — USDC settlement network |
| **Bridge.xyz** | Yes — **USD in and USD out** (on-ramp + off-ramp) |
| **Olimpia API** | Yes — ledger, sync, goals, activity, P2P |
| **Yield (Aave / Morpho / etc.)** | Yes — **USDC yield** (single provider; Build Phase 8) |
| **LI.FI** | No for V1 core loop — later hidden routing |
| **Gnosis Pay** | No — **card is post-V1** |
| **Anthropic / Pia API** | No — functional Pia is post-V1 |

---

## Implementation phasing vs. product V1

Engineering may ship incrementally before launch, but **V1 public launch requires all working features in the in-scope table above** — not auth and Home alone.

| Build phase | Delivers toward V1 |
|-------------|-------------------|
| **Phase 2** | Privy auth, auth sync, session restore, tab shell, Profile, Pia Coming soon preview |
| **Phase 3** | Home balance, **activity history**, transaction detail (**V1 required**) |
| **Phase 4** | **Add money** — Bridge on-ramp (**V1 required**) |
| **Phase 5** | **Savings goals** — create, allocate, progress (**V1 required**) |
| **Phase 6** | **Send & receive** — P2P (**V1 required**) |
| **Phase 8** | **USDC yield** — Growth account (**V1 required**) |
| **Phase 9 (withdraw only)** | **Withdraw to bank** — Bridge off-ramp (**V1 required**) |
| Phase 9 (card) | Virtual debit card — **post-V1** |
| Phase 7 / Future | Functional Pia AI chat — **post-V1** |

Until these phases are complete, related UI may show **Coming soon** in development builds — but **V1 launch is blocked** until every in-scope feature works end-to-end.

---

## Copy and UI rules (unchanged)

- **Neobank default:** Home and money screens speak in dollars — no Bridge, USDC, Base, or wallet in user-facing copy (see MobilePhase2ScreenBrief §1.4).
- **Onboarding education (You're in):** USD, USDC, bank, and yield may appear on the confirmation screen only, with disclaimer.

---

## Confirmation (founder decision, 2026-07-07)

> **V1 requires:** Privy email auth, embedded wallet, auth sync, session restore, **Add money**, **Withdraw**, **Send**, **Receive**, Home balance, activity history, **savings goals**, and **USDC yield** — all working at launch. **Pia** remains a visible **Coming soon** preview only. **Card spending is post-V1.**
