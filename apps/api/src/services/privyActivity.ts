import { getPrivyClient } from "../auth/privy.js";
import type { ActivityItem, ActivityStatus } from "../lib/responses.js";

type PrivyTransferDetails = {
  type?: string;
  asset?: string;
  chain?: string;
  raw_value?: string;
  raw_value_decimals?: number;
  display_values?: Record<string, string>;
};

type PrivyWalletTransaction = {
  privy_transaction_id?: string | null;
  transaction_hash?: string | null;
  status?: string;
  created_at?: number;
  details?: PrivyTransferDetails;
};

function mapActivityType(detailsType: string | undefined): "received" | "sent" | null {
  if (detailsType === "transfer_received") {
    return "received";
  }

  if (detailsType === "transfer_sent") {
    return "sent";
  }

  return null;
}

function mapActivityStatus(status: string | undefined): ActivityStatus | null {
  if (status === "confirmed" || status === "finalized") {
    return "completed";
  }

  if (status === "pending") {
    return "pending";
  }

  if (status === "broadcasted") {
    return "processing";
  }

  if (
    status === "failed" ||
    status === "execution_reverted" ||
    status === "provider_error"
  ) {
    return "failed";
  }

  return null;
}

function formatUsdAmount(details: PrivyTransferDetails | undefined): string | null {
  if (!details) {
    return null;
  }

  const display = details.display_values?.usdc?.trim();

  if (display) {
    const fromDisplay = Number(display);

    if (Number.isFinite(fromDisplay)) {
      return fromDisplay.toFixed(2);
    }
  }

  const raw = Number(details.raw_value);
  const decimals = details.raw_value_decimals;

  if (Number.isFinite(raw) && typeof decimals === "number" && decimals >= 0) {
    return (raw / 10 ** decimals).toFixed(2);
  }

  return null;
}

function toHomeActivityItem(tx: PrivyWalletTransaction): ActivityItem | null {
  const type = mapActivityType(tx.details?.type);

  if (!type) {
    return null;
  }

  if (tx.details?.asset && tx.details.asset !== "usdc") {
    return null;
  }

  if (tx.details?.chain && tx.details.chain !== "base") {
    return null;
  }

  const status = mapActivityStatus(tx.status);

  if (!status) {
    return null;
  }

  const amountUsd = formatUsdAmount(tx.details);

  if (!amountUsd) {
    return null;
  }

  const id =
    tx.privy_transaction_id?.trim() || tx.transaction_hash?.trim() || "";

  if (!id) {
    return null;
  }

  const createdAtMs = Number(tx.created_at);

  if (!Number.isFinite(createdAtMs)) {
    return null;
  }

  return {
    id,
    type,
    amountUsd,
    status,
    counterpartyId: null,
    createdAt: new Date(createdAtMs).toISOString(),
  };
}

/** V1 Home activity: Privy Base USDC transfers (not the Olimpia ledger). */
export async function getHomeActivityForPrivyWallet(
  privyWalletId: string,
  limit: number,
): Promise<ActivityItem[]> {
  const client = getPrivyClient();
  const response = await client.wallets().transactions.get(privyWalletId, {
    chain: "base",
    asset: "usdc",
    limit,
  });

  return response.transactions
    .map((tx) => toHomeActivityItem(tx as PrivyWalletTransaction))
    .filter((item): item is ActivityItem => item !== null);
}
