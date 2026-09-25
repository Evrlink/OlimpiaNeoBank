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

export type FundingProviderName = "none" | "mock" | "coinbase";

/** Explicit non-production envs where FUNDING_PROVIDER=mock may run. Staging is not included. */
export const MOCK_FUNDING_ALLOWED_ENVS = ["development", "test"] as const;

export function isMockFundingAllowed(nodeEnv: string): boolean {
  const normalized = nodeEnv.trim().toLowerCase();
  if (!normalized || normalized === "production") {
    return false;
  }

  return (MOCK_FUNDING_ALLOWED_ENVS as readonly string[]).includes(normalized);
}

export function resolveFundingProvider(
  explicitProvider = process.env.FUNDING_PROVIDER,
  nodeEnv = process.env.NODE_ENV ?? "development",
): FundingProviderName {
  const explicit = explicitProvider?.trim().toLowerCase();

  if (explicit === "bridge") {
    throw new Error(
      "FUNDING_PROVIDER=bridge is no longer supported. Bridge is not an active provider. V1 funding is Receive USDC on Base. Post-V1 Add Money may set FUNDING_PROVIDER=coinbase.",
    );
  }

  // Coinbase Headless is post-V1 only. Never default production (or any env) to Coinbase.
  if (explicit === "coinbase") {
    return "coinbase";
  }

  if (explicit === "mock") {
    if (!isMockFundingAllowed(nodeEnv)) {
      throw new Error(
        "FUNDING_PROVIDER=mock is only allowed in development or test. Staging and production must unset it or use coinbase.",
      );
    }
    return "mock";
  }

  // Unset / unknown: do not default to auto-crediting mock.
  return "none";
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
  privyEarnAaveBaseUsdcVaultId:
    process.env.PRIVY_EARN_AAVE_BASE_USDC_VAULT_ID ?? "",
  baseRpcUrl: process.env.BASE_RPC_URL ?? "",
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
