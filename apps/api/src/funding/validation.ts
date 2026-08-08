const MIN_AMOUNT_USD = 0.01;
const MAX_AMOUNT_USD = 25_000;

export type ParsedDepositAmount =
  | { ok: true; amountUsd: string }
  | { ok: false; message: string };

export function parseDepositAmountUsd(value: unknown): ParsedDepositAmount {
  if (typeof value !== "string" && typeof value !== "number") {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  const raw = String(value).trim();

  if (!raw) {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return {
      ok: false,
      message: "Enter a valid dollar amount with up to two decimal places.",
    };
  }

  const amount = Number(raw);

  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_USD) {
    return { ok: false, message: "Enter an amount greater than zero." };
  }

  if (amount > MAX_AMOUNT_USD) {
    return {
      ok: false,
      message: `Enter an amount up to $${MAX_AMOUNT_USD.toLocaleString("en-US")}.`,
    };
  }

  return { ok: true, amountUsd: amount.toFixed(2) };
}

export function parsePaymentMethod(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "apple_pay";
  }

  const normalized = value.trim().slice(0, 64);
  if (normalized === "bank" || normalized === "card") {
    return "apple_pay";
  }

  return normalized;
}

export function parseIsoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return new Date(parsed).toISOString();
}

export function parseVerificationId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 128) : null;
}
