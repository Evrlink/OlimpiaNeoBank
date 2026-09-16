import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isMockFundingAllowed,
  resolveFundingProvider,
} from "../src/config/env.js";

test("mock-not-in-prod: production refuses explicit mock", () => {
  assert.equal(isMockFundingAllowed("production"), false);
  assert.throws(
    () => resolveFundingProvider("mock", "production"),
    /only allowed in development or test/,
  );
});

test("mock-not-in-prod: staging is not on the mock allow-list", () => {
  assert.equal(isMockFundingAllowed("staging"), false);
  assert.throws(
    () => resolveFundingProvider("mock", "staging"),
    /only allowed in development or test/,
  );
});

test("mock-not-in-prod: unset provider does not default to auto-crediting mock", () => {
  assert.equal(resolveFundingProvider(undefined, "development"), "none");
  assert.equal(resolveFundingProvider("", "production"), "none");
  assert.equal(resolveFundingProvider("  ", "staging"), "none");
});

test("mock-not-in-prod: mock is allowed only on the explicit non-prod allow-list", () => {
  assert.equal(isMockFundingAllowed("development"), true);
  assert.equal(isMockFundingAllowed("test"), true);
  assert.equal(resolveFundingProvider("mock", "development"), "mock");
  assert.equal(resolveFundingProvider("mock", "test"), "mock");
});

test("forceFail/mock stay blocked in production; coinbase still selectable", () => {
  assert.equal(isMockFundingAllowed("production"), false);
  assert.equal(resolveFundingProvider("coinbase", "production"), "coinbase");
  assert.throws(() => resolveFundingProvider("bridge", "development"));
});
