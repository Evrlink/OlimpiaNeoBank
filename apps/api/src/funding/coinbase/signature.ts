import { createHmac, timingSafeEqual } from "node:crypto";

type SignatureParts = {
  t?: string;
  h?: string;
  v0?: string;
  v1?: string;
};

function parseSignatureHeader(header: string): SignatureParts {
  const parts: SignatureParts = {};

  for (const element of header.split(",")) {
    const separator = element.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = element.slice(0, separator).trim();
    const value = element.slice(separator + 1).trim();

    if (key === "t" || key === "h" || key === "v0" || key === "v1") {
      parts[key] = value;
    }
  }

  return parts;
}

function safeEqualHex(expected: string, provided: string): boolean {
  try {
    const expectedBuffer = Buffer.from(expected, "hex");
    const providedBuffer = Buffer.from(provided, "hex");

    if (expectedBuffer.length === 0 || expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  } catch {
    return false;
  }
}

function timestampIsFresh(timestamp: string, maxAgeMinutes: number): boolean {
  const webhookTime = Number(timestamp) * 1000;

  if (!Number.isFinite(webhookTime)) {
    return false;
  }

  const ageMinutes = (Date.now() - webhookTime) / (1000 * 60);
  return ageMinutes <= maxAgeMinutes && ageMinutes >= -1;
}

/**
 * Verify CDP / Hook0 `X-Hook0-Signature`.
 * Prefer `v0` (`HMAC-SHA256(t.body)`). Fall back to `v1` when `v0` is absent.
 */
export function verifyCoinbaseWebhookSignature(input: {
  payload: string;
  signatureHeader: string | undefined;
  secret: string;
  headers: Record<string, string | string[] | undefined>;
  maxAgeMinutes?: number;
}): boolean {
  const signatureHeader = input.signatureHeader?.trim();
  const secret = input.secret.trim();

  if (!signatureHeader || !secret) {
    return false;
  }

  const parts = parseSignatureHeader(signatureHeader);
  const maxAgeMinutes = input.maxAgeMinutes ?? 5;

  if (!parts.t || !timestampIsFresh(parts.t, maxAgeMinutes)) {
    return false;
  }

  if (parts.v0) {
    const expected = createHmac("sha256", secret)
      .update(`${parts.t}.${input.payload}`, "utf8")
      .digest("hex");
    return safeEqualHex(expected, parts.v0);
  }

  if (parts.v1 && parts.h) {
    const headerNames = parts.h.split(/\s+/).filter(Boolean);
    const headerValues = headerNames
      .map((name) => {
        const value = input.headers[name] ?? input.headers[name.toLowerCase()];
        if (Array.isArray(value)) {
          return value.join(",");
        }
        return value ?? "";
      })
      .join(".");
    const signedPayload = `${parts.t}.${parts.h}.${headerValues}.${input.payload}`;
    const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");
    return safeEqualHex(expected, parts.v1);
  }

  return false;
}
