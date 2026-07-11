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

function resolveFundingProvider(): "mock" | "bridge" {
  const explicit = process.env.FUNDING_PROVIDER?.trim().toLowerCase();
  const nodeEnv = process.env.NODE_ENV ?? "development";

  if (explicit === "mock") {
    if (nodeEnv === "production") {
      throw new Error(
        "FUNDING_PROVIDER=mock is not allowed in production. Use FUNDING_PROVIDER=bridge.",
      );
    }
    return "mock";
  }

  if (explicit === "bridge") {
    return "bridge";
  }

  // Production always uses Bridge. Local/dev may use mock when no API key is set.
  if (nodeEnv === "production") {
    return "bridge";
  }

  return process.env.BRIDGE_API_KEY?.trim() ? "bridge" : "mock";
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  databaseUrl: process.env.DATABASE_URL ?? "",
  privyAppId: process.env.PRIVY_APP_ID ?? "",
  privyAppSecret: process.env.PRIVY_APP_SECRET ?? "",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  fundingProvider: resolveFundingProvider(),
  bridgeApiKey: process.env.BRIDGE_API_KEY ?? "",
  bridgeWebhookSecret: process.env.BRIDGE_WEBHOOK_SECRET ?? "",
  bridgeApiBaseUrl: (
    process.env.BRIDGE_API_BASE_URL ?? "https://api.bridge.xyz/v0"
  ).replace(/\/+$/, ""),
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
