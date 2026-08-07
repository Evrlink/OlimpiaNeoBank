# Dakota Sandbox API Evaluation

> **HISTORICAL / SUPERSEDED — do not use for implementation.**  
> Archived 2026-08-07. Dakota is **not** part of the active V1 architecture.  
> Current funding provider: **Coinbase Headless Onramp** ([ADR-013](../../architecture/ArchitectureDecisionLog.md), [Architecture.md](../../architecture/Architecture.md)).  
> This file is retained only as a record of past provider research.

**Date:** 2026-07-21  
**Scope:** Technical evaluation only — no app integration, no production code changes, no commits.  
**Environments used:** `https://api.platform.sandbox.dakota.xyz`, docs at `https://docs.dakota.xyz/`  
**SDK tested:** `@dakota-xyz/ts-sdk` (installed outside the repo in `/tmp/dakota-eval`)  
**Secrets:** Sandbox API key used via shell env only. **Not stored in this repo.** Rotate the key after evaluation if it was shared in chat.

---

## Executive Summary

Dakota is a **regulated stablecoin money-movement platform**, not a traditional consumer bank. For Olimpia’s V1 “Bank Transfer” path, the sandbox supports the core outcome we need:

> User sends USD via ACH/wire into a Dakota-issued virtual bank account → Dakota converts to **USDC** → Dakota sends USDC to an **external wallet address on Base**.

That destination can be a **Privy embedded wallet address**. Dakota’s own wallet product is optional and is **not required** for the ACH onramp path.

**Sandbox proof completed in this evaluation:**

| Step | Result |
|------|--------|
| Authenticate with sandbox API key | ✅ `GET /customers` → 200 |
| Base network support | ✅ `base-mainnet` + `base-sepolia` in `/capabilities/networks` |
| Individual customer + hosted KYC application | ✅ Exists; sandbox `kyb_approve` → `kyb_status: active` |
| Crypto destination = external EVM address on Base testnet | ✅ Created on `base-sepolia` |
| Onramp account (ACH/US bank → USDC) | ✅ Returns Lead Bank virtual account details |
| Simulate ACH inbound $1 | ✅ Accepted |
| Auto-transaction completion | ✅ `status: completed`, `output: 1 USDC`, on-chain `transaction_hash` on `base-sepolia` |

**Recommendation: ⚠️ Need More Information**

Dakota looks **technically viable** for a replaceable `BankTransferProvider`, and sandbox evidence for **ACH → USDC on Base → external Privy address** is strong. Before a Go decision, resolve remaining open questions — especially **virtual account naming / account holder**, **production settlement timing**, **Privy/Sumsub identity reuse in practice**, and **commercial/compliance terms**. Public docs/API strongly indicate **push-to-virtual-account** funding (not Plaid-style debit pull); confirm with Dakota whether any undocumented debit-pull product exists.

---

## Product and Onboarding Questions

Investigation date: 2026-07-21. Sources: Dakota OpenAPI (`https://docs.dakota.xyz/openapi.yaml`), docs (`Common Flows`, `Sumsub Token Sharing`, customer/onboarding API reference), `@dakota-xyz/ts-sdk`, and sandbox API behavior. **No guessing:** each item is classified as Confirmed / Indicated / Cannot determine.

### Classification key

| Label | Meaning |
|-------|---------|
| **Confirmed by API or documentation** | Explicit in OpenAPI schema, published docs, SDK types, or observed sandbox behavior |
| **Indicated but not confirmed** | Strongly suggested by docs/examples, but not an absolute product guarantee |
| **Cannot be determined without Dakota** | Absent from public API/docs; needs Dakota team confirmation |

---

### 1. Plaid-style ACH debit pull vs virtual-account push?

**Short answer:** Public documentation and API describe **only** a **push** funding model: Dakota issues virtual bank details; the end user sends USD (ACH/wire) into those details. No Plaid / bank-link / ACH debit-authorization surface appears in the public OpenAPI or SDK.

| Classification | Finding | Exact support |
|----------------|---------|---------------|
| **Confirmed by API or documentation** | Onramp returns bank details; integrator shares them; user sends money in | Docs: [Common Flows — Create an Onramp](https://docs.dakota.xyz/documentation/common-flows): *“An onramp account takes a crypto Destination and returns real ACH or Fedwire bank details. Your end user wires USD to those details…”* and *“Share `bank_account` with your end user.”* Sequence diagram: `App→EndUser: Share bank details` → `EndUser→Bank: Wire USD` |
| **Confirmed by API or documentation** | Create onramp via `POST /accounts` with `account_type: onramp` | OpenAPI `operationId: createAccount`; docs example with `capabilities: ["ach"]`, `rail: "ach"`; SDK `client.accounts.create(...)` |
| **Confirmed by sandbox behavior** | Created onramp returned Lead Bank virtual `aba_routing_number` + `account_number`; simulated deposit used `POST /sandbox/simulate/inbound` with `type: "ach_inbound"` | Sandbox evaluation run 2026-07-21; scenarios catalog at `GET /sandbox/scenarios` lists inbound ACH types, not debit-pull authorization |
| **Confirmed by API or documentation** | `fiat_us` destinations are **payee bank accounts** (offramp / payout targets), not a Plaid-linked funding source | OpenAPI `DestinationRequestUnion` / `FiatUSDestinationRequest` (`destination_type: fiat_us` with routing/account fields); Common Flows offramp: crypto → Dakota → *wires to the bank account* |
| **Confirmed by API or documentation** | No Plaid, Finicity, MX, Akoya, “bank link”, “ACH debit authorization”, or debit-pull endpoints in published OpenAPI | Full-text search of `openapi.yaml` and SDK package: no matches for those products/flows |
| **Cannot be determined without Dakota** | Whether Dakota offers a **private / enterprise** Plaid-style debit-pull product outside the public API | Ask Dakota sales/product explicitly |

**Olimpia implication:** If V1 “Bank Transfer” requires tap-to-authorize debit from a linked bank, Dakota’s public surface does **not** provide that. If V1 can use “here are account details — transfer from your bank,” Dakota matches the documented model.

---

### 2. Is individual KYC customizable, white-labeled, embedded, or only a Dakota-hosted link?

**Short answer:** Dakota documents **two paths**: (A) a **hosted web form** via `application_url`, and (B) a **programmatic Application Token API** so you can collect fields/documents in your own UI. **White-label branding of the hosted form is not documented.**

| Classification | Finding | Exact support |
|----------------|---------|---------------|
| **Confirmed by API or documentation** | Creating a customer returns a hosted onboarding URL | `POST /customers` response fields `application_id`, `application_url`; Common Flows: *“Share `application_url` with the end user. They complete the hosted KYB form…”*; SDK type comment on `application_url`: *“Public URL for completing the application via web form (includes embedded token)”* (`@dakota-xyz/ts-sdk` `index.d.ts`) |
| **Confirmed by sandbox behavior** | Individual customer carried `application_url` on `platform.sandbox.dakota.xyz/applications/{id}?token=…` | `GET /customers/{id}` during this evaluation |
| **Confirmed by API or documentation** | Fresh hosted links can be minted for approved customers | `POST /customers/{customer_id}/re-engagement` — *“returns the rebuilt `application_url`”* for customer-online terms acceptance (`POST /applications/{application_id}/attestations`) |
| **Confirmed by API or documentation** | You can drive onboarding via API without relying on the hosted form for data entry | Onboarding endpoints authenticated with `X-Application-Token` (OpenAPI security `ApplicationTokenAuth`), including: `PUT /applications/{application_id}/individual-details` (`operationId: updateIndividualApplicationDetails`, SDK `client.applications.updateIndividualDetails`), document upload endpoints, `POST /applications/{application_id}/attestations`, `POST .../submit` |
| **Confirmed by API or documentation** | `GET /applications/{id}` with full entity details is forbidden to the org API key in sandbox (403); application-token auth is the intended path for deep application reads | Sandbox: `GET /applications/{id}?include=validation,entities` → 403 *“You do not have access to this resource”* with `x-api-key`; list `GET /applications` with API key still works |
| **Indicated but not confirmed** | Building your own UI on Application Token APIs is the path to an “embedded” experience (your screens, Dakota backend) | Pattern implied by Application Token + individual-details/document APIs; docs do not publish an iframe/SDK widget for KYC |
| **Cannot be determined without Dakota** | White-label / custom branding / domain for the **hosted** `application_url` pages | No white-label/branding configuration in OpenAPI or published docs |
| **Cannot be determined without Dakota** | Whether they provide a native mobile SDK / WebView-recommended embed package beyond opening `application_url` | Not documented |

**Olimpia implication:** Fastest path = open Dakota hosted KYC (external UX). Fully native Olimpia KYC screens are possible only if you implement against Application Token APIs (more engineering) — confirm with Dakota that this is supported for production consumer apps and which fields still must go through Sumsub/Persona capture (e.g. live ID selfie).

---

### 3. Which individual KYC fields are technically required?

Schema source of truth: OpenAPI `components.schemas.IndividualRequest` (used by `PUT /applications/{application_id}/individual-details`). Document types: `IndividualDocumentType`. PoA rules: `createApplicationDocumentUpload` description.

#### Always required on `IndividualRequest` (`required` array)

| Field | Schema |
|-------|--------|
| `roles` | must include role values; for consumer individual apps use `individual` |
| `name` (`first`, `last`) | `PersonName` |
| `date_of_birth` | ISO date; description says person must be ≥ 18 |
| `nationalities` | min 1 ISO country code |
| `address` | `Address` object |
| `email_address` | email |

#### Conditionally required by schema **description** (when `roles` includes `individual`)

| Field | Schema wording |
|-------|----------------|
| `employment_status` | *“required only when roles includes 'individual'”* — enum: `employed`, `self_employed`, `unemployed`, `student`, `retired` |
| `purpose_of_account` | *“required when roles includes 'individual'”* — array, minItems 1 — enum includes `investing`, `sending_and_receiving_payments`, `storage_of_funds_or_digital_assets`, `making_online_payments`, `trading_on_other_platforms` |
| `source_of_wealth` | *“required when roles includes 'individual'”* — array, minItems 1 — enum includes `employment`, `savings`, `investments`, etc. |

#### SSN

| Classification | Finding | Exact support |
|----------------|---------|---------------|
| **Confirmed by API or documentation** | `ssn` is a schema field with pattern `XXX-XX-XXXX` | `IndividualRequest.properties.ssn` |
| **Confirmed by API or documentation** | Description: *“Social Security Number (required for US persons…)”* | Same field description — **not** in the top-level JSON Schema `required` array; requiredness is documented for US persons |
| **Confirmed by API or documentation** | After Sumsub import, SSN may still be needed if Sumsub TIN did not carry a formatted SSN | [Sumsub Token Sharing](https://docs.dakota.xyz/documentation/sumsub-token-sharing): *“SSN if the applicant is a US person and Sumsub's TIN field didn't carry a properly formatted SSN”* |

#### Asked fields — classification summary

| Field | Classification | Notes / support |
|-------|----------------|-----------------|
| **Social Security Number** | **Confirmed by API or documentation** as required for **US persons** (description + Sumsub guide); not in JSON Schema `required` array | `IndividualRequest.ssn` |
| **Employment status** | **Confirmed by API or documentation** as required when role is `individual` | `IndividualRequest.employment_status` |
| **Purpose of account** | **Confirmed by API or documentation** as required when role is `individual` | `IndividualRequest.purpose_of_account` |
| **Source of wealth** | **Confirmed by API or documentation** as required when role is `individual` (categorical enum); source-of-wealth **documents** are separate | Field: `source_of_wealth`. Docs after Sumsub import: Dakota-specific SoW docs *never transferred from Sumsub* and may still be needed |
| **Proof of address** | **Confirmed by API or documentation** as **not required to onboard**, with a volume limit; becomes required after threshold / freeze | OpenAPI `createApplicationDocumentUpload` description: individuals may onboard without PoA; **$3,000 USD-equivalent rolling 7-day** limit without PoA; PoA equivalents: `proof_of_address`, `bank_statement`, `utility_bill` (`IndividualDocumentType` / `ApplicationDocumentType`) |
| **Government ID** | **Confirmed by API or documentation** that identity document types exist and are part of individual document upload; **Indicated** as required for a complete application via validation examples showing missing `passport` / `drivers_license_front` | `IndividualDocumentType`: `passport`, `drivers_license_front`, `drivers_license_back`, `residence_permit_*`. Upload: `POST` individual document endpoints; `id_number` **REQUIRED** for identity docs. OpenAPI application `validation` examples list `missing_documents` including passport / drivers license. Exact “must upload before submit” rule for every sandbox config: **Cannot be determined without Dakota** (could not deep-read `include=validation` with API key — 403) |

**Also confirmed (not in your list, but schema-required):** legal name, DOB, nationality, residential address, email.

**Cannot be determined without Dakota:** Whether the **hosted** web form collects additional fields (selfie/liveness, phone, etc.) beyond `IndividualRequest`, and whether production review can request EDD docs beyond the schema enums.

---

### 4. Can Dakota reuse identity verification from Privy (or another provider) to avoid duplicate KYC?

**Short answer:** Dakota documents a **Sumsub Reusable KYC / share-token** import path. There is **no Privy-specific** API or documented Privy bridge. Persona appears as a legacy/status provider label, not a “import from Privy” workflow.

| Classification | Finding | Exact support |
|----------------|---------|---------------|
| **Confirmed by API or documentation** | Reuse KYC via **Sumsub share tokens** (individuals only) | Docs: [Sumsub Token Sharing](https://docs.dakota.xyz/documentation/sumsub-token-sharing) — *“Reuse a customer's existing Sumsub verification… without re-collecting identity data or documents.”* |
| **Confirmed by API or documentation** | API endpoint + SDK method | `POST /customers/bulk-import-sumsub-tokens` (`operationId: bulkImportFromSumsubTokens`); SDK `client.customers.bulkImportFromSumsubTokens({ tokens: [...] })` |
| **Confirmed by API or documentation** | Requires a Sumsub donor↔Dakota recipient partnership (`forClientId: dakota.xyz_158913`) and a Dakota-issued partner token | Same Sumsub Token Sharing guide — setup is out-of-band with Dakota |
| **Confirmed by API or documentation** | Import does **not** fully eliminate Dakota-specific steps | Same guide: after import, typically still need `employment_status`, `purpose_of_account`, `source_of_wealth`, possibly SSN, SoW documents, and attestations |
| **Confirmed by API or documentation** | Effective KYC/B status can come from Sumsub **or** Persona | OpenAPI customer status derivation text references Sumsub-verified and Persona-verified customers; `kyb_links[].link_type` examples include `persona` |
| **Confirmed by API or documentation** | No Privy mention in OpenAPI, Sumsub guide, or SDK surface for identity import | Search of docs index / OpenAPI / SDK: no Privy identity reuse API |
| **Cannot be determined without Dakota** | Whether **Privy’s** KYC provider (whatever they use for a given app) can act as a Sumsub **donor**, or whether Dakota will accept another bilateral reuse path for Privy | Needs Dakota + possibly Privy |
| **Cannot be determined without Dakota** | Whether Olimpia can skip Dakota KYC entirely under a sponsorship / rely-on-Olimpia model | Not in public docs |

**Olimpia implication:** Duplicate verification is the default unless you establish **Sumsub sharing** (or another Dakota-approved reuse path). Privy alone is **not** a documented skip switch.

---

### Still ask Dakota (product/onboarding)

1. Do you offer any ACH **debit pull** / Plaid-style linked-bank funding (even if not in public docs)?  
2. Can the hosted `application_url` be white-labeled (brand, domain, mobile WebView guidance)?  
3. For consumer individuals on API-only onboarding: is live ID/selfie capture required via Sumsub/Persona UI, or can passport/DL upload alone satisfy KYC?  
4. Can Privy’s verification be reused into Dakota (directly or via Sumsub donor relationship)?  
5. Confirm production PoA $3,000 / 7-day rule and whether Olimpia must implement the client-side volume backstop they describe.

---

## Authentication

| Item | Detail |
|------|--------|
| Mechanism | API key header `x-api-key` |
| Sandbox API base | `https://api.platform.sandbox.dakota.xyz` |
| Production API base | `https://api.platform.dakota.xyz` |
| Dashboard | Sandbox: `platform.sandbox.dakota.xyz` · Prod: `platform.dakota.xyz` |
| Idempotency | `x-idempotency-key` required on POSTs |
| Rate limits | Per-key; `X-RateLimit-*` response headers; `429` + `Retry-After` |
| Errors | RFC 9457 problem+json (`type`, `title`, `status`, `detail`, `request_id`) |

### Example (redacted)

```bash
curl -sS https://api.platform.sandbox.dakota.xyz/customers?limit=5 \
  -H "x-api-key: $DAKOTA_API_KEY"
```

**Observed:** Auth succeeded. Existing sandbox customers listed (individual “John Smith” + business org customer).

**Ignore for Olimpia mobile:** Never put the Dakota API key in the Expo app. Server-only.

---

## SDK Evaluation

| Criterion | Finding |
|-----------|---------|
| Package | `@dakota-xyz/ts-sdk` |
| Quality | Official, OpenAPI-generated feel; TypeScript-first |
| Environments | `Environment.Sandbox` (default), `Production`, etc. |
| DX | Good resource coverage: customers, recipients, destinations, accounts, transactions, autoTransactions, webhooks, sandbox, applications |
| Retries / transport | Built-in retry/backoff transport |
| Gaps | `accounts.list()` requires `account_type` query param (400 if omitted). Some README examples use slightly outdated field names vs live API (`asset`/`network_id` vs `destination_asset`/`destination_network_id`/`source_asset`). |

### Example (pattern only)

```typescript
import { DakotaClient, Environment } from '@dakota-xyz/ts-sdk';

const client = new DakotaClient({
  apiKey: process.env.DAKOTA_API_KEY!,
  environment: Environment.Sandbox,
});

for await (const customer of client.customers.list({ limit: 5 })) {
  console.log(customer.id, customer.kyb_status, customer.kyc_status);
}

const networks = await client.info.getNetworks();
// includes 'base-mainnet' and 'base-sepolia'
```

**Verdict:** Prefer the TS SDK on the Olimpia API server if we proceed. Still wrap behind `BankTransferProvider` so SDK types do not leak to mobile.

---

## API Overview

Dakota’s mental model (plain English):

| Dakota term | Meaning for Olimpia |
|-------------|---------------------|
| **Client** | Olimpia (the company integrating) |
| **Customer** | An Olimpia end user (individual) or business |
| **Application / KYC–KYB** | Identity verification before money moves |
| **Recipient** | A named payout/receive party under a customer |
| **Destination** | Where money goes: crypto address **or** US bank / IBAN |
| **Account (onramp/offramp/swap)** | Reusable “pipe”: e.g. virtual bank details that auto-convert deposits to USDC |
| **Auto transaction** | Money movement triggered when funds hit an account |
| **One-off transaction** | Single-use funding instructions |
| **Wallet** | Dakota’s optional non-custodial multi-sig wallet product (not required for Privy destinations) |

### Resource map (high level)

```
Customer
  ├── Application (hosted KYC URL)
  ├── Recipients
  │     └── Destinations (crypto | fiat_us | fiat_iban)
  ├── Accounts (onramp / offramp / swap)  → virtual bank or deposit address
  └── (optional) Dakota Wallets + policies + signers
```

REST is complete enough for a full server adapter. Webhooks + `/events` cover async status.

---

## Customer Lifecycle

### Create

`POST /customers` with `name`, `customer_type` (`individual` | `business`), optional `external_id` (map to Olimpia user id).

**Response includes:**

- `id` — Dakota customer id  
- `application_id` / `application_url` — hosted onboarding link (contains a short-lived token; treat as secret)  
- `kyb_status` / `kyc_status`

### Observed sandbox state

| Customer | Type | After evaluation |
|----------|------|------------------|
| John Smith | individual | `application_status: approved`, `kyb_status: active`, `kyc_status: pending` (see quirk below) |
| Tamara Alexandre (Sandbox) | business | Still pending (org record) |

### Capabilities

`GET /customers/{id}/capabilities` returned an `international_wire` capability with outstanding document/terms requirements — even for an individual in sandbox. Treat capabilities as **compliance gating** for advanced rails.

### Quirk

After `POST /sandbox/simulate/onboarding` with `type: kyb_approve`, `kyb_status` became `active` while `kyc_status` remained `pending`. Money-movement APIs still worked for onramp creation + simulated ACH. Confirm with Dakota how production individual KYC vs KYB fields map for consumer apps.

---

## KYC Flow

### How it works (plain English)

**KYC** = “prove who this person is.”  
Dakota can run this via a **hosted application URL** (browser / WebView) or API onboarding endpoints (documents, attestations). There is also **Sumsub token sharing** to reuse an existing Sumsub verification.

### What Olimpia already observed in dashboard

- Individual customer onboarding exists  
- Hosted KYC flow exists  

### Sandbox simulation (tested)

```bash
curl -X POST https://api.platform.sandbox.dakota.xyz/sandbox/simulate/onboarding \
  -H "x-api-key: $DAKOTA_API_KEY" \
  -H "x-idempotency-key: $(uuidgen)" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "kyb_approve",
    "applicant_id": "<application_id>",
    "simulation_id": "sim_kyb_approve_001"
  }'
```

Docs note: `kyb_approve` fully provisions; `kyc_*` types only flip application status without full provisioning.

### Compliance / UX implications for Olimpia

- Users may face **Dakota KYC in addition to Privy** unless Sumsub/shared KYC is arranged.  
- Hosted KYC is easiest to ship but is **vendor-branded / external UI** unless Dakota white-labels.  
- Webhooks: `customer.kyb_status.updated`, `customer.kyb_application.submitted`, etc.

---

## Wallet & Stablecoin Support

### Dakota wallets (optional)

`POST /wallets` requires `signer_groups` (and supports policies). This is Dakota’s **non-custodial** governance wallet stack.

**For Olimpia V1 with Privy:** likely **skip Dakota wallets**. Use crypto **Destinations** pointing at Privy addresses instead.

### Stablecoins / networks (live sandbox)

`GET /capabilities/networks` returned (among others):

- `base-mainnet`, `base-sepolia`  
- ethereum / optimism / arbitrum / polygon variants  
- solana variants  
- `evm` wildcard family  

Sandbox **rejects mainnet destinations**:

```text
network "base-mainnet" is not allowed in sandbox; use a testnet
```

USDC is the primary documented on/off-ramp asset.

---

## ACH Funding Flow

### Plain English

**ACH** = US bank network used to move dollars between bank accounts (often 1–3 business days in the real world; sandbox can simulate instantly).

Dakota’s onramp is primarily a **push** model:

1. Create a crypto Destination (Privy address on Base).  
2. Create an **onramp Account** linked to that destination.  
3. Dakota returns **virtual bank account details** (Lead Bank in sandbox).  
4. User sends USD (ACH or Fedwire) **to those details**.  
5. Dakota converts USD → USDC and sends to the destination address.  
6. Your backend learns via **webhooks** / polling auto-transactions.

This is **not** the same UX as “link your bank with Plaid and we debit you.” Confirm with Dakota whether debit-pull / account linking exists; sandbox + docs emphasize deposit-to-virtual-account.

### Tested create payload (worked)

```json
{
  "account_type": "onramp",
  "capabilities": ["ach"],
  "rail": "ach",
  "crypto_destination_id": "<destination_id>",
  "destination_network_id": "base-sepolia",
  "source_asset": "USD",
  "destination_asset": "USDC"
}
```

### Observed create response (redacted)

- `rail`: `us_bank_account`  
- `bank_account.bank_name`: Lead Bank  
- `bank_account.capabilities`: `ach`, `fedwire`  
- `bank_account.aba_routing_number` + `account_number` issued  
- `destination.crypto_address`: external address we registered  
- `destination.network_id`: `base-sepolia`  
- `destination_asset`: `USDC`  

**Critical observation:** `account_holder_name` on the virtual account was **not** the individual customer’s name (“John Smith”); it showed the sandbox org-associated name. Ask Dakota whether production virtual accounts are titled to the end user, the platform, or a pooled FBO structure — this affects user instructions, bank memo matching, and compliance disclosures.

### Simulated ACH inbound (worked)

```json
{
  "simulation_id": "sim_ach_inbound_...",
  "type": "ach_inbound",
  "account_id": "<onramp_account_id>",
  "amount": "1.00",
  "currency": "USD",
  "scenario": "success_immediate"
}
```

### Auto-transaction result (worked)

| Field | Value |
|-------|-------|
| Type | `onramp` |
| Status progression | `processing` → `completed` |
| Input | `1 USD` |
| Output | `1 USDC` |
| Destination | external address on `base-sepolia` |
| On-chain | `transaction_hash` present when completed |

Sandbox scenarios also include `compliance_hold`, `manual_review`, returns/failures, delayed success — good for adapter testing.

---

## Transfers

| Flow | How Dakota does it | Olimpia relevance |
|------|--------------------|-------------------|
| **Onramp (USD → USDC)** | Onramp account + inbound ACH/wire | Primary V1 Bank Transfer deposit |
| **Offramp (USDC → USD)** | Offramp account or one-off; crypto deposit address → ACH/wire to `fiat_us` destination | Candidate for withdrawals (V1 withdrawal provider still TBD) |
| **Swap** | Crypto → crypto across networks | Optional; not required for V1 if Privy already holds USDC on Base |
| **One-off** | `POST /transactions` family | Useful for single payouts without reusable accounts |
| **Wallet send** | Dakota wallet + intent signing | Only if adopting Dakota custody/governance wallets |

Auto-transactions are the right status objects for reusable onramp accounts (`GET /auto-transactions`).

---

## Webhooks

| Topic | Finding |
|-------|---------|
| Registration | `POST /webhooks/targets` with HTTPS URL + optional `event_types` |
| Signing | **Ed25519** (`X-Webhook-Signature`), not HMAC — verify with Dakota public key |
| Replay protection | `X-Webhook-Timestamp`; docs recommend rejecting >5 minutes skew |
| Ordering | **Not guaranteed** — design idempotent handlers |
| Retention | Delivery history ~30 days; replay endpoint available |
| Sandbox state | No webhook targets configured yet on this key |

### Events that matter for Olimpia Bank Transfer

- `customer.created` / `customer.kyb_status.updated`  
- `auto_account.created` / `updated`  
- `transaction.auto.created` / `transaction.auto.updated` (`processing` → `completed` / `failed`)  
- `transaction.one_off.*` if using one-offs  
- `wallet.*` only if using Dakota wallets  

**Ledger rule:** Credit Olimpia balance only after a normalized “funds available / completed” signal **and** (recommended) Base confirmation for the Privy wallet credit — avoid double-credit from webhook + chain monitor.

---

## Base Compatibility

| Question | Answer from sandbox |
|----------|---------------------|
| Does Dakota list Base? | ✅ `base-mainnet`, `base-sepolia` |
| Can destination be Base? | ✅ Created crypto destination on `base-sepolia` |
| Can onramp deliver USDC on Base? | ✅ Completed auto-tx with `destination_network_id: base-sepolia` + tx hash |
| Production Base mainnet? | Not executable in sandbox (mainnet blocked); treat as **supported per API catalog**, confirm production cutover with Dakota |

---

## Capability Checklist (Olimpia V1 questions)

| Capability | Supported? | Evidence |
|------------|------------|----------|
| ACH → USDC | ✅ | Onramp + simulated `ach_inbound` → completed USDC output |
| USDC on Base | ✅ | Destination + completed tx on `base-sepolia`; `base-mainnet` listed |
| Send USDC to external Privy wallet address | ✅ | Destination `crypto_address` was arbitrary EVM address; funds routed there |
| Individual customer onboarding / KYC | ✅ | Hosted application URL + statuses; sandbox approve |
| Webhooks for status | ✅ | Documented + API; not end-to-end delivered in this eval (no target URL) |
| ACH debit pull / Plaid-style link | ❓ | Not evidenced in sandbox flows tested; appears deposit-push |
| Dakota wallet required? | ❌ Not required | External destinations work without Dakota wallets |

---

## Provider-Neutral Architecture Assessment

Olimpia’s architecture already defines a replaceable **`BankTransferProvider`** (`docs/architecture/Architecture.md`) that should:

- Create/identify provider customers  
- Initiate bank-transfer deposits  
- Fetch status  
- Validate webhooks  
- Normalize provider states  
- Keep Dakota payloads out of mobile APIs  

### Fit

**Good fit**, with an adapter boundary like:

```text
Olimpia FundingService
        │
        ▼
BankTransferProvider (interface)
        │
        ├── DakotaBankTransferProvider  ← customer, recipient, destination, onramp account, webhooks
        └── FutureProvider...
```

### Mapping suggestions

| Olimpia concept | Dakota concept |
|-----------------|----------------|
| User | Customer (`external_id` = Olimpia user id) |
| Privy wallet on Base | Recipient Destination (`crypto`, `base-mainnet`, address) |
| Bank transfer deposit session | Onramp Account (or one-off) |
| Deposit status | Auto-transaction status + webhooks |
| Completed credit | `completed` + optional Base monitor confirmation |

### Friction / lock-in notes

- Domain language is crypto-native (onramp/offramp/destination). Adapter must translate to consumer “Bank Transfer.”  
- Hosted KYC URL and Lead Bank virtual accounts create **UX coupling** even if code is abstracted.  
- Fee field `developer_fee_bps` is Dakota-specific; keep fee policy in Olimpia.  
- Sumsub sharing, RD/state restrictions, and capability unlocks are Dakota compliance features — abstract carefully.  
- SDK is convenient but should stay behind the adapter.

**Vendor lock-in risk:** Medium for *operations/compliance UX*; Low–Medium for *code* if the adapter + ledger remain authoritative.

---

## Pros

- Clear ACH/Fedwire → USDC onramp with sandbox simulation tooling  
- Base + USDC explicitly supported  
- External wallet destinations work (Privy-compatible architecture)  
- Solid REST API + official TypeScript SDK  
- Webhooks with signature verification, replay, delivery history  
- Provider-neutral adapter is feasible  
- Sandbox scenarios cover compliance hold / returns / failures  

## Cons

- Not a pure “ACH bank” — stablecoin infrastructure under the hood (product/compliance messaging care)  
- Deposit UX appears **push-to-virtual-account**, which is heavier than instant bank-link debit UX  
- Extra KYC surface unless identity is shared with Privy/Sumsub  
- Virtual account `account_holder_name` did not match end-user customer in sandbox — confusing for consumers if true in prod  
- README/SDK examples drift slightly from live request shapes  
- Dakota wallets/signing stack is complex if accidentally adopted  

## Risks

| Risk | Why it matters |
|------|----------------|
| Settlement latency / returns | ACH can fail or reverse after “posted”; ledger must support reversals |
| Dual monitoring | Webhook completion + Base deposit monitor can double-credit if not idempotent |
| Account titling / FBO structure | Wrong name on deposit instructions → failed/misapplied transfers |
| State / RD restrictions | API returns `state_restricted_rd` for some geographies |
| Banking partner dependency | Sandbox uses Lead Bank; production partner/terms may differ |
| Compliance overlap | Olimpia + Privy + Dakota KYC may create drop-off |
| Crypto optics | Users think “bank transfer”; rails include stablecoin conversion |

## Open Questions (ask Dakota)

See also **Product and Onboarding Questions** above for classified answers on push vs pull, KYC UX, required fields, and Sumsub/Privy reuse.

1. Confirm whether any **ACH debit pull** / Plaid-style product exists outside the public API (public docs only show virtual-account **push**).  
2. Who is the **legal account holder** on virtual deposit accounts in production (end user vs Olimpia FBO vs Dakota)?  
3. Exact **production settlement SLAs** for ACH onramp to USDC on Base (p50/p99), and when is money irreversible?  
4. How should we handle **ACH returns / reversals** after USDC was already sent on-chain?  
5. Can **Privy** verification be reused into Dakota (directly or as a Sumsub donor)? Sumsub share-token reuse is documented; Privy is not.  
6. Confirm **Base mainnet USDC** contract and any chain/token allowlists.  
7. Production **limits**, supported US states, and `rd_allowed` / state restriction rules for consumers.  
8. Fee schedule confirmation vs Olimpia’s intended ~$1 user fee / ~$0.25 provider cost.  
9. White-label options for hosted KYC and bank-instruction screens (not in public docs).  
10. Recommended webhook set + canonical “credit the user” event for onramp auto-transactions.  
11. Offramp (withdraw) availability/pricing if Dakota becomes deposit+withdraw vs deposit-only.  
12. Data residency, BSA/AML responsibilities split, and who files SARs.  
13. For API-only individual onboarding: is live ID/selfie via Sumsub/Persona UI mandatory, or is document upload sufficient?

---

## Recommendation

### ⚠️ Need More Information

**Why not ❌ No-Go:** Sandbox evidence strongly supports Olimpia’s critical path — ACH → USDC on Base → external Privy wallet — behind a replaceable provider adapter.

**Why not ✅ Go yet:** Unresolved product/compliance questions (push vs pull UX, account titling, settlement/returns, KYC duplication, production limits/geography) could still make Dakota the wrong *primary* Bank Transfer provider even if the API works.

### Suggested next validation (still no app integration)

1. Call with Dakota using the Open Questions list.  
2. Register a webhook target to a request bin / staging URL and re-run `ach_inbound` to capture real event payloads.  
3. Prototype **only** a throwaway adapter sketch in a scratch branch (optional; not required for decision).  
4. Decide deposit UX copy: “Transfer from your bank” (push) vs “Link your bank” (pull) based on Dakota’s answer.

---

## Appendix A — Commands used (no secrets)

```bash
# Auth + networks
curl -sS "$BASE/customers?limit=5" -H "x-api-key: $DAKOTA_API_KEY"
curl -sS "$BASE/capabilities/networks" -H "x-api-key: $DAKOTA_API_KEY"

# Approve sandbox onboarding
curl -sS -X POST "$BASE/sandbox/simulate/onboarding" \
  -H "x-api-key: $DAKOTA_API_KEY" -H "x-idempotency-key: $IDEM" \
  -H "Content-Type: application/json" \
  -d '{"type":"kyb_approve","applicant_id":"<application_id>","simulation_id":"sim_1"}'

# Recipient + Base destination + onramp + simulate ACH
# (see body examples in sections above)
curl -sS "$BASE/sandbox/scenarios" -H "x-api-key: $DAKOTA_API_KEY"
curl -sS -X POST "$BASE/sandbox/simulate/inbound" ...
curl -sS "$BASE/auto-transactions/<id>" -H "x-api-key: $DAKOTA_API_KEY"
```

## Appendix B — Security note

The sandbox API key used for this evaluation was provided in chat. **Rotate/revoke it in the Dakota dashboard** after you finish exploration, and never commit keys to git or mobile configs.
