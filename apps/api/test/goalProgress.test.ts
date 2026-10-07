import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  AUSDC_CASHFLOW_SQL,
  toGoalGrowFields,
} from "../src/services/goalProgress.js";

const USDC = 1_000_000n;

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("one Grow deposit does not count as yield", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 100n * USDC,
    depositedRaw: 100n * USDC,
    withdrawnRaw: 0n,
    caughtUp: true,
  });

  assert.equal(fields.growBalanceUsdc, "100.00");
  assert.equal(fields.remainingUsdc, "4900.00");
  assert.equal(fields.yieldEarnedUsdc, "0.00");
});

test("several deposits and withdrawals leave only the residual as yield", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 1250n * USDC,
    depositedRaw: (1000n + 250n) * USDC,
    withdrawnRaw: 18_420_000n,
    caughtUp: true,
  });

  assert.equal(fields.growBalanceUsdc, "1250.00");
  assert.equal(fields.remainingUsdc, "3750.00");
  assert.equal(fields.yieldEarnedUsdc, "18.42");
});

test("yield is not added on top of the Grow balance", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 1250n * USDC,
    depositedRaw: 1231_580_000n,
    withdrawnRaw: 0n,
    caughtUp: true,
  });

  assert.equal(fields.growBalanceUsdc, "1250.00");
  assert.equal(fields.yieldEarnedUsdc, "18.42");
  assert.notEqual(fields.growBalanceUsdc, "1268.42");
});

test("remaining is floored at zero when Grow passes the target", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 5420n * USDC,
    depositedRaw: 5355_820_000n,
    withdrawnRaw: 0n,
    caughtUp: true,
  });

  assert.equal(fields.growBalanceUsdc, "5420.00");
  assert.equal(fields.remainingUsdc, "0.00");
  assert.equal(fields.yieldEarnedUsdc, "64.18");
});

test("an unfinished activity index omits yield and keeps the Grow balance", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 1250n * USDC,
    depositedRaw: 0n,
    withdrawnRaw: 0n,
    caughtUp: false,
  });

  assert.equal(fields.growBalanceUsdc, "1250.00");
  assert.equal(fields.remainingUsdc, "3750.00");
  assert.equal(fields.yieldEarnedUsdc, null);
});

test("a negative yield result is omitted", () => {
  const fields = toGoalGrowFields({
    targetAmountUsd: "5000.00",
    growRaw: 100n * USDC,
    depositedRaw: 200n * USDC,
    withdrawnRaw: 0n,
    caughtUp: true,
  });

  assert.equal(fields.growBalanceUsdc, "100.00");
  assert.equal(fields.yieldEarnedUsdc, null);
});

test("cashflow sum uses the aUSDC counterparty rather than the activity label", async () => {
  const source = await readFile(
    path.join(apiRoot, "src/services/goalProgress.ts"),
    "utf8",
  );

  assert.match(AUSDC_CASHFLOW_SQL, /counterparty_address/);
  assert.match(AUSDC_CASHFLOW_SQL, /direction = 'out'/);
  assert.match(AUSDC_CASHFLOW_SQL, /direction = 'in'/);
  assert.doesNotMatch(AUSDC_CASHFLOW_SQL, /grow_deposit/);
  assert.doesNotMatch(AUSDC_CASHFLOW_SQL, /grow_withdraw/);
  assert.doesNotMatch(source, /aaveDepositExecution/);
  assert.doesNotMatch(source, /aaveWithdrawExecution/);
});
