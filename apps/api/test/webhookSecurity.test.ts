import assert from "node:assert/strict";
import { test } from "node:test";
import {
  resolveSignedOnrampEvent,
  shouldFetchOrderBeforeCredit,
} from "../src/funding/webhooks.js";
import { confirmOrderBeforeLedgerCredit } from "../src/funding/orderVerification.js";

const createdPayload = {
  id: "evt_created",
  type: "onramp.transaction.created",
  orderId: "ord_1",
};

test("header injection: unsigned x-event-type/id cannot upgrade a created event", () => {
  const resolved = resolveSignedOnrampEvent(createdPayload, {
    "x-event-type": "onramp.transaction.success",
    "x-event-id": "evt_forged_success",
    "x-hook0-signature": "t=1710000000,v0=deadbeef",
  });

  assert.equal(resolved.eventType, "onramp.transaction.created");
  assert.equal(resolved.eventId, "evt_created");
  assert.equal(shouldFetchOrderBeforeCredit(resolved.eventType!), false);
});

test("header injection: unsigned headers are ignored even when v1 is also present", () => {
  const resolved = resolveSignedOnrampEvent(createdPayload, {
    "x-event-type": "onramp.transaction.success",
    "x-event-id": "evt_forged_success",
    "x-hook0-signature": "t=1710000000,h=x-event-type x-event-id,v0=aa,v1=bb",
  });

  assert.equal(resolved.eventType, "onramp.transaction.created");
  assert.equal(resolved.eventId, "evt_created");
});

test("signed v1 header list may bind event type and id", () => {
  const resolved = resolveSignedOnrampEvent(
    { id: "evt_body", type: "onramp.transaction.created", orderId: "ord_1" },
    {
      "x-event-type": "onramp.transaction.success",
      "x-event-id": "evt_signed",
      "x-hook0-signature": "t=1710000000,h=x-event-type x-event-id,v1=abcd",
    },
  );

  assert.equal(resolved.eventType, "onramp.transaction.success");
  assert.equal(resolved.eventId, "evt_signed");
  assert.equal(shouldFetchOrderBeforeCredit(resolved.eventType!), true);
});

test("webhook-must-fetch-order: Get Order is required and null does not credit", async () => {
  let fetches = 0;
  const result = await confirmOrderBeforeLedgerCredit(
    {
      orderId: "ord_1",
      depositAmountUsd: "10.00",
      destinationAddress: "0xabc",
    },
    async () => {
      fetches += 1;
      return null;
    },
  );

  assert.equal(fetches, 1);
  assert.equal(result.decision, "retry");
});

test("webhook-must-fetch-order: success event type alone is not enough to credit", () => {
  assert.equal(shouldFetchOrderBeforeCredit("onramp.transaction.success"), true);
});

test("webhook-must-fetch-order: completed order must match destination and amount", async () => {
  const matching = await confirmOrderBeforeLedgerCredit(
    {
      orderId: "ord_1",
      depositAmountUsd: "10.00",
      destinationAddress: "0xABC",
    },
    async () => ({
      orderId: "ord_1",
      status: "ONRAMP_ORDER_STATUS_COMPLETED",
      paymentSubtotal: "10",
      destinationAddress: "0xabc",
      destinationNetwork: "base",
      purchaseCurrency: "USDC",
      paymentCurrency: "USD",
    }),
  );
  assert.equal(matching.decision, "credit");

  const destMismatch = await confirmOrderBeforeLedgerCredit(
    {
      orderId: "ord_1",
      depositAmountUsd: "10.00",
      destinationAddress: "0xabc",
    },
    async () => ({
      orderId: "ord_1",
      status: "ONRAMP_ORDER_STATUS_COMPLETED",
      paymentSubtotal: "10.00",
      destinationAddress: "0xdef",
      destinationNetwork: "base",
    }),
  );
  assert.equal(destMismatch.decision, "ignore");

  const amountMismatch = await confirmOrderBeforeLedgerCredit(
    {
      orderId: "ord_1",
      depositAmountUsd: "10.00",
      destinationAddress: "0xabc",
    },
    async () => ({
      orderId: "ord_1",
      status: "ONRAMP_ORDER_STATUS_COMPLETED",
      paymentSubtotal: "25.00",
      destinationAddress: "0xabc",
      destinationNetwork: "base",
    }),
  );
  assert.equal(amountMismatch.decision, "ignore");
});
