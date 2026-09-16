import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import { phase2Eligibility } from "../src/lib/responses.js";
import {
  isOnRampFundingEnabled,
  requireOnRampEligibility,
} from "../src/funding/eligibility.js";
import { createApp } from "../src/app.js";

test("eligibility gate: onRamp is false today", () => {
  assert.equal(phase2Eligibility.onRamp.available, false);
  assert.equal(phase2Eligibility.onRamp.reason, "post_v1");
  assert.equal(isOnRampFundingEnabled(), false);
});

test("eligibility gate: funding routes refuse authenticated creates while gated", async () => {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    (req as express.Request & { privyUserId?: string }).privyUserId = "did:privy:test";
    next();
  });
  app.use(requireOnRampEligibility);
  app.post("/deposits", (_req, res) => {
    res.status(201).json({ created: true });
  });
  app.post("/verifications", (_req, res) => {
    res.status(201).json({ created: true });
  });

  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    for (const path of ["/deposits", "/verifications"]) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ amountUsd: "10.00", channel: "email" }),
      });
      const body = (await response.json()) as {
        error?: { code?: string };
      };

      assert.equal(response.status, 403);
      assert.equal(body.error?.code, "NOT_AVAILABLE");
    }
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("eligibility gate: missing Privy token still 401s on funding routes", async () => {
  const app = createApp();
  const server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");

  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/funding/deposits`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountUsd: "10.00" }),
    });
    const body = (await response.json()) as { error?: { code?: string } };

    assert.equal(response.status, 401);
    assert.equal(body.error?.code, "UNAUTHORIZED");
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
