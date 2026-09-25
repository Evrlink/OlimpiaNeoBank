import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getGrowthForSmartWallet,
  toGrowthSummaryFromAusdcRaw,
} from "../src/services/aaveGrowth.js";
import {
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "../src/services/aaveAddresses.js";
import {
  assertPlanHasNoSecrets,
  buildAaveDepositPlan,
  encodeAaveSupply,
  encodeUsdcApprove,
} from "../src/services/aaveDepositPlan.js";
import { getHomeGrowthForWallet } from "../src/services/walletGrowth.js";

const SMART = "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA";
const EOA = "0x6168Bd45eFb539483756d0Ed6b7f8a1502c81B50";

const emptyGrowth = {
  liveApyPercent: "4.25",
  currentRedeemableUsdc: "0.00",
  totalDepositedUsdc: "0.00",
  totalWithdrawnUsdc: "0.00",
  earnedYieldUsdc: "0.00",
  availableLiquidityUsd: "1.00",
};

test("maps aUSDC units to the Grow summary without claiming earned yield", () => {
  assert.deepEqual(
    toGrowthSummaryFromAusdcRaw(2_000_000n, {
      decimals: 6,
      liveApyPercent: "4.25",
      availableLiquidityUsd: "10.00",
    }),
    {
      liveApyPercent: "4.25",
      currentRedeemableUsdc: "2.00",
      totalDepositedUsdc: "0.00",
      totalWithdrawnUsdc: "0.00",
      earnedYieldUsdc: "0.00",
      availableLiquidityUsd: "10.00",
    },
  );
});

test("reads aUSDC with a read-only eth_call and no send", async () => {
  const calls: unknown[] = [];
  const fetchMock: typeof fetch = async (_input, init) => {
    calls.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({ result: "0x1e8480" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  const result = await getGrowthForSmartWallet(
    SMART,
    {
      decimals: 6,
      liveApyPercent: "4.25",
      availableLiquidityUsd: "10.00",
    },
    fetchMock,
  );

  assert.equal(result.currentRedeemableUsdc, "2.00");
  const body = calls[0] as {
    method?: string;
    params?: Array<{ to?: string; data?: string }>;
  };
  assert.equal(body.method, "eth_call");
  assert.equal(body.params?.[0]?.to, AAVE_V3_BASE_USDC_A_TOKEN);
  assert.match(String(body.params?.[0]?.data), /^0x70a08231/);
  assert.equal(
    JSON.stringify(calls).includes("eth_send"),
    false,
  );
});

test("smart_wallet Grow reads the smart wallet; eoa stays on Privy Earn", async () => {
  const calls: string[] = [];

  await getHomeGrowthForWallet(
    {
      moneyAddressMode: "smart_wallet",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
    },
    {
      getAaveBaseUsdcVaultMetadata: async () => ({
        decimals: 6,
        liveApyPercent: "4.25",
        availableLiquidityUsd: "1.00",
      }),
      getGrowthForSmartWallet: async (address) => {
        calls.push(`sw:${address}`);
        return emptyGrowth;
      },
      getGrowthForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return emptyGrowth;
      },
    },
  );

  await getHomeGrowthForWallet(
    {
      moneyAddressMode: "eoa",
      privyWalletId: "eoa-wallet-id",
      smartWalletAddress: SMART,
    },
    {
      getGrowthForSmartWallet: async (address) => {
        calls.push(`sw:${address}`);
        return emptyGrowth;
      },
      getGrowthForPrivyWallet: async (walletId) => {
        calls.push(`eoa:${walletId}`);
        return emptyGrowth;
      },
    },
  );

  assert.deepEqual(calls, [`sw:${SMART}`, "eoa:eoa-wallet-id"]);
});

test("deposit plan is approve + supply for the smart wallet only", () => {
  const plan = buildAaveDepositPlan({
    smartWalletAddress: SMART,
    amountUsdc: "1.50",
    availableRawUsdc: 2_000_000n,
    decimals: 6,
  });

  assert.equal(plan.chain, "base");
  assert.equal(plan.chainId, 8453);
  assert.equal(plan.smartWalletAddress, SMART);
  assert.equal(plan.amountUsdc, "1.50");
  assert.equal(plan.calls[0]?.to, BASE_USDC);
  assert.equal(plan.calls[1]?.to, AAVE_V3_BASE_POOL);
  assert.equal(plan.calls[0]?.data, encodeUsdcApprove(AAVE_V3_BASE_POOL, 1_500_000n));
  assert.equal(
    plan.calls[1]?.data,
    encodeAaveSupply({
      asset: BASE_USDC,
      amount: 1_500_000n,
      onBehalfOf: SMART,
    }),
  );
  assert.equal(plan.calls[1]?.data.includes(EOA.slice(2).toLowerCase()), false);
  assertPlanHasNoSecrets(plan, "secret-vault", "secret-app");
});

test("deposit plan rejects an amount greater than available USDC", () => {
  assert.throws(
    () =>
      buildAaveDepositPlan({
        smartWalletAddress: SMART,
        amountUsdc: "3.00",
        availableRawUsdc: 2_000_000n,
        decimals: 6,
      }),
    { name: "AaveDepositPlanError" },
  );
});
