import { BASE_CHAIN_ID } from "@/services/aaveAddresses";
import {
  confirmSmartWalletSend,
  markSmartWalletSendSending,
  prepareSmartWalletSend,
  submitSmartWalletSend,
  type ConfirmedUsdcSend,
  type PreparedUsdcSendPlan,
} from "@/services/api/sends";
import {
  assertExecutableUsdcSendPlan,
  UsdcSendPlanGuardError,
  type ExecutableUsdcSendCalls,
} from "@/services/usdcSendPlanGuard";

export type SmartWalletSendSession = {
  plan: PreparedUsdcSendPlan | null;
  sentTransactionHash: string | null;
  submitted: boolean;
  sendAttempted: boolean;
};

export type SmartWalletSendClient = {
  chain?: { id?: number } | null;
  account?: { address?: string } | null;
  sendTransaction: (input: {
    calls: ExecutableUsdcSendCalls;
  }) => Promise<string>;
};

function sendHasBeenAttempted(session: SmartWalletSendSession): boolean {
  return Boolean(session.sendAttempted || session.plan?.sendAttemptedAt);
}

/**
 * 3E.2 send/retry wiring with a persisted send-attempt lock.
 * Callers must hold an execution lock for the entire await and must not
 * clear it while sendTransaction is in flight.
 */
export async function executeSmartWalletSend(input: {
  accessToken: string;
  amountUsdc?: string;
  destinationAddress?: string;
  session: SmartWalletSendSession;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  expectedSmartWalletAddress: string | null;
  embeddedEoaAddress: string | null;
  getClientForChain: (input: {
    chainId: number;
  }) => Promise<SmartWalletSendClient>;
}): Promise<ConfirmedUsdcSend> {
  const { session } = input;

  if (input.moneyAddressMode !== "smart_wallet") {
    throw new UsdcSendPlanGuardError("This send path is only for Smart Wallet accounts.");
  }

  const existingHash = session.sentTransactionHash;
  const existingPlan = session.plan;
  if (existingHash && existingPlan?.id) {
    const confirmed = await confirmSmartWalletSend(
      input.accessToken,
      existingPlan.id,
      existingHash,
    );
    session.plan = null;
    session.sentTransactionHash = null;
    session.submitted = false;
    session.sendAttempted = false;
    return confirmed;
  }

  if (sendHasBeenAttempted(session) && !existingHash) {
    throw new UsdcSendPlanGuardError("This send has already been attempted.");
  }

  const plan =
    existingPlan ??
    (await prepareSmartWalletSend(
      input.accessToken,
      input.amountUsdc ?? "",
      input.destinationAddress ?? "",
    ));
  session.plan = plan;

  if (plan.sendAttemptedAt && !session.sentTransactionHash) {
    session.sendAttempted = true;
    throw new UsdcSendPlanGuardError("This send has already been attempted.");
  }

  if (!plan.executionEnabled) {
    throw new UsdcSendPlanGuardError("Smart Wallet sends are not enabled.");
  }

  const client = await input.getClientForChain({ chainId: BASE_CHAIN_ID });
  const executable = assertExecutableUsdcSendPlan({
    plan,
    moneyAddressMode: input.moneyAddressMode,
    expectedSmartWalletAddress:
      input.expectedSmartWalletAddress ?? plan.smartWalletAddress,
    embeddedEoaAddress: input.embeddedEoaAddress,
    clientChainId: client.chain?.id ?? null,
    clientSmartWalletAddress: client.account?.address ?? null,
  });

  if (!session.submitted) {
    const submitted = await submitSmartWalletSend(input.accessToken, plan.id);
    session.plan = submitted;
    session.submitted = true;
  }

  const marked = await markSmartWalletSendSending(input.accessToken, plan.id);
  session.plan = marked;
  session.sendAttempted = true;

  const hash = await client.sendTransaction({ calls: executable.calls });
  if (!hash) {
    throw new UsdcSendPlanGuardError("This send has already been attempted.");
  }

  session.sentTransactionHash = hash;

  const confirmed = await confirmSmartWalletSend(input.accessToken, plan.id, hash);
  session.plan = null;
  session.sentTransactionHash = null;
  session.submitted = false;
  session.sendAttempted = false;
  return confirmed;
}
