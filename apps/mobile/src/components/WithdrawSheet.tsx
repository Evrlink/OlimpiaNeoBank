import { usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  executeSmartWalletWithdrawal,
  type SmartWalletWithdrawSession,
} from "@/services/aaveWithdrawExecution";
import { colors, radius, spacing } from "@/theme/colors";
import { getEmbeddedEthereumAddress } from "@/utils/auth";

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

type WithdrawStep = "amount" | "processing" | "success";

type WithdrawSheetProps = {
  visible: boolean;
  growBalanceUsdc: string;
  availableUsd: string;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  smartWalletAddress: string | null;
  getAccessToken: () => Promise<string | null>;
  onClose: () => void;
  onRefreshBalances: () => Promise<string>;
  onExecutionLockChange?: (locked: boolean) => void;
};

function formatUsdc(value: string): string {
  return value.startsWith("-") ? `-$${value.slice(1)}` : `$${value}`;
}

function normalizeAmountText(value: string): string {
  const trimmed = value.trim();
  return /^\.\d{1,6}$/.test(trimmed) ? `0${trimmed}` : trimmed;
}

function toUsdcMicros(value: string): bigint | null {
  const normalized = normalizeAmountText(value);
  if (!AMOUNT_PATTERN.test(normalized)) {
    return null;
  }

  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, "0"));
}

function toWithdrawUserMessage(error: unknown, growBalanceUsdc: string): string {
  const raw = error instanceof Error ? error.message.trim() : "";

  if (/not enabled/i.test(raw)) {
    return "Withdrawals aren’t available right now.";
  }
  if (/already been attempted/i.test(raw)) {
    return "This withdrawal is still processing.";
  }
  if (/greater than your Grow/i.test(raw)) {
    return `Withdraw up to ${formatUsdc(growBalanceUsdc)}`;
  }
  if (/already (open|submitted)|in progress/i.test(raw)) {
    return "A transfer is already in progress.";
  }
  if (
    raw &&
    !/0x|aave|gas|hash|wallet|userop|user op|uint256/i.test(raw)
  ) {
    return raw;
  }

  return "We couldn’t complete this withdrawal. Please try again.";
}

function createSession(): SmartWalletWithdrawSession {
  return {
    plan: null,
    sentTransactionHash: null,
    submitted: false,
    sendAttempted: false,
  };
}

export function WithdrawSheet({
  visible,
  growBalanceUsdc,
  availableUsd,
  moneyAddressMode,
  smartWalletAddress,
  getAccessToken,
  onClose,
  onRefreshBalances,
  onExecutionLockChange,
}: WithdrawSheetProps) {
  const insets = useSafeAreaInsets();
  const { getClientForChain } = useSmartWallets();
  const { user } = usePrivy();
  const sessionRef = useRef<SmartWalletWithdrawSession>(createSession());
  const executionLockRef = useRef(false);
  const [step, setStep] = useState<WithdrawStep>("amount");
  const [amountText, setAmountText] = useState("");
  const [withdrawnAmount, setWithdrawnAmount] = useState<string | null>(null);
  const [availableNow, setAvailableNow] = useState(availableUsd);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sendLockedWithoutHash, setSendLockedWithoutHash] = useState(false);
  const [backdropEnabled, setBackdropEnabled] = useState(false);

  const growMicros = toUsdcMicros(growBalanceUsdc);
  const normalizedAmount = normalizeAmountText(amountText);
  const enteredMicros = toUsdcMicros(normalizedAmount);
  const exceedsBalance =
    enteredMicros !== null && growMicros !== null && enteredMicros > growMicros;
  const canConfirm =
    !isExecuting &&
    !sendLockedWithoutHash &&
    AMOUNT_PATTERN.test(normalizedAmount) &&
    enteredMicros !== null &&
    enteredMicros > 0n &&
    !exceedsBalance;
  const canDismiss = !isExecuting && step !== "processing";

  const setExecutionLock = (locked: boolean) => {
    executionLockRef.current = locked;
    setIsExecuting(locked);
    onExecutionLockChange?.(locked);
  };

  const resetForm = useCallback(() => {
    setStep("amount");
    setAmountText("");
    setWithdrawnAmount(null);
    setActionError(null);
  }, []);

  const resetSessionIfSafe = useCallback(() => {
    const session = sessionRef.current;
    if (session.sendAttempted || session.plan?.sendAttemptedAt) {
      return;
    }

    sessionRef.current = createSession();
    setSendLockedWithoutHash(false);
  }, []);

  useEffect(() => {
    if (!visible) {
      setBackdropEnabled(false);

      if (!executionLockRef.current) {
        resetForm();
        resetSessionIfSafe();
      }
      return;
    }

    if (!executionLockRef.current) {
      setStep("amount");
      setWithdrawnAmount(null);
    }
  }, [resetForm, resetSessionIfSafe, visible]);

  const handleRequestClose = useCallback(() => {
    if (!canDismiss) {
      return;
    }

    resetForm();
    resetSessionIfSafe();
    onClose();
  }, [canDismiss, onClose, resetForm, resetSessionIfSafe]);

  const handleMax = () => {
    if (isExecuting) {
      return;
    }

    // Exact redeemable Grow balance from the server. Never a protocol max.
    setAmountText(growBalanceUsdc.trim());
    setActionError(null);
  };

  const handleConfirm = () => {
    if (executionLockRef.current || isExecuting || sendLockedWithoutHash || !canConfirm) {
      return;
    }

    const amountUsdc = normalizedAmount;
    if (!AMOUNT_PATTERN.test(amountUsdc)) {
      return;
    }

    const session = sessionRef.current;
    if (
      session.plan &&
      session.plan.amountUsdc !== amountUsdc &&
      !session.sendAttempted &&
      !session.plan.sendAttemptedAt
    ) {
      sessionRef.current = createSession();
    }

    setActionError(null);
    setStep("processing");
    setExecutionLock(true);

    void (async () => {
      try {
        const accessToken = await getAccessToken();
        const confirmed = await executeSmartWalletWithdrawal({
          accessToken: accessToken ?? "",
          amountUsdc,
          session: sessionRef.current,
          moneyAddressMode,
          expectedSmartWalletAddress: smartWalletAddress,
          embeddedEoaAddress: getEmbeddedEthereumAddress(user),
          getClientForChain: async ({ chainId }) => {
            const client = await getClientForChain({ chainId });
            return client;
          },
        });

        const nextAvailable = await onRefreshBalances();
        setWithdrawnAmount(confirmed.amountUsdc);
        setAvailableNow(nextAvailable);
        setSendLockedWithoutHash(false);
        setStep("success");
      } catch (error) {
        const nextSession = sessionRef.current;
        const locked =
          Boolean(nextSession.sendAttempted || nextSession.plan?.sendAttemptedAt) &&
          !nextSession.sentTransactionHash;
        setSendLockedWithoutHash(locked);
        setActionError(toWithdrawUserMessage(error, growBalanceUsdc));
        setStep("amount");
      } finally {
        setExecutionLock(false);
      }
    })();
  };

  const handleDone = () => {
    if (executionLockRef.current) {
      return;
    }

    sessionRef.current = createSession();
    setSendLockedWithoutHash(false);
    resetForm();
    onClose();
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onShow={() => {
        setBackdropEnabled(true);
      }}
      onRequestClose={handleRequestClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.root}>
          {backdropEnabled && canDismiss ? (
            <Pressable
              style={styles.backdrop}
              onPress={handleRequestClose}
              accessibilityRole="button"
              accessibilityLabel="Close withdraw"
            />
          ) : backdropEnabled ? (
            <View style={styles.backdrop} />
          ) : null}
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.handle} />

            {step !== "processing" && step !== "success" ? (
              <>
                <Text style={styles.title}>Withdraw</Text>
                <Text style={styles.balanceLabel}>Grow balance</Text>
                <Text style={styles.balanceValue}>{formatUsdc(growBalanceUsdc)}</Text>

                <View style={styles.inputRow}>
                  <Text style={styles.currency}>$</Text>
                  <TextInput
                    value={amountText}
                    onChangeText={(value) => {
                      setAmountText(value);
                      setActionError(null);
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={colors.inkMuted}
                    style={styles.input}
                    editable={!isExecuting}
                    accessibilityLabel="Withdraw amount"
                  />
                  <Pressable
                    onPress={handleMax}
                    disabled={isExecuting}
                    accessibilityRole="button"
                    accessibilityLabel="Withdraw the full Grow balance"
                    hitSlop={8}
                  >
                    <Text style={styles.maxLabel}>Max</Text>
                  </Pressable>
                </View>

                {exceedsBalance ? (
                  <Text style={styles.inlineError}>
                    Withdraw up to {formatUsdc(growBalanceUsdc)}
                  </Text>
                ) : null}

                {actionError && !exceedsBalance ? (
                  <Text style={styles.inlineError}>{actionError}</Text>
                ) : null}

                <Pressable
                  style={[
                    styles.primaryButton,
                    !canConfirm ? styles.primaryButtonDisabled : null,
                  ]}
                  onPress={handleConfirm}
                  disabled={!canConfirm}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm"
                >
                  <Text style={styles.primaryButtonLabel}>Confirm</Text>
                </Pressable>
              </>
            ) : null}

            {step === "processing" ? (
              <>
                <Text style={styles.title}>Processing…</Text>
                <View style={styles.processingRow}>
                  <ActivityIndicator color={colors.raspberry} />
                  <Text style={styles.processingCopy}>Processing…</Text>
                </View>
                <Pressable
                  style={[styles.primaryButton, styles.primaryButtonDisabled]}
                  disabled
                  accessibilityRole="button"
                  accessibilityLabel="Confirm"
                >
                  <ActivityIndicator color={colors.white} />
                </Pressable>
              </>
            ) : null}

            {step === "success" && withdrawnAmount ? (
              <>
                <Text style={styles.title}>Done</Text>
                <Text style={styles.successAmount}>{formatUsdc(withdrawnAmount)}</Text>
                <Text style={styles.successBody}>Your money is now available to use.</Text>
                <Text style={styles.availableNow}>
                  Available now: {formatUsdc(availableNow)}
                </Text>
                <Pressable
                  style={styles.primaryButton}
                  onPress={handleDone}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.primaryButtonLabel}>Done</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(47, 47, 47, 0.4)",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.screenX + 8,
    paddingTop: 10,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: "rgba(232, 225, 218, 0.95)",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  balanceLabel: {
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  balanceValue: {
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  inputRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  currency: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: colors.ink,
    marginRight: 6,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: colors.ink,
  },
  maxLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.raspberry,
    paddingLeft: 12,
  },
  inlineError: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.raspberry,
  },
  primaryButton: {
    marginTop: 24,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.white,
  },
  processingRow: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  processingCopy: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.inkMuted,
  },
  successAmount: {
    marginTop: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  successBody: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  availableNow: {
    marginTop: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.ink,
  },
});
