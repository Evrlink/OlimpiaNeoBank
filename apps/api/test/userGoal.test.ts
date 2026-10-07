import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  parseSavingsGoalWrite,
  SavingsGoalValidationError,
} from "../src/services/userGoal.js";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("migration stores one informational goal and no balance fields", async () => {
  const sql = await readFile(
    path.join(apiRoot, "migrations/013_savings_goals.sql"),
    "utf8",
  );

  assert.match(sql, /CREATE TABLE IF NOT EXISTS savings_goals/);
  assert.match(sql, /user_id uuid PRIMARY KEY REFERENCES users\(id\)/);
  assert.match(sql, /name text NOT NULL/);
  assert.match(sql, /target_amount_usd numeric\(18, 2\) NOT NULL/);
  assert.match(sql, /target_amount_usd > 0/);
  assert.doesNotMatch(sql, /goals_allocated_usd/);
  assert.doesNotMatch(sql, /progress/);
  assert.doesNotMatch(sql, /available_usd/);
  assert.doesNotMatch(sql, /growth_allocated_usd/);
});

test("a goal write keeps only a name and target amount", () => {
  assert.deepEqual(
    parseSavingsGoalWrite({
      name: "  Emergency Fund  ",
      targetAmountUsd: "5000",
    }),
    {
      name: "Emergency Fund",
      targetAmountUsd: "5000.00",
    },
  );

  assert.deepEqual(
    parseSavingsGoalWrite({
      name: "Trip",
      targetAmountUsd: "$1,250.50",
    }),
    {
      name: "Trip",
      targetAmountUsd: "1250.50",
    },
  );
});

test("a goal write rejects an empty name or a non-positive target", () => {
  assert.throws(
    () => parseSavingsGoalWrite({ name: "   ", targetAmountUsd: "10" }),
    SavingsGoalValidationError,
  );
  assert.throws(
    () => parseSavingsGoalWrite({ name: "Emergency Fund", targetAmountUsd: "0" }),
    SavingsGoalValidationError,
  );
  assert.throws(
    () => parseSavingsGoalWrite({ name: "Emergency Fund", targetAmountUsd: "-5" }),
    SavingsGoalValidationError,
  );
});

test("goal routes do not touch balance or yield fields", async () => {
  const route = await readFile(
    path.join(apiRoot, "src/routes/v1/goal.ts"),
    "utf8",
  );
  const service = await readFile(
    path.join(apiRoot, "src/services/userGoal.ts"),
    "utf8",
  );
  const combined = `${route}\n${service}`;

  assert.match(route, /goalRouter\.get\("\/"/);
  assert.match(route, /goalRouter\.put\("\/"/);
  assert.doesNotMatch(combined, /goals_allocated_usd/);
  assert.doesNotMatch(combined, /available_usd/);
  assert.doesNotMatch(combined, /growth_allocated_usd/);
  assert.doesNotMatch(combined, /progress/);
});
