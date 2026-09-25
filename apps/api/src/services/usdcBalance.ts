import { env } from "../config/env.js";
import type { BalanceSummary } from "../lib/responses.js";

const BASE_USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";

type Fetch = typeof fetch;

function formatUsd(value: number): string {
  return value.toFixed(2);
}

function encodeBalanceOf(address: string): string {
  return `0x70a08231${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function parseHexUint(value: unknown): bigint {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error("Invalid USDC balance response.");
  }

  return BigInt(value);
}

export function toHomeBalanceSummaryFromUsdcRaw(raw: bigint): BalanceSummary {
  const availableUsd = formatUsd(Number(raw) / 1_000_000);
  return {
    availableUsd,
    goalsAllocatedUsd: "0.00",
    growthAllocatedUsd: "0.00",
    totalDisplayUsd: availableUsd,
  };
}

/** Read-only USDC balanceOf on Base. No transactions. */
export async function getUsdcRawOnBase(
  address: string,
  fetchImpl: Fetch = fetch,
): Promise<bigint> {
  const wallet = address.trim();
  if (!ADDRESS_PATTERN.test(wallet)) {
    throw new Error("Invalid wallet address.");
  }

  const rpcUrl = env.baseRpcUrl.trim() || DEFAULT_BASE_RPC_URL;
  const response = await fetchImpl(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [
        {
          to: BASE_USDC,
          data: encodeBalanceOf(wallet),
        },
        "latest",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("USDC balance request failed.");
  }

  const body = (await response.json()) as { result?: unknown };
  return parseHexUint(body.result);
}

export async function getUsdcBalanceUsdOnBase(
  address: string,
  fetchImpl: Fetch = fetch,
): Promise<BalanceSummary> {
  return toHomeBalanceSummaryFromUsdcRaw(await getUsdcRawOnBase(address, fetchImpl));
}
