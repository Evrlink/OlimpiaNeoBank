import { getPool } from "../db/pool.js";
import { env } from "../config/env.js";
import {
  initiateOnrampVerification,
  submitOnrampVerification,
  type CoinbaseVerificationChannel,
} from "./coinbase/client.js";
import { FundingProviderError } from "./errors.js";

export class FundingVerificationError extends Error {
  constructor(
    message: string,
    readonly code:
      | "VALIDATION_ERROR"
      | "USER_NOT_FOUND"
      | "PROVIDER_ERROR"
      | "INTERNAL_ERROR" = "INTERNAL_ERROR",
  ) {
    super(message);
    this.name = "FundingVerificationError";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const US_PHONE_RE = /^\+1\d{10}$/;
const SANDBOX_PHONE_RE = /^\+1000\d{7}$/;
const OTP_RE = /^\d{6}$/;

async function resolveUserContext(privyUserId: string): Promise<{
  userId: string;
  email: string | null;
  phone: string | null;
}> {
  const pool = getPool();

  if (!pool) {
    throw new FundingVerificationError("Unable to start verification.", "INTERNAL_ERROR");
  }

  const result = await pool.query<{ id: string; email: string | null; phone: string | null }>(
    `
      SELECT id, email, phone
      FROM users
      WHERE privy_user_id = $1
    `,
    [privyUserId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new FundingVerificationError(
      "Account not found. Complete sign-in sync first.",
      "USER_NOT_FOUND",
    );
  }

  return { userId: row.id, email: row.email, phone: row.phone };
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim().toLowerCase();
  return EMAIL_RE.test(trimmed) ? trimmed : null;
}

function normalizePhone(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const digits = value.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) {
    return digits;
  }

  const onlyDigits = digits.replace(/\D/g, "");
  if (onlyDigits.length === 10) {
    return `+1${onlyDigits}`;
  }

  if (onlyDigits.length === 11 && onlyDigits.startsWith("1")) {
    return `+${onlyDigits}`;
  }

  return digits || null;
}

function isAllowedPhone(phone: string): boolean {
  if (US_PHONE_RE.test(phone)) {
    return true;
  }

  return env.coinbaseSandbox && SANDBOX_PHONE_RE.test(phone);
}

export async function startFundingVerification(input: {
  privyUserId: string;
  channel: unknown;
  destination?: unknown;
}): Promise<{
  verificationId: string;
  otpExpiresAt?: string;
  channel: CoinbaseVerificationChannel;
  destination: string;
}> {
  const channel = input.channel === "sms" || input.channel === "email" ? input.channel : null;

  if (!channel) {
    throw new FundingVerificationError(
      "Choose email or SMS verification.",
      "VALIDATION_ERROR",
    );
  }

  const user = await resolveUserContext(input.privyUserId);
  let destination =
    channel === "email"
      ? normalizeEmail(input.destination) ?? normalizeEmail(user.email)
      : normalizePhone(input.destination) ?? normalizePhone(user.phone);

  if (channel === "email" && !destination) {
    throw new FundingVerificationError("Enter a valid email address.", "VALIDATION_ERROR");
  }

  if (channel === "sms") {
    if (!destination || !isAllowedPhone(destination)) {
      throw new FundingVerificationError(
        env.coinbaseSandbox
          ? "Enter a valid US phone number, or a sandbox number like +10005550100."
          : "Enter a valid US cell phone number.",
        "VALIDATION_ERROR",
      );
    }
  }

  if (!destination) {
    throw new FundingVerificationError("Enter a valid contact to verify.", "VALIDATION_ERROR");
  }

  if (env.fundingProvider === "mock") {
    return {
      verificationId: `mock_${channel}_${user.userId}`,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      channel,
      destination,
    };
  }

  try {
    const started = await initiateOnrampVerification({
      channel,
      destination,
    });

    return {
      verificationId: started.verificationId,
      otpExpiresAt: started.otpExpiresAt,
      channel,
      destination,
    };
  } catch (error) {
    if (error instanceof FundingProviderError) {
      throw new FundingVerificationError(error.message, "PROVIDER_ERROR");
    }

    throw new FundingVerificationError(
      "Unable to start verification. Please try again.",
      "PROVIDER_ERROR",
    );
  }
}

export async function completeFundingVerification(input: {
  privyUserId: string;
  verificationId: unknown;
  otpCode: unknown;
  channel?: unknown;
  destination?: unknown;
}): Promise<{
  verificationId: string;
  verificationExpiresAt?: string;
  channel?: CoinbaseVerificationChannel;
}> {
  await resolveUserContext(input.privyUserId);

  const verificationId =
    typeof input.verificationId === "string" ? input.verificationId.trim() : "";
  const otpCode = typeof input.otpCode === "string" ? input.otpCode.trim() : "";

  if (!verificationId) {
    throw new FundingVerificationError("Verification is missing. Start again.", "VALIDATION_ERROR");
  }

  if (!OTP_RE.test(otpCode)) {
    throw new FundingVerificationError("Enter the 6-digit code.", "VALIDATION_ERROR");
  }

  if (env.fundingProvider === "mock") {
    const channel =
      input.channel === "sms" || input.channel === "email" ? input.channel : undefined;
    const destination =
      channel === "sms"
        ? normalizePhone(input.destination)
        : channel === "email"
          ? normalizeEmail(input.destination)
          : null;

    if (channel && destination) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          channel === "email"
            ? `UPDATE users SET email = COALESCE(email, $2) WHERE privy_user_id = $1`
            : `UPDATE users SET phone = $2 WHERE privy_user_id = $1`,
          [input.privyUserId, destination],
        );
      }
    }

    return {
      verificationId,
      verificationExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      channel,
    };
  }

  try {
    const submitted = await submitOnrampVerification({
      verificationId,
      otpCode,
    });

    const channel =
      input.channel === "sms" || input.channel === "email" ? input.channel : undefined;
    const destination =
      channel === "sms"
        ? normalizePhone(input.destination)
        : channel === "email"
          ? normalizeEmail(input.destination)
          : null;

    if (channel && destination) {
      const pool = getPool();
      if (pool) {
        await pool.query(
          channel === "email"
            ? `UPDATE users SET email = COALESCE(email, $2) WHERE privy_user_id = $1`
            : `UPDATE users SET phone = $2 WHERE privy_user_id = $1`,
          [input.privyUserId, destination],
        );
      }
    }

    return {
      verificationId: submitted.verificationId,
      verificationExpiresAt: submitted.verificationExpiresAt,
      channel,
    };
  } catch (error) {
    if (error instanceof FundingProviderError) {
      throw new FundingVerificationError(error.message, "PROVIDER_ERROR");
    }

    throw new FundingVerificationError(
      "Unable to verify that code. Please try again.",
      "PROVIDER_ERROR",
    );
  }
}
