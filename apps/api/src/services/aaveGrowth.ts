import { env } from "../config/env.js";
import { AAVE_V3_BASE_USDC_A_TOKEN } from "./aaveAddresses.js";
import type { GrowthSummary } from "./privyGrowth.js";

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const DEFAULT_BASE_RPC_URL = "https://mainnet.base.org";
const BALANCE_OF_SELECTOR = "70a08231";

type Fetch = typeof fetch;

export type AaveVaultMetadata = {
  decimals: number;
  liveApyPercent: string;
  availableLiquidityUsd: string;
};

function encodeBalanceOf(address: string): string {
  return `0x${BALANCE_OF_SELECTOR}${address.slice(2).toLowerCase().padStart(64, "0")}`;
}

function parseHexUint(value: unknown): bigint {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) {
    throw new Error("Invalid aUSDC balance response.");
  }

  return BigInt(value);
}

function formatRawAmount(rawAmount: bigint, decimals: number): string {
  const padded = rawAmount.toString().padStart(decimals + 1, "0");
  const whole = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction = decimals === 0 ? "" : padded.slice(-decimals);
  const trimmedFraction = fraction.replace(/0+$/, "");
  const displayedFraction = trimmedFraction.padEnd(2, "0");
  return `${whole}${displayedFraction ? `.${displayedFraction}` : ".00"}`;
}

export function toGrowthSummaryFromAusdcRaw(
  raw: bigint,
  metadata: AaveVaultMetadata,
): GrowthSummary {
  const currentRedeemableUsdc = formatRawAmount(raw, metadata.decimals);
  return {
    liveApyPercent: metadata.liveApyPercent,
    currentRedeemableUsdc,
    totalDepositedUsdc: "0.00",
    totalWithdrawnUsdc: "0.00",
    earnedYieldUsdc: "0.00",
    availableLiquidityUsd: metadata.availableLiquidityUsd,
  };
}

/** Read-only aUSDC balanceOf on Base. No transactions. */
export async function getAusdcRawOnBase(
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
          to: AAVE_V3_BASE_USDC_A_TOKEN,
          data: encodeBalanceOf(wallet),
        },
        "latest",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("aUSDC balance request failed.");
  }

  const body = (await response.json()) as { result?: unknown; error?: unknown };
  if (body.error) {
    throw new Error("aUSDC balance request failed.");
  }

  return parseHexUint(body.result);
}

export async function getGrowthForSmartWallet(
  smartWalletAddress: string,
  metadata: AaveVaultMetadata,
  fetchImpl: Fetch = fetch,
): Promise<GrowthSummary> {
  const raw = await getAusdcRawOnBase(smartWalletAddress, fetchImpl);
  return toGrowthSummaryFromAusdcRaw(raw, metadata);
}
