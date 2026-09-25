import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  resolveInsertMoneyAddressMode,
  toPublicMoneyAddress,
} from "../src/services/moneyAddress.js";

const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";
const SMART = "0xE326D719e60d2aE9D8e3b4763c31C8c6053D79D8";

test("new users with a smart wallet insert as smart_wallet mode", () => {
  assert.equal(resolveInsertMoneyAddressMode(true, true), "smart_wallet");
});

test("new users without a smart wallet stay eoa", () => {
  assert.equal(resolveInsertMoneyAddressMode(true, false), "eoa");
});

test("existing users never insert as smart_wallet even if a smart wallet is linked", () => {
  assert.equal(resolveInsertMoneyAddressMode(false, true), "eoa");
  assert.equal(resolveInsertMoneyAddressMode(false, false), "eoa");
});

test("public money address is the smart wallet only when mode is smart_wallet", () => {
  assert.equal(
    toPublicMoneyAddress({
      moneyAddressMode: "smart_wallet",
      eoaAddress: EOA,
      smartWalletAddress: SMART,
    }),
    SMART,
  );
  assert.equal(
    toPublicMoneyAddress({
      moneyAddressMode: "eoa",
      eoaAddress: EOA,
      smartWalletAddress: SMART,
    }),
    EOA,
  );
  assert.equal(
    toPublicMoneyAddress({
      moneyAddressMode: "smart_wallet",
      eoaAddress: EOA,
      smartWalletAddress: EOA,
    }),
    EOA,
  );
});

test("activity and growth dispatch by money address; Earn execution stays frozen", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const activity = await readFile(path.join(apiRoot, "src/routes/v1/activity.ts"), "utf8");
  const growth = await readFile(path.join(apiRoot, "src/routes/v1/growth.ts"), "utf8");

  assert.match(activity, /money_address_mode/);
  assert.match(activity, /smart_wallet_address/);
  assert.match(activity, /getHomeActivityForWallet/);
  assert.doesNotMatch(activity, /getHomeActivityForPrivyWallet/);
  assert.match(growth, /money_address_mode/);
  assert.match(growth, /getHomeGrowthForWallet/);
  assert.match(growth, /smart-wallet-deposits\/prepare/);
  assert.doesNotMatch(growth, /getHomeBalanceForWallet/);
  assert.doesNotMatch(growth, /getHomeActivityForWallet/);
  assert.doesNotMatch(growth, /\._deposit\s*\(/);
  assert.doesNotMatch(growth, /sendTransaction/);
});
