import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { extractSmartWalletIdentity } from "../src/auth/privy.js";

const EOA = "0x6168aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const SMART_WALLET = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

test("extracts a Coinbase smart wallet that is not the embedded EOA", () => {
  const identity = extractSmartWalletIdentity(
    {
      linked_accounts: [
        {
          type: "wallet",
          chain_type: "ethereum",
          wallet_client_type: "privy",
          address: EOA,
        },
        {
          type: "smart_wallet",
          smart_wallet_type: "coinbase_smart_wallet",
          address: SMART_WALLET,
        },
      ],
    },
    EOA,
  );

  assert.deepEqual(identity, {
    address: SMART_WALLET,
    type: "coinbase_smart_wallet",
  });
});

test("extracts type coinbase_smart_wallet from linked_accounts", () => {
  const identity = extractSmartWalletIdentity(
    {
      linked_accounts: [
        {
          type: "coinbase_smart_wallet",
          address: SMART_WALLET,
        },
      ],
    },
    EOA,
  );

  assert.deepEqual(identity, {
    address: SMART_WALLET,
    type: "coinbase_smart_wallet",
  });
});

test("does not treat the embedded Privy EOA as a smart wallet", () => {
  const identity = extractSmartWalletIdentity(
    {
      linked_accounts: [
        {
          type: "wallet",
          chain_type: "ethereum",
          wallet_client_type: "privy",
          address: EOA,
        },
        {
          type: "smart_wallet",
          smart_wallet_type: "coinbase_smart_wallet",
          address: EOA,
        },
      ],
    },
    EOA,
  );

  assert.equal(identity, null);
});

test("returns null when no smart wallet is linked", () => {
  const identity = extractSmartWalletIdentity(
    {
      linked_accounts: [
        {
          type: "wallet",
          chain_type: "ethereum",
          wallet_client_type: "privy",
          address: EOA,
        },
        {
          type: "email",
          address: "user@example.com",
        },
      ],
    },
    EOA,
  );

  assert.equal(identity, null);
});

test("auth sync still returns only the EOA on the public wallet summary", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const source = await readFile(path.join(apiRoot, "src/services/authSync.ts"), "utf8");

  assert.match(source, /extractSmartWalletIdentity/);
  assert.match(source, /smart_wallet_address/);
  assert.match(
    source,
    /RETURNING id, chain, address, privy_wallet_id/,
  );
  assert.doesNotMatch(source, /smartWalletAddress:/);
  assert.doesNotMatch(source, /moneyAddressMode:/);
  assert.doesNotMatch(source, /money_address_mode = EXCLUDED/);
});
