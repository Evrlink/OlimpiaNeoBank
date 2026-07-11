import { Ionicons } from "@expo/vector-icons";
import { usePrivy } from "@privy-io/expo";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import {
  createDeposit,
  watchDepositStatus,
  type Deposit,
  type DepositStatus,
} from "@/services/api/funding";
import { colors, radius, spacing } from "@/theme/colors";

type FlowStep = "amount" | "review" | "status";

type AddMoneyScreenProps = {
  onBack: () => void;
  onCompleted: (amountUsd: string) => void;
  showTabBar?: boolean;
};

function statusCopy(status: DepositStatus): { title: string; body: string } {
  switch (status) {
    case "pending":
    case "processing":
      return {
        title: "Adding money to your account",
        body: "We're preparing your transfer. This usually takes a moment.",
      };
    case "completed":
      return {
        title: "Money added",
        body: "Your balance is updated. You’re ready to keep going.",
      };
    case "failed":
      return {
        title: "We couldn’t complete this deposit",
        body: "Nothing was added to your balance. You can try again.",
      };
  }
}

function normalizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length <= 1) {
    return cleaned;
  }
  return `${parts[0]}.${parts.slice(1).join("").slice(0, 2)}`;
}

function formatDisplayAmount(amountUsd: string): string {
  const parsed = Number(amountUsd);
  if (!Number.isFinite(parsed)) {
    return amountUsd;
  }
  return parsed.toFixed(2);
}

export function AddMoneyScreen({
  onBack,
  onCompleted,
  showTabBar = true,
}: AddMoneyScreenProps) {
  const { getAccessToken } = usePrivy();
  const [step, setStep] = useState<FlowStep>("amount");
  const [amountText, setAmountText] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deposit, setDeposit] = useState<Deposit | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const completedRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  const parsedAmount = Number(amountText);
  const canContinue =
    Number.isFinite(parsedAmount) && parsedAmount > 0 && amountText.trim().length > 0;

  const amountUsd = useMemo(
    () => (canContinue ? parsedAmount.toFixed(2) : ""),
    [canContinue, parsedAmount],
  );

  useEffect(() => {
    if (step !== "status" || !deposit?.id || !accessToken) {
      return;
    }

    completedRef.current = false;

    const stop = watchDepositStatus(accessToken, deposit.id, (next) => {
      setDeposit(next);

      if (next.status === "completed" && !completedRef.current) {
        completedRef.current = true;
        // Brief pause so success copy is readable before returning home.
        setTimeout(() => {
          onCompletedRef.current(next.amountUsd);
        }, 900);
      }
    });

    return stop;
  }, [step, deposit?.id, accessToken]);

  const handleContinueFromAmount = () => {
    if (!canContinue) {
      setInlineError("Enter an amount greater than zero.");
      return;
    }

    setInlineError(null);
    setStep("review");
  };

  const startDeposit = async (shouldFail: boolean) => {
    if (!amountUsd) {
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);

    try {
      const token = await getAccessToken();

      if (!token) {
        setInlineError("Please sign in again to add money.");
        return;
      }

      setAccessToken(token);

      const created = await createDeposit({
        accessToken: token,
        amountUsd,
        forceFail: shouldFail,
        idempotencyKey: `add-money-${Date.now()}`,
      });
      setDeposit(created);
      setStep("status");
    } catch (error) {
      setInlineError(
        error instanceof Error ? error.message : "We couldn’t start this deposit.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    void startDeposit(false);
  };

  const handleTryAgain = () => {
    setDeposit(null);
    setInlineError(null);
    setStep("amount");
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("amount");
      return;
    }

    if (step === "status" && deposit?.status === "failed") {
      handleTryAgain();
      return;
    }

    if (step === "status") {
      return;
    }

    onBack();
  };

  const status = deposit?.status ?? "processing";
  const copy = statusCopy(status);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["rgba(229, 75, 122, 0.12)", "rgba(251, 221, 230, 0.2)", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={handleBack}
            accessibilityLabel="Back"
            disabled={step === "status" && status !== "failed"}
          >
            {step === "status" && status !== "failed" ? (
              <View style={styles.backButtonSpacer} />
            ) : (
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            )}
          </Pressable>
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        {step === "amount" ? (
          <View style={styles.section}>
            <Text style={styles.title}>Add money</Text>
            <Text style={styles.subtitle}>
              Enter how much you’d like to add to your Olimpia balance.
            </Text>

            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Amount (USD)</Text>
              <View style={styles.inputRow}>
                <Text style={styles.currencyPrefix}>$</Text>
                <TextInput
                  value={amountText}
                  onChangeText={(value) => {
                    setAmountText(normalizeAmountInput(value));
                    setInlineError(null);
                  }}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.textInput, inlineError ? styles.fieldError : null]}
                  accessibilityLabel="Amount in dollars"
                />
              </View>
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, !canContinue ? styles.buttonDisabled : null]}
              onPress={handleContinueFromAmount}
              disabled={!canContinue}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "review" ? (
          <View style={styles.section}>
            <Text style={styles.title}>Review</Text>
            <Text style={styles.subtitle}>
              ${formatDisplayAmount(amountUsd)} will be added to your balance.
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>You’re adding</Text>
              <Text style={styles.summaryAmount}>${formatDisplayAmount(amountUsd)}</Text>
              <Text style={styles.summaryHint}>Shown in dollars in your Olimpia balance.</Text>
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting ? styles.buttonDisabled : null]}
              onPress={handleConfirm}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryLabel}>Confirm</Text>
            </Pressable>

            {typeof __DEV__ !== "undefined" && __DEV__ ? (
              <Pressable
                style={styles.devButton}
                onPress={() => {
                  void startDeposit(true);
                }}
                disabled={isSubmitting}
                accessibilityLabel="Simulate failed deposit"
              >
                <Text style={styles.devButtonLabel}>Simulate failure (dev)</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {step === "status" ? (
          <View style={styles.statusSection}>
            <View style={styles.statusCard}>
              {status === "completed" ? (
                <View style={styles.statusIconWrap}>
                  <Ionicons name="checkmark" size={22} color={colors.white} />
                </View>
              ) : status === "failed" ? (
                <View style={[styles.statusIconWrap, styles.statusIconFailed]}>
                  <Ionicons name="close" size={22} color={colors.white} />
                </View>
              ) : (
                <ActivityIndicator color={colors.raspberry} size="large" />
              )}

              <Text style={styles.statusTitle}>{copy.title}</Text>
              <Text style={styles.statusBody}>{copy.body}</Text>

              {deposit ? (
                <Text style={styles.statusAmount}>
                  ${formatDisplayAmount(deposit.amountUsd)}
                </Text>
              ) : null}
            </View>

            {status === "failed" ? (
              <Pressable style={styles.primaryButton} onPress={handleTryAgain}>
                <Text style={styles.primaryLabel}>Try again</Text>
              </Pressable>
            ) : null}

            {status === "completed" ? (
              <Text style={styles.returningHint}>Returning to Home…</Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {showTabBar ? <AppTabBar active="home" /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenX + 8,
    paddingBottom: spacing.block,
    paddingTop: spacing.card,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonSpacer: {
    width: 40,
    height: 40,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
  },
  section: {
    flex: 1,
    paddingTop: spacing.block,
  },
  title: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 12,
    maxWidth: 320,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  fieldCard: {
    marginTop: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.inkMuted,
  },
  inputRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyPrefix: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.ink,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: colors.ink,
    paddingVertical: 4,
  },
  fieldError: {
    color: colors.berryDark,
  },
  errorText: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.berryDark,
  },
  primaryButton: {
    marginTop: 24,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  summaryCard: {
    marginTop: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 20,
  },
  summaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  summaryAmount: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    color: colors.ink,
  },
  summaryHint: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  devButton: {
    marginTop: 12,
    height: 44,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  devButtonLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.inkMuted,
  },
  statusSection: {
    flex: 1,
    paddingTop: spacing.block * 2,
  },
  statusCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 32,
    alignItems: "center",
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  statusIconFailed: {
    backgroundColor: colors.berryDark,
  },
  statusTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.ink,
    textAlign: "center",
  },
  statusBody: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: "center",
    maxWidth: 280,
  },
  statusAmount: {
    marginTop: 16,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.ink,
  },
  returningHint: {
    marginTop: 20,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
