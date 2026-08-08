import { createPrivateKey, randomBytes, type KeyObject } from "node:crypto";
import { importJWK, SignJWT } from "jose";
import { env } from "../../config/env.js";
import { FundingProviderError } from "../errors.js";

type SigningKey = KeyObject | CryptoKey;

export const CDP_API_HOST = "api.cdp.coinbase.com";

function normalizePem(secret: string): string {
  return secret.replace(/\\n/g, "\n").trim();
}

function isPemSecret(secret: string): boolean {
  return /BEGIN (EC )?PRIVATE KEY/.test(secret);
}

async function loadSigningKey(secret: string): Promise<{ key: SigningKey; alg: "ES256" | "EdDSA" }> {
  const normalized = normalizePem(secret);

  if (isPemSecret(normalized)) {
    return {
      key: createPrivateKey(normalized),
      alg: "ES256",
    };
  }

  const decoded = Buffer.from(normalized, "base64");

  if (decoded.length !== 64) {
    throw new FundingProviderError(
      "Coinbase API secret must be a PEM EC key or a base64 Ed25519 key from CDP Portal.",
    );
  }

  const key = (await importJWK(
    {
      kty: "OKP",
      crv: "Ed25519",
      d: decoded.subarray(0, 32).toString("base64url"),
      x: decoded.subarray(32).toString("base64url"),
    },
    "EdDSA",
  )) as SigningKey;

  return { key, alg: "EdDSA" };
}

export async function createCdpBearerToken(input: {
  method: string;
  path: string;
  host?: string;
}): Promise<string> {
  const apiKeyId = env.coinbaseOnrampApiKey.trim();
  const apiKeySecret = env.coinbaseOnrampApiSecret.trim();

  if (!apiKeyId || !apiKeySecret) {
    throw new FundingProviderError(
      "Coinbase Headless is not configured. Set COINBASE_ONRAMP_API_KEY and COINBASE_ONRAMP_API_SECRET on the API.",
    );
  }

  const host = input.host ?? CDP_API_HOST;
  const method = input.method.toUpperCase();
  const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const { key, alg } = await loadSigningKey(apiKeySecret);
  const now = Math.floor(Date.now() / 1000);

  return new SignJWT({
    sub: apiKeyId,
    iss: "cdp",
    aud: ["cdp_service"],
    uri: `${method} ${host}${path}`,
  })
    .setProtectedHeader({
      alg,
      typ: "JWT",
      kid: apiKeyId,
      nonce: randomBytes(16).toString("hex"),
    })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + 120)
    .sign(key);
}
