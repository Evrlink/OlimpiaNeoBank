import { BASE_CHAIN_ID } from "@/services/aaveAddresses";
import {
  AaveWithdrawPlanGuardError,
  assertExecutableAaveWithdrawPlan,
  type ExecutableAaveWithdrawCalls,
} from "@/services/aaveWithdrawPlanGuard";
import {
  confirmSmartWalletWithdrawal,
  markSmartWalletWithdrawalSending,
  prepareSmartWalletWithdrawal,
  submitSmartWalletWithdrawal,
  type ConfirmedAaveWithdrawal,
  type PreparedAaveWithdrawPlan,
} from "@/services/api/growth";

export type SmartWalletWithdrawSession = {
  plan: PreparedAaveWithdrawPlan | null;
  sentTransactionHash: string | null;
  submitted: boolean;
  sendAttempted: boolean;
};

export type SmartWalletWithdrawClient = {
  chain?: { id?: number } | null;
  account?: { address?: string } | null;
  sendTransaction: (input: {
    calls: ExecutableAaveWithdrawCalls;
  }) => Promise<string>;
};

function sendHasBeenAttempted(session: SmartWalletWithdrawSession): boolean {
  return Boolean(session.sendAttempted || session.plan?.sendAttemptedAt);
}

/**
 * 3D send/retry wiring with a persisted send-attempt lock.
 * Callers must hold an execution lock for the entire await and must not
 * clear it while sendTransaction is in flight. Does not build UI.
 */
export async function executeSmartWalletWithdrawal(input: {
  accessToken: string;
  amountUsdc?: string;
  session: SmartWalletWithdrawSession;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  expectedSmartWalletAddress: string | null;
  embeddedEoaAddress: string | null;
  getClientForChain: (input: {
    chainId: number;
  }) => Promise<SmartWalletWithdrawClient>;
}): Promise<ConfirmedAaveWithdrawal> {
  const { session } = input;

  if (input.moneyAddressMode !== "smart_wallet") {
    throw new AaveWithdrawPlanGuardError(
      "This withdrawal path is only for Smart Wallet accounts.",
    );
  }

  const existingHash = session.sentTransactionHash;
  const existingPlan = session.plan;
  if (existingHash && existingPlan?.id) {
    const confirmed = await confirmSmartWalletWithdrawal(
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
    throw new AaveWithdrawPlanGuardError(
      "This withdrawal send has already been attempted.",
    );
  }

  const plan =
    existingPlan ??
    (await prepareSmartWalletWithdrawal(input.accessToken, input.amountUsdc ?? ""));
  session.plan = plan;

  if (plan.sendAttemptedAt && !session.sentTransactionHash) {
    session.sendAttempted = true;
    throw new AaveWithdrawPlanGuardError(
      "This withdrawal send has already been attempted.",
    );
  }

  if (!plan.executionEnabled) {
    throw new AaveWithdrawPlanGuardError("Smart Wallet withdrawals are not enabled.");
  }

  const client = await input.getClientForChain({ chainId: BASE_CHAIN_ID });
  const executable = assertExecutableAaveWithdrawPlan({
    plan,
    moneyAddressMode: input.moneyAddressMode,
    expectedSmartWalletAddress:
      input.expectedSmartWalletAddress ?? plan.smartWalletAddress,
    embeddedEoaAddress: input.embeddedEoaAddress,
    clientChainId: client.chain?.id ?? null,
    clientSmartWalletAddress: client.account?.address ?? null,
  });

  if (!session.submitted) {
    const submitted = await submitSmartWalletWithdrawal(input.accessToken, plan.id);
    session.plan = submitted;
    session.submitted = true;
  }

  const marked = await markSmartWalletWithdrawalSending(input.accessToken, plan.id);
  session.plan = marked;
  session.sendAttempted = true;

  const hash = await client.sendTransaction({ calls: executable.calls });
  if (!hash) {
    throw new AaveWithdrawPlanGuardError("This withdrawal send has already been attempted.");
  }

  session.sentTransactionHash = hash;

  const confirmed = await confirmSmartWalletWithdrawal(
    input.accessToken,
    plan.id,
    hash,
  );
  session.plan = null;
  session.sentTransactionHash = null;
  session.submitted = false;
  session.sendAttempted = false;
  return confirmed;
}
