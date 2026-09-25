import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import express from "express";
import { env } from "../src/config/env.js";
import { createApp } from "../src/app.js";
import { createGrowthRouter } from "../src/routes/v1/growth.js";
import { createMemoryGrowthAuthorizationStore } from "../src/services/growthAuthorizationStore.js";
import {
  createGrowthAuthorizationService,
  GrowthAuthorizationError,
  GrowthWalletOwnershipError,
} from "../src/services/privyGrowthAuthorization.js";
import {
  getRequiredAaveBaseUsdcVault,
  InvalidGrowthVaultError,
} from "../src/services/privyGrowth.js";

const originalPrivyConfig = {
  appId: env.privyAppId,
  appSecret: env.privyAppSecret,
  vaultId: env.privyEarnAaveBaseUsdcVaultId,
};

const VALID_SIGNATURE = "dGVzdC1hdXRob3JpemF0aW9u";

function configureTestPrivy(): void {
  env.privyAppId = "test-app";
  env.privyAppSecret = "test-secret-must-not-leak";
  env.privyEarnAaveBaseUsdcVaultId = "test-vault-must-not-leak";
}

function restorePrivyConfig(): void {
  env.privyAppId = originalPrivyConfig.appId;
  env.privyAppSecret = originalPrivyConfig.appSecret;
  env.privyEarnAaveBaseUsdcVaultId = originalPrivyConfig.vaultId;
}

function createTestService(overrides: {
  verifyOwnership?: () => Promise<void>;
  getVault?: () => Promise<{ decimals: number }>;
  getAvailableRawUsdc?: () => Promise<bigint>;
  now?: () => Date;
} = {}) {
  let currentTime = new Date("2026-09-23T17:00:00.000Z");

  const service = createGrowthAuthorizationService({
    lookupAccount: async () => ({
      userExists: true,
      userId: "11111111-1111-1111-1111-111111111111",
      privyWalletId: "wallet-current-user",
      walletAddress: "0x1111111111111111111111111111111111111111",
      chain: "base",
      smartWalletAddress: null,
      moneyAddressMode: "eoa",
    }),
    verifyOwnership:
      overrides.verifyOwnership ??
      (async () => {
        return;
      }),
    getVault: overrides.getVault ?? (async () => ({ decimals: 6 })),
    getAvailableRawUsdc: overrides.getAvailableRawUsdc ?? (async () => 2_000_000n),
    store: createMemoryGrowthAuthorizationStore(),
    now: overrides.now ?? (() => currentTime),
    createId: () => "22222222-2222-2222-2222-222222222222",
    createIdempotencyKey: () => "33333333-3333-3333-3333-333333333333",
  });

  return {
    service,
    setNow(next: Date) {
      currentTime = next;
    },
  };
}

function assertNoSecrets(value: unknown): void {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes("test-vault-must-not-leak"), false);
  assert.equal(serialized.includes("vault_id"), false);
  assert.equal(serialized.includes("vaultId"), false);
  assert.equal(serialized.includes("test-secret-must-not-leak"), false);
}

test("prepare and confirm a valid unused authorization without exposing secrets", async () => {
  configureTestPrivy();

  try {
    const { service } = createTestService();
    const prepared = await service.prepareDepositAuthorization({
      privyUserId: "did:privy:current-user",
      amountUsdc: "1.50",
    });

    assert.equal(prepared.status, "unused");
    assert.equal(prepared.amountUsdc, "1.50");
    assert.equal(prepared.walletAddress, "0x1111111111111111111111111111111111111111");
    assert.equal(prepared.chain, "base");
    assert.equal(prepared.asset, "usdc");
    assert.equal(prepared.expiresAt, "2026-09-23T17:05:00.000Z");
    assert.match(prepared.payload, /^[0-9a-f]+$/);
    assertNoSecrets(prepared);

    const confirmed = await service.confirmDepositAuthorization({
      privyUserId: "did:privy:current-user",
      authorizationId: prepared.id,
      signature: VALID_SIGNATURE,
    });

    assert.equal(confirmed.status, "authorized");
    assert.equal(confirmed.amountUsdc, "1.50");
    assert.equal(confirmed.id, prepared.id);
    assertNoSecrets(confirmed);
  } finally {
    restorePrivyConfig();
  }
});

test("prepare rejects an invalid amount", async () => {
  configureTestPrivy();

  try {
    const { service } = createTestService();

    for (const amountUsdc of ["0", "-1", "abc", "1.1234567", "01.00"]) {
      await assert.rejects(
        service.prepareDepositAuthorization({
          privyUserId: "did:privy:current-user",
          amountUsdc,
        }),
        (error: unknown) =>
          error instanceof GrowthAuthorizationError &&
          error.status === 400 &&
          error.code === "VALIDATION_ERROR",
      );
    }
  } finally {
    restorePrivyConfig();
  }
});

test("prepare rejects an amount greater than available USDC", async () => {
  configureTestPrivy();

  try {
    const { service } = createTestService({
      getAvailableRawUsdc: async () => 1_000_000n,
    });

    await assert.rejects(
      service.prepareDepositAuthorization({
        privyUserId: "did:privy:current-user",
        amountUsdc: "1.01",
      }),
      (error: unknown) =>
        error instanceof GrowthAuthorizationError &&
        error.status === 400 &&
        error.message.includes("available USDC"),
    );
  } finally {
    restorePrivyConfig();
  }
});

test("prepare fails closed when wallet ownership cannot be proven", async () => {
  configureTestPrivy();

  try {
    const { service } = createTestService({
      verifyOwnership: async () => {
        throw new GrowthWalletOwnershipError();
      },
    });

    await assert.rejects(
      service.prepareDepositAuthorization({
        privyUserId: "did:privy:current-user",
        amountUsdc: "1.00",
      }),
      (error: unknown) =>
        error instanceof GrowthAuthorizationError &&
        error.status === 403 &&
        error.message.includes("ownership"),
    );
  } finally {
    restorePrivyConfig();
  }
});

test("confirm rejects an expired unused authorization", async () => {
  configureTestPrivy();

  try {
    let currentTime = new Date("2026-09-23T17:00:00.000Z");
    const { service } = createTestService({
      now: () => currentTime,
    });

    const prepared = await service.prepareDepositAuthorization({
      privyUserId: "did:privy:current-user",
      amountUsdc: "1.00",
    });

    currentTime = new Date("2026-09-23T17:05:00.000Z");

    await assert.rejects(
      service.confirmDepositAuthorization({
        privyUserId: "did:privy:current-user",
        authorizationId: prepared.id,
        signature: VALID_SIGNATURE,
      }),
      (error: unknown) =>
        error instanceof GrowthAuthorizationError &&
        error.status === 400 &&
        error.message.includes("expired"),
    );
  } finally {
    restorePrivyConfig();
  }
});

test("confirm rejects a duplicate confirmation", async () => {
  configureTestPrivy();

  try {
    const { service } = createTestService();
    const prepared = await service.prepareDepositAuthorization({
      privyUserId: "did:privy:current-user",
      amountUsdc: "1.00",
    });

    await service.confirmDepositAuthorization({
      privyUserId: "did:privy:current-user",
      authorizationId: prepared.id,
      signature: VALID_SIGNATURE,
    });

    await assert.rejects(
      service.confirmDepositAuthorization({
        privyUserId: "did:privy:current-user",
        authorizationId: prepared.id,
        signature: VALID_SIGNATURE,
      }),
      (error: unknown) =>
        error instanceof GrowthAuthorizationError &&
        error.status === 409,
    );
  } finally {
    restorePrivyConfig();
  }
});

test("prepare fails closed unless the vault is Aave, Base, and USDC", async () => {
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
      const fetchMock: typeof fetch = async () =>
        new Response(
          JSON.stringify({
            ...invalidDetails,
            user_apy: 425,
            available_liquidity_usd: 1000,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );

      await assert.rejects(
        getRequiredAaveBaseUsdcVault(fetchMock),
        InvalidGrowthVaultError,
      );

      const { service } = createTestService({
        getVault: async () => getRequiredAaveBaseUsdcVault(fetchMock),
      });

      await assert.rejects(
        service.prepareDepositAuthorization({
          privyUserId: "did:privy:current-user",
          amountUsdc: "1.00",
        }),
        (error: unknown) =>
          error instanceof GrowthAuthorizationError &&
          error.status === 502 &&
          error.code === "PRIVY_UNAVAILABLE",
      );
    }
  } finally {
    restorePrivyConfig();
  }
});

test("authorization HTTP endpoints prepare and confirm without exposing secrets", async () => {
  configureTestPrivy();
  const { service } = createTestService();
  const app = express();
  app.use(express.json());
  app.use(
    "/growth",
    createGrowthRouter({
      auth: (req, _res, next) => {
        (
          req as express.Request & { privyUserId?: string }
        ).privyUserId = "did:privy:current-user";
        next();
      },
      lookupWallet: async () => ({
        userExists: true,
        privyWalletId: "wallet-current-user",
      }),
      getGrowth: async () => {
        throw new Error("GET growth should not run.");
      },
      authorization: service,
    }),
  );

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const preparedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/deposit-authorizations`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.00" }),
      },
    );
    const prepared = (await preparedResponse.json()) as {
      id?: string;
      status?: string;
    };

    assert.equal(preparedResponse.status, 201);
    assert.equal(prepared.status, "unused");
    assertNoSecrets(prepared);

    const confirmedResponse = await fetch(
      `http://127.0.0.1:${address.port}/growth/deposit-authorizations/${prepared.id}/confirm`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ signature: VALID_SIGNATURE }),
      },
    );
    const confirmed = await confirmedResponse.json();

    assert.equal(confirmedResponse.status, 200);
    assert.equal((confirmed as { status?: string }).status, "authorized");
    assertNoSecrets(confirmed);
  } finally {
    restorePrivyConfig();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("authorization endpoints require authentication", async () => {
  const app = createApp();
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/v1/growth/deposit-authorizations`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.00" }),
      },
    );
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(response.status, 401);
    assert.equal(body.error?.code, "UNAUTHORIZED");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("smart_wallet users cannot use the Privy Earn authorization path", async () => {
  configureTestPrivy();

  try {
    const service = createGrowthAuthorizationService({
      lookupAccount: async () => ({
        userExists: true,
        userId: "11111111-1111-1111-1111-111111111111",
        privyWalletId: "wallet-current-user",
        walletAddress: "0x1111111111111111111111111111111111111111",
        chain: "base",
        smartWalletAddress: "0x545803dDb0eE8eB96A531628cB8d3E0306d7e4CA",
        moneyAddressMode: "smart_wallet",
      }),
      verifyOwnership: async () => {
        throw new Error("ownership should not run");
      },
      getVault: async () => ({ decimals: 6 }),
      getAvailableRawUsdc: async () => 2_000_000n,
      store: createMemoryGrowthAuthorizationStore(),
      now: () => new Date("2026-09-23T17:00:00.000Z"),
      createId: () => "22222222-2222-2222-2222-222222222222",
      createIdempotencyKey: () => "33333333-3333-3333-3333-333333333333",
    });

    await assert.rejects(
      () =>
        service.prepareDepositAuthorization({
          privyUserId: "did:privy:current-user",
          amountUsdc: "1.00",
        }),
      (error: unknown) =>
        error instanceof GrowthAuthorizationError &&
        error.status === 409 &&
        error.code === "VALIDATION_ERROR",
    );
  } finally {
    restorePrivyConfig();
  }
});

test("eoa users cannot prepare a smart wallet deposit", async () => {
  const app = express();
  app.use(express.json());
  app.use(
    "/growth",
    createGrowthRouter({
      auth: (req, _res, next) => {
        (
          req as express.Request & { privyUserId?: string }
        ).privyUserId = "did:privy:current-user";
        next();
      },
      lookupWallet: async () => ({
        userExists: true,
        privyWalletId: "wallet-current-user",
        moneyAddressMode: "eoa",
        smartWalletAddress: null,
      }),
      getGrowth: async () => {
        throw new Error("GET growth should not run.");
      },
    }),
  );

  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(
      `http://127.0.0.1:${address.port}/growth/smart-wallet-deposits/prepare`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsdc: "1.00" }),
      },
    );
    const body = (await response.json()) as { error?: { code?: string } };
    assert.equal(response.status, 409);
    assert.equal(body.error?.code, "VALIDATION_ERROR");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("authorization source never calls deposit execution", async () => {
  const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const files = [
    "src/services/privyGrowthAuthorization.ts",
    "src/services/growthAuthorizationStore.ts",
    "src/services/growthAuthorizationAccount.ts",
    "src/routes/v1/growth.ts",
    "src/services/aaveDepositPlan.ts",
    "src/services/aaveDepositExecution.ts",
    "src/services/aaveDepositStore.ts",
    "src/services/walletGrowth.ts",
    "src/services/aaveGrowth.ts",
    "src/services/privyGrowth.ts",
  ];

  for (const file of files) {
    const source = await readFile(path.join(apiRoot, file), "utf8");
    assert.doesNotMatch(source, /\._deposit\s*\(/);
    assert.doesNotMatch(source, /wallets\(\)\.earn/);
    assert.doesNotMatch(source, /\._withdraw\s*\(/);
    assert.doesNotMatch(source, /\/earn\/ethereum\/withdraw/);
    assert.doesNotMatch(source, /sendTransaction/);
    assert.doesNotMatch(source, /paymaster/i);
  }
});
