import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import { env } from "../src/config/env.js";
import { createGrowthRouter } from "../src/routes/v1/growth.js";
import {
  getGrowthForPrivyWallet,
  InvalidGrowthVaultError,
} from "../src/services/privyGrowth.js";

const originalPrivyConfig = {
  appId: env.privyAppId,
  appSecret: env.privyAppSecret,
  vaultId: env.privyEarnAaveBaseUsdcVaultId,
};

function configureTestPrivy(): void {
  env.privyAppId = "test-app";
  env.privyAppSecret = "test-secret";
  env.privyEarnAaveBaseUsdcVaultId = "test-vault";
}

function restorePrivyConfig(): void {
  env.privyAppId = originalPrivyConfig.appId;
  env.privyAppSecret = originalPrivyConfig.appSecret;
  env.privyEarnAaveBaseUsdcVaultId = originalPrivyConfig.vaultId;
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("growth service maps read-only Privy Earn data without exposing identifiers", async () => {
  configureTestPrivy();
  const requestedUrls: string[] = [];
  const fetchMock: typeof fetch = async (input) => {
    const url = String(input);
    requestedUrls.push(url);

    if (url.includes("/wallets/")) {
      return jsonResponse({
        asset: { symbol: "usdc", decimals: 6 },
        total_deposited: "10000000",
        total_withdrawn: "2000000",
        assets_in_vault: "8500000",
        shares_in_vault: "unused",
      });
    }

    return jsonResponse({
      provider: "aave",
      caip2: "eip155:8453",
      asset: { symbol: "usdc", decimals: 6 },
      user_apy: 425,
      available_liquidity_usd: 123456.78,
    });
  };

  try {
    const result = await getGrowthForPrivyWallet("wallet-test", fetchMock);

    assert.deepEqual(result, {
      liveApyPercent: "4.25",
      currentRedeemableUsdc: "8.50",
      totalDepositedUsdc: "10.00",
      totalWithdrawnUsdc: "2.00",
      earnedYieldUsdc: "0.50",
      availableLiquidityUsd: "123456.78",
    });
    assert.equal(requestedUrls.length, 2);
    assert.ok(requestedUrls.every((url) => url.startsWith("https://api.privy.io/v1/")));
    assert.equal(JSON.stringify(result).includes("test-vault"), false);
    assert.equal(JSON.stringify(result).includes("wallet-test"), false);
  } finally {
    restorePrivyConfig();
  }
});

test("growth service fails closed unless vault is Aave, Base, and USDC", async () => {
  configureTestPrivy();

  try {
    for (const invalidDetails of [
      {
        provider: "morpho",
        caip2: "eip155:8453",
        asset: { symbol: "usdc", decimals: 6 },
      },
      {
        provider: "aave",
        caip2: "eip155:1",
        asset: { symbol: "usdc", decimals: 6 },
      },
      {
        provider: "aave",
        caip2: "eip155:8453",
        asset: { symbol: "eth", decimals: 18 },
      },
    ]) {
      const fetchMock: typeof fetch = async (input) => {
        if (String(input).includes("/wallets/")) {
          return jsonResponse({
            asset: { symbol: "usdc", decimals: 6 },
            total_deposited: "0",
            total_withdrawn: "0",
            assets_in_vault: "0",
          });
        }

        return jsonResponse({
          ...invalidDetails,
          user_apy: 425,
          available_liquidity_usd: 1000,
        });
      };

      await assert.rejects(
        getGrowthForPrivyWallet("wallet-test", fetchMock),
        InvalidGrowthVaultError,
      );
    }
  } finally {
    restorePrivyConfig();
  }
});

test("GET /growth uses the authenticated user's stored Privy wallet", async () => {
  let lookedUpUserId: string | undefined;
  let requestedWalletId: string | undefined;
  const app = express();
  app.use(
    "/growth",
    createGrowthRouter({
      auth: (req, _res, next) => {
        (
          req as express.Request & { privyUserId?: string }
        ).privyUserId = "did:privy:current-user";
        next();
      },
      lookupWallet: async (privyUserId) => {
        lookedUpUserId = privyUserId;
        return { userExists: true, privyWalletId: "wallet-current-user" };
      },
      getGrowth: async (privyWalletId) => {
        requestedWalletId = privyWalletId;
        return {
          liveApyPercent: "4.25",
          currentRedeemableUsdc: "8.50",
          totalDepositedUsdc: "10.00",
          totalWithdrawnUsdc: "2.00",
          earnedYieldUsdc: "0.50",
          availableLiquidityUsd: "123456.78",
        };
      },
    }),
  );

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/growth`);
    assert.equal(response.status, 200);
    assert.equal(lookedUpUserId, "did:privy:current-user");
    assert.equal(requestedWalletId, "wallet-current-user");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
