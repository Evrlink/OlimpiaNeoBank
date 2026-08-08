import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "../..");

dotenv.config({ path: path.join(apiRoot, ".env.local") });
dotenv.config({ path: path.join(apiRoot, ".env") });

function parseCorsOrigins(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value?.trim()) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

export type FundingProviderName = "mock" | "coinbase";

function resolveFundingProvider(): FundingProviderName {
  const explicit = process.env.FUNDING_PROVIDER?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (explicit === "bridge") {
    throw new Error(
      "FUNDING_PROVIDER=bridge is no longer supported. Use FUNDING_PROVIDER=mock (local only) or FUNDING_PROVIDER=coinbase.",
    );
  }

  if (explicit === "mock") {
    if (nodeEnv === "production") {
      throw new Error(
        "FUNDING_PROVIDER=mock is not allowed in production. Use FUNDING_PROVIDER=coinbase.",
      );
    }
    return "mock";
  }

  if (explicit === "coinbase") {
    return "coinbase";
  }

  // Production always uses Coinbase Headless. Local/dev may use mock until credentials exist.
  if (nodeEnv === "production") {
    return "coinbase";
  }

  return process.env.COINBASE_ONRAMP_API_KEY?.trim() ? "coinbase" : "mock";
}

function resolveCoinbaseSandbox(nodeEnv: string): boolean {
  const explicit = process.env.COINBASE_SANDBOX;
  if (explicit !== undefined) {
    return parseBoolean(explicit, nodeEnv !== "production");
  }

  return nodeEnv !== "production";
}

const nodeEnv = process.env.NODE_ENV ?? "development";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  privyAppId: process.env.PRIVY_APP_ID ?? "",
  privyAppSecret: process.env.PRIVY_APP_SECRET ?? "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  fundingProvider: resolveFundingProvider(),
  coinbaseOnrampApiKey: process.env.COINBASE_ONRAMP_API_KEY ?? "",
  coinbaseOnrampApiSecret: process.env.COINBASE_ONRAMP_API_SECRET ?? "",
  coinbaseWebhookSecret: process.env.COINBASE_WEBHOOK_SECRET ?? "",
  coinbaseSandbox: resolveCoinbaseSandbox(nodeEnv),
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "",
};

export function requirePrivyConfig(): void {
  if (!env.privyAppId.trim() || !env.privyAppSecret.trim()) {
    throw new Error(
      "Privy credentials are not configured. Set PRIVY_APP_ID and PRIVY_APP_SECRET in apps/api/.env.local.",
    );
  }
}
