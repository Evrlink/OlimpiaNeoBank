import { getOnrampOrder, type CoinbaseOnrampOrder } from "./coinbase/client.js";

export type OrderCreditDecision =
  | { decision: "credit"; orderId: string }
  | { decision: "fail"; orderId: string; reason: string }
  | { decision: "retry"; reason: string }
  | { decision: "ignore"; reason: string };

function moneyValue(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }

  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed.toFixed(2);
  }

  if (value && typeof value === "object" && "value" in value) {
    return moneyValue((value as { value: unknown }).value);
  }

  return null;
}

function orderFiatAmountUsd(order: CoinbaseOnrampOrder): string | null {
  return moneyValue(order.paymentSubtotal) ?? moneyValue(order.paymentAmount);
}

function orderDestinationAddress(order: CoinbaseOnrampOrder): string | null {
  const value = order.destinationAddress;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (value && typeof value === "object" && typeof value.address === "string") {
    const trimmed = value.address.trim();
    return trimmed || null;
  }

  return null;
}

function sameAddress(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

function optionalTokenMatches(
  value: string | undefined,
  expected: string,
): boolean {
  if (!value?.trim()) {
    return true;
  }

  return value.trim().toLowerCase() === expected.toLowerCase();
}

export function decideLedgerCreditFromOrder(input: {
  order: CoinbaseOnrampOrder | null;
  depositAmountUsd: string;
  destinationAddress: string;
}): OrderCreditDecision {
  const order = input.order;

  if (!order?.status) {
    return { decision: "retry", reason: "Coinbase order could not be loaded." };
  }

  const orderId = typeof order.orderId === "string" ? order.orderId.trim() : "";

  if (order.status === "ONRAMP_ORDER_STATUS_FAILED") {
    return {
      decision: "fail",
      orderId,
      reason: "Coinbase reported this order as failed.",
    };
  }

  if (order.status !== "ONRAMP_ORDER_STATUS_COMPLETED") {
    return { decision: "retry", reason: "Coinbase order is not completed yet." };
  }

  const destination = orderDestinationAddress(order);
  if (!destination || !sameAddress(destination, input.destinationAddress)) {
    return {
      decision: "ignore",
      reason: "Coinbase order destination does not match this deposit.",
    };
  }

  if (!optionalTokenMatches(order.destinationNetwork, "base")) {
    return {
      decision: "ignore",
      reason: "Coinbase order network does not match this deposit.",
    };
  }

  if (!optionalTokenMatches(order.purchaseCurrency, "USDC")) {
    return {
      decision: "ignore",
      reason: "Coinbase order asset does not match this deposit.",
    };
  }

  if (!optionalTokenMatches(order.paymentCurrency, "USD")) {
    return {
      decision: "ignore",
      reason: "Coinbase order currency does not match this deposit.",
    };
  }

  const fiatAmount = orderFiatAmountUsd(order);
  const depositAmount = moneyValue(input.depositAmountUsd);
  if (!fiatAmount || !depositAmount || fiatAmount !== depositAmount) {
    return {
      decision: "ignore",
      reason: "Coinbase order amount does not match this deposit.",
    };
  }

  return { decision: "credit", orderId };
}

export async function confirmOrderBeforeLedgerCredit(
  input: {
    orderId: string;
    depositAmountUsd: string;
    destinationAddress: string;
  },
  fetchOrder: (orderId: string) => Promise<CoinbaseOnrampOrder | null> = getOnrampOrder,
): Promise<OrderCreditDecision> {
  const order = await fetchOrder(input.orderId);
  return decideLedgerCreditFromOrder({
    order,
    depositAmountUsd: input.depositAmountUsd,
    destinationAddress: input.destinationAddress,
  });
}
