import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getUsdcBalanceUsdOnBase,
  toHomeBalanceSummaryFromUsdcRaw,
} from "../src/services/usdcBalance.js";

test("maps raw USDC units to the Home balance shape", () => {
  assert.deepEqual(toHomeBalanceSummaryFromUsdcRaw(2_000_000n), {
    availableUsd: "2.00",
    goalsAllocatedUsd: "0.00",
    growthAllocatedUsd: "0.00",
    totalDisplayUsd: "2.00",
  });
});

test("reads USDC with a read-only eth_call and no send", async () => {
  const calls: unknown[] = [];
  const fetchMock: typeof fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ result: "0x1e8480" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await getUsdcBalanceUsdOnBase(
    "0xE326D719e60d2aE9D8e3b4763c31C8c6053D79D8",
    fetchMock,
  );

  assert.deepEqual(result, {
    availableUsd: "2.00",
    goalsAllocatedUsd: "0.00",
    growthAllocatedUsd: "0.00",
    totalDisplayUsd: "2.00",
  });
  assert.equal(calls.length, 1);
  const body = calls[0] as { method?: string; params?: Array<{ data?: string }> };
  assert.equal(body.method, "eth_call");
  assert.match(String(body.params?.[0]?.data), /^0x70a08231/);
});
