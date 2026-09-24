import { env, requirePrivyConfig } from "../config/env.js";

const PRIVY_API_BASE_URL = "https://api.privy.io/v1";
const REQUIRED_PROVIDER = "aave";
const REQUIRED_CAIP2 = "eip155:8453";
const REQUIRED_ASSET = "usdc";

type Fetch = typeof fetch;

type EarnAsset = {
  symbol: string;
  decimals: number;
};

type VaultDetails = {
  provider: string;
  caip2: string;
  asset: EarnAsset;
  user_apy: number;
  available_liquidity_usd: number;
};

type VaultPosition = {
  asset: EarnAsset;
  total_deposited: string;
  total_withdrawn: string;
  assets_in_vault: string;
};

export type GrowthSummary = {
  liveApyPercent: string;
  currentRedeemableUsdc: string;
  totalDepositedUsdc: string;
  totalWithdrawnUsdc: string;
  earnedYieldUsdc: string;
  availableLiquidityUsd: string;
};

export class GrowthConfigurationError extends Error {
  constructor() {
    super("Privy Earn is not configured.");
    this.name = "GrowthConfigurationError";
  }
}

export class InvalidGrowthVaultError extends Error {
  constructor() {
    super("Privy Earn vault does not match the required product.");
    this.name = "InvalidGrowthVaultError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAsset(value: unknown): EarnAsset {
  if (
    !isRecord(value) ||
    typeof value.symbol !== "string" ||
    typeof value.decimals !== "number" ||
    !Number.isInteger(value.decimals) ||
    value.decimals < 0
  ) {
    throw new InvalidGrowthVaultError();
  }

  return { symbol: value.symbol, decimals: value.decimals };
}

function parseVaultDetails(value: unknown): VaultDetails {
  if (
    !isRecord(value) ||
    typeof value.provider !== "string" ||
    typeof value.caip2 !== "string" ||
    typeof value.user_apy !== "number" ||
    !Number.isFinite(value.user_apy) ||
    value.user_apy < 0 ||
    typeof value.available_liquidity_usd !== "number" ||
    !Number.isFinite(value.available_liquidity_usd) ||
    value.available_liquidity_usd < 0
  ) {
    throw new InvalidGrowthVaultError();
  }

  return {
    provider: value.provider,
    caip2: value.caip2,
    asset: parseAsset(value.asset),
    user_apy: value.user_apy,
    available_liquidity_usd: value.available_liquidity_usd,
  };
}

function parseRawAmount(value: unknown): string {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    throw new InvalidGrowthVaultError();
  }
  return value;
}

function parseVaultPosition(value: unknown): VaultPosition {
  if (!isRecord(value)) {
    throw new InvalidGrowthVaultError();
  }

  return {
    asset: parseAsset(value.asset),
    total_deposited: parseRawAmount(value.total_deposited),
    total_withdrawn: parseRawAmount(value.total_withdrawn),
    assets_in_vault: parseRawAmount(value.assets_in_vault),
  };
}

function requireExpectedVaultDetails(details: VaultDetails): void {
  if (
    details.provider.toLowerCase() !== REQUIRED_PROVIDER ||
    details.caip2 !== REQUIRED_CAIP2 ||
    details.asset.symbol.toLowerCase() !== REQUIRED_ASSET
  ) {
    throw new InvalidGrowthVaultError();
  }
}

function requireExpectedVault(details: VaultDetails, position: VaultPosition): void {
  requireExpectedVaultDetails(details);

  if (
    position.asset.symbol.toLowerCase() !== REQUIRED_ASSET ||
    position.asset.decimals !== details.asset.decimals
  ) {
    throw new InvalidGrowthVaultError();
  }
}

export type RequiredAaveBaseUsdcVault = {
  decimals: number;
};

/** Fail closed unless the configured vault is Aave + Base Mainnet + USDC. */
export async function getRequiredAaveBaseUsdcVault(
  fetchImpl: Fetch = fetch,
): Promise<RequiredAaveBaseUsdcVault> {
  requirePrivyConfig();

  const vaultId = env.privyEarnAaveBaseUsdcVaultId.trim();
  if (!vaultId) {
    throw new GrowthConfigurationError();
  }

  const details = parseVaultDetails(
    await getPrivyJson(
      `/earn/ethereum/vaults/${encodeURIComponent(vaultId)}`,
      fetchImpl,
    ),
  );
  requireExpectedVaultDetails(details);

  return { decimals: details.asset.decimals };
}

function formatRawAmount(rawAmount: bigint, decimals: number): string {
  const negative = rawAmount < 0n;
  const absolute = negative ? -rawAmount : rawAmount;
  const padded = absolute.toString().padStart(decimals + 1, "0");
  const whole = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction = decimals === 0 ? "" : padded.slice(-decimals);
  const trimmedFraction = fraction.replace(/0+$/, "");
  const displayedFraction = trimmedFraction.padEnd(2, "0");

  return `${negative ? "-" : ""}${whole}${
    displayedFraction ? `.${displayedFraction}` : ".00"
  }`;
}

async function getPrivyJson(
  path: string,
  fetchImpl: Fetch,
): Promise<unknown> {
  const credentials = Buffer.from(
    `${env.privyAppId}:${env.privyAppSecret}`,
    "utf8",
  ).toString("base64");
  const response = await fetchImpl(`${PRIVY_API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${credentials}`,
      "privy-app-id": env.privyAppId,
    },
  });

  if (!response.ok) {
    throw new Error("Privy Earn request failed.");
  }

  return response.json();
}

/** Read-only Aave/Base/USDC growth data for one Privy embedded wallet. */
export async function getGrowthForPrivyWallet(
  privyWalletId: string,
  fetchImpl: Fetch = fetch,
): Promise<GrowthSummary> {
  requirePrivyConfig();

  const vaultId = env.privyEarnAaveBaseUsdcVaultId.trim();
  if (!vaultId) {
    throw new GrowthConfigurationError();
  }

  const encodedVaultId = encodeURIComponent(vaultId);
  const encodedWalletId = encodeURIComponent(privyWalletId);
  const [detailsValue, positionValue] = await Promise.all([
    getPrivyJson(`/earn/ethereum/vaults/${encodedVaultId}`, fetchImpl),
    getPrivyJson(
      `/wallets/${encodedWalletId}/earn/ethereum/vaults?vault_id=${encodedVaultId}`,
      fetchImpl,
    ),
  ]);

  const details = parseVaultDetails(detailsValue);
  const position = parseVaultPosition(positionValue);
  requireExpectedVault(details, position);

  const totalDeposited = BigInt(position.total_deposited);
  const totalWithdrawn = BigInt(position.total_withdrawn);
  const currentRedeemable = BigInt(position.assets_in_vault);
  const earnedYield = currentRedeemable - totalDeposited + totalWithdrawn;

  return {
    liveApyPercent: (details.user_apy / 100).toFixed(2),
    currentRedeemableUsdc: formatRawAmount(
      currentRedeemable,
      details.asset.decimals,
    ),
    totalDepositedUsdc: formatRawAmount(
      totalDeposited,
      details.asset.decimals,
    ),
    totalWithdrawnUsdc: formatRawAmount(
      totalWithdrawn,
      details.asset.decimals,
    ),
    earnedYieldUsdc: formatRawAmount(earnedYield, details.asset.decimals),
    availableLiquidityUsd: details.available_liquidity_usd.toFixed(2),
  };
}
