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
    return "bank";
  }

  return value.trim().slice(0, 64);
}
