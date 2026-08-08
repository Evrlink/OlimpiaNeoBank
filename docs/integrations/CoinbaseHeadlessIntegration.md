# Coinbase Headless Onramp — Olimpia V1

**Status:** Implementation source of truth for Add Money  
**Architecture:** [Architecture.md](../architecture/Architecture.md) · [ADR-013](../architecture/ArchitectureDecisionLog.md)  
**Env names:** [EnvironmentVariables.md](../EnvironmentVariables.md) · `apps/api/.env.example`  
**Execution:** [MVPLaunchChecklist.md](../MVPLaunchChecklist.md)

Olimpia V1 funds via **CDP Headless Onramp (Guest Checkout / Apple Pay)** only.

```text
User → Privy auth → Privy embedded wallet
  → Coinbase Verification (email + US phone)
  → POST /platform/v2/onramp/orders
  → paymentLink in iOS WebView (Apple Pay)
  → USDC on Base to Privy wallet
  → onramp.transaction.* webhook / Get Order
  → finalizeDepositStatus (ledger once)
```

**Not used:** Bridge.xyz, Dakota, Coinbase App/Exchange/Commerce, CDP Wallets, Onramp Session widget, Offramp, Google Pay.

---

## Official documentation (implement against these only)

| Document | Why |
|----------|-----|
| [Headless Onramp overview](https://docs.cdp.coinbase.com/onramp/headless-onramp/overview) | Product rules: destination wallet, Base + USDC, `GUEST_CHECKOUT_APPLE_PAY`, WebView `paymentLink`, exact `onramp_api.*` events, ToS / `agreementAcceptedAt`, sandbox `partnerUserRef` prefix `sandbox-`, `&useApplePaySandbox=true` |
| [Create an onramp order](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/create-an-onramp-order) | Only order API. Send **`partnerOrderRef`** = Olimpia `deposit.id`. Runtime correlation for webhooks / Get Order is Coinbase **`orderId`** stored as `provider_transaction_id`. Do **not** use `clientOrderId`. Do **not** use Create Onramp Session |
| [Onramp verification](https://docs.cdp.coinbase.com/onramp/headless-onramp/verification) | Email + US phone must be verified before Create Order. Sandbox OTP values |
| [Initiate onramp verification](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/initiate-onramp-verification) | `POST /v2/onramp/verifications` |
| [Submit onramp verification](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/submit-onramp-verification) | `POST /v2/onramp/verifications/{verificationId}/submit` |
| [Get an onramp order by ID](https://docs.cdp.coinbase.com/api-reference/v2/rest-api/onramp/get-an-onramp-order-by-id) | Reconcile when webhooks cannot reach localhost |
| [Onramp & Offramp webhooks](https://docs.cdp.coinbase.com/webhooks/onramp) | Subscribe to the four `onramp.transaction.*` events |
| [Verify webhook signatures](https://docs.cdp.coinbase.com/webhooks/verify-signatures) | `X-Hook0-Signature` on the **raw** body |
| [API authentication](https://docs.cdp.coinbase.com/api-reference/v2/authentication) | CDP Secret API Key → JWT Bearer for `api.cdp.coinbase.com` |

Event payload refs (same webhook surface): [created](https://docs.cdp.coinbase.com/api-reference/v2/webhooks/webhook-onramp-transaction-created) · [success](https://docs.cdp.coinbase.com/api-reference/v2/webhooks/webhook-onramp-transaction-success) (and matching updated / failed pages).

---

## Fixed V1 parameters

| Field | Value |
|-------|--------|
| `destinationAddress` | Privy embedded wallet |
| `destinationNetwork` | `base` |
| `purchaseCurrency` | `USDC` |
| `paymentCurrency` | `USD` |
| `paymentMethod` | `GUEST_CHECKOUT_APPLE_PAY` (iOS) |
| `partnerOrderRef` | Olimpia `deposit.id` |
| `partnerUserRef` | sandbox: `sandbox-{olimpiaUserId}` · production: `{olimpiaUserId}` |
| Email + phone | Coinbase Verification IDs (`emailVerificationId`, `smsVerificationId`) |
| `agreementAcceptedAt` | ISO timestamp after in-app Guest Checkout ToS / UA / Privacy |

---

## Endpoint inventory

### Coinbase CDP (`https://api.cdp.coinbase.com`)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/platform/v2/onramp/verifications` | CDP JWT | Start email or SMS OTP |
| `POST` | `/platform/v2/onramp/verifications/{verificationId}/submit` | CDP JWT | Submit 6-digit OTP |
| `POST` | `/platform/v2/onramp/orders` | CDP JWT | Create Headless order + `paymentLink.url` |
| `GET` | `/platform/v2/onramp/orders/{orderId}` | CDP JWT | Reconcile status when webhooks are unavailable |

JWT is per-request (method + host + path), ES256 (PEM EC) or EdDSA (base64 Ed25519), ~2 minute expiry.

### Olimpia API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/v1/funding/verifications` | Privy Bearer | Proxy initiate verification |
| `POST` | `/api/v1/funding/verifications/:id/submit` | Privy Bearer | Proxy submit OTP |
| `POST` | `/api/v1/funding/deposits` | Privy Bearer + optional `Idempotency-Key` | Create deposit + Coinbase order |
| `GET` | `/api/v1/funding/deposits/:id` | Privy Bearer | Poll deposit status |
| `POST` | `/api/v1/funding/deposits/:id/cancel` | Privy Bearer | User cancel / abandon — **no credit** |
| `POST` | `/api/v1/funding/deposits/:id/reconcile` | Privy Bearer | Get Order fallback |
| `POST` | `/webhooks/coinbase` | `X-Hook0-Signature` (raw JSON) | CDP onramp transaction events |

Local mock (`FUNDING_PROVIDER=mock`, non-production only) bypasses Coinbase and settles in-process. Production **must** use Coinbase.

---

## WebView postMessage events (`onramp_api.*`)

Exact names from Headless overview. Do **not** use `polling_failure`.

| Event | App handling |
|-------|----------------|
| `onramp_api.load_pending` | Loading |
| `onramp_api.load_success` | Pay button ready — user must tap Apple Pay (user gesture) |
| `onramp_api.load_error` | Show localized error; new order if link invalid |
| `onramp_api.commit_success` | Payment started — keep WebView; deposit stays `processing` |
| `onramp_api.commit_error` | Fail UI; no credit |
| `onramp_api.cancel` | Cancel deposit via API; **no credit**. Webhooks do not emit terminal fail on abandon |
| `onramp_api.polling_start` | Coinbase polling status |
| `onramp_api.polling_success` | Funds sent — wait for webhook / reconcile / `GET deposit` for ledger truth |
| `onramp_api.polling_error` | Processing error; no credit unless Get Order later shows completed |

iOS: `react-native-webview` + `cbOnramp` / `ReactNativeWebView.postMessage`. Do not use Safari View Controller as primary checkout.

---

## Webhook events (`onramp.transaction.*`)

Subscribe **all four**. Ignore other CDP event types.

| Event | Olimpia deposit | Ledger |
|-------|-----------------|--------|
| `onramp.transaction.created` | `processing` only | **Never credit** |
| `onramp.transaction.updated` | `processing` only | **Never credit** |
| `onramp.transaction.success` | `completed` | Credit **once** via `finalizeDepositStatus` |
| `onramp.transaction.failed` | `failed` | No credit |

Routing: prefer documented header **`X-Event-Type`**, then payload `type` / `eventType`.

Correlation (primary → fallback):

1. Coinbase **`orderId`** (Headless sample) / `transactionId` (guest sample) → `deposits.provider_transaction_id`
2. Optional **`partnerOrderRef`** → `deposits.id` if present

Get Order is keyed only by **`orderId`**. The published `OnrampOrder` schema does not include `partnerOrderRef`.

Idempotency:

1. `webhook_events (provider, event_id)` unique — replay of the same event is a no-op after processing.
2. `finalizeDepositStatus` takes `FOR UPDATE` on the deposit; if status is already `completed` or `failed`, it returns without a second credit.

Signature: `X-Hook0-Signature` (`t`, `v0` preferred, `v1` fallback) over the **raw** body. `/webhooks/coinbase` uses `express.raw`, not `express.json`.

---

## Verification flow

```text
Add Money amount
  → Review + accept Coinbase Guest Checkout ToS / UA / Privacy
      (sets agreementAcceptedAt)
  → POST /api/v1/funding/verifications  channel=email
  → Submit OTP → emailVerificationId
  → POST /api/v1/funding/verifications  channel=sms
  → Submit OTP → smsVerificationId
  → POST /api/v1/funding/deposits
      (agreementAcceptedAt + both verification IDs)
  → WebView paymentLink
```

Both channels are required before Create Order. Phone must be re-verified at least every 60 days (Coinbase rule). Production Verification APIs require Onramp allowlisting; **sandbox does not**.

---

## Environment variables (API only — never in the mobile bundle)

| Variable | Required | Purpose |
|----------|----------|---------|
| `FUNDING_PROVIDER` | Yes | `mock` (non-production) or `coinbase`. `bridge` is rejected |
| `COINBASE_ONRAMP_API_KEY` | Coinbase path | CDP Secret API Key ID |
| `COINBASE_ONRAMP_API_SECRET` | Coinbase path | CDP Secret (PEM EC or base64 Ed25519) |
| `COINBASE_WEBHOOK_SECRET` | Webhooks | Subscription secret from CDP Portal |
| `COINBASE_SANDBOX` | Optional | Default `true` outside production. Prefixes `partnerUserRef` with `sandbox-` and appends `useApplePaySandbox=true` |
| `COINBASE_PROJECT_ID` | Portal / CLI only | **Not loaded by the API.** Required when creating the CDP webhook subscription (`labels.project`) |

Production: `FUNDING_PROVIDER=mock` is forbidden; missing Coinbase keys fail closed (no mock fallback).

---

## Sandbox testing notes

From Headless overview + Verification docs:

| Input | Sandbox value |
|-------|----------------|
| `partnerUserRef` | Prefix with `sandbox-` (e.g. `sandbox-{userId}`) |
| Payment link | Append `&useApplePaySandbox=true` |
| Email destination | Any address ending in `@sandbox.test` |
| SMS destination | Any number prefixed with `+1000` (e.g. `+10005550100`) |
| OTP code | `000000` (any other code fails) |
| Local embed | `http://localhost` / simulator allowed without domain allowlist |
| Card charge | Sandbox orders succeed without charging a real card |

Webhook delivery still needs a **public HTTPS** URL (tunnel or staging). Localhost cannot receive CDP webhooks. Until then, use WebView `polling_success` + `POST /api/v1/funding/deposits/:id/reconcile` (Get Order).

Duplicate webhook test: replay `onramp.transaction.success` → deposit stays `completed`, available balance unchanged, one activity row.

---

## Production requirements

1. CDP production Secret API Key ID + Secret.
2. Apply for Headless Onramp production access.
3. Onramp Verification allowlisting (production OTP).
4. Public HTTPS API + webhook URL subscribed to all four `onramp.transaction.*` events.
5. `COINBASE_SANDBOX=false` (or `NODE_ENV=production`) — no `sandbox-` prefix, no `useApplePaySandbox`.
6. Real US cell (not VoIP); US-only Headless.
7. In-app Guest Checkout ToS / User Agreement / Privacy acceptance (`agreementAcceptedAt`).
8. Apple device testing (real Apple Pay user gesture). Simulator sandbox popup is not sufficient for App Store.
9. Mock funding disabled.

---

## Ledger rule (do not change)

Credit **only** through existing `finalizeDepositStatus` → `creditAvailableForCompletedDeposit`.

- `created` / `updated` / cancel / `commit_error` / `polling_error` → never credit.
- `success` / Get Order `ONRAMP_ORDER_STATUS_COMPLETED` → credit once.
- Already terminal deposit → no second credit.

---

## Code map

| Area | Path |
|------|------|
| CDP JWT | `apps/api/src/funding/coinbase/auth.ts` |
| Create / Get Order + Verification client | `apps/api/src/funding/coinbase/client.ts` |
| Webhook signature | `apps/api/src/funding/coinbase/signature.ts` |
| Provider seam | `apps/api/src/funding/provider.ts` |
| Verification service | `apps/api/src/funding/verification.ts` |
| Webhook handler | `apps/api/src/funding/webhooks.ts` |
| Webhook route | `apps/api/src/routes/webhooks/coinbase.ts` |
| Funding routes | `apps/api/src/routes/v1/funding.ts` |
| Add Money UI | `apps/mobile/src/screens/AddMoneyScreen.tsx` |
| Checkout WebView | `apps/mobile/src/components/CoinbaseCheckoutWebView.tsx` |
