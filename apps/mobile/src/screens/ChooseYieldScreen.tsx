import { Ionicons } from "@expo/vector-icons";
import { useAuthorizationSignature, usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import { BASE_CHAIN_ID } from "@/services/aaveAddresses";
import { AavePlanGuardError, assertExecutableAavePlan } from "@/services/aavePlanGuard";
import {
  confirmGrowthAuthorization,
  confirmSmartWalletDeposit,
  failSmartWalletDeposit,
  GrowthAuthorizationApiError,
  payloadHexToBytes,
  prepareGrowthAuthorization,
  prepareSmartWalletDeposit,
  submitSmartWalletDeposit,
  type GrowthSummary,
  type PreparedAaveDepositPlan,
  type PreparedGrowthAuthorization,
} from "@/services/api/growth";
import { colors, radius, spacing } from "@/theme/colors";
import { getEmbeddedEthereumAddress } from "@/utils/auth";

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;

type AuthorizationStep = "enter" | "review" | "success";

type ChooseYieldScreenProps = {
  growth: GrowthSummary | null;
  availableUsd: string;
  moneyAddressMode?: "eoa" | "smart_wallet" | null;
  smartWalletAddress?: string | null;
  loading: boolean;
  error: string | null;
  getAccessToken: () => Promise<string | null>;
  onRetry: () => void | Promise<void>;
  onBack: () => void;
  onSmartWalletDepositSuccess?: () => void | Promise<void>;
};

function formatUsdc(value: string): string {
  return value.startsWith("-") ? `-$${value.slice(1)}` : `$${value}`;
}

function formatUsdcCurrency(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return formatUsdc(value);
  }
  const abs = Math.abs(parsed).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return parsed < 0 ? `-$${abs}` : `$${abs}`;
}

function parseUsdc(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function normalizeAmountText(value: string): string {
  const trimmed = value.trim();
  return /^\.\d{1,6}$/.test(trimmed) ? `0${trimmed}` : trimmed;
}

function isAuthorizationExpired(expiresAt: string, now = Date.now()): boolean {
  return Date.parse(expiresAt) <= now;
}

export function ChooseYieldScreen({
  growth,
  availableUsd,
  moneyAddressMode = "eoa",
  smartWalletAddress = null,
  loading,
  error,
  getAccessToken,
  onRetry,
  onBack,
  onSmartWalletDepositSuccess,
}: ChooseYieldScreenProps) {
  const isSmartWalletGrow = moneyAddressMode === "smart_wallet";
  const { generateAuthorizationSignature } = useAuthorizationSignature();
  const { getClientForChain } = useSmartWallets();
  const { user } = usePrivy();
  const preparedRef = useRef<PreparedGrowthAuthorization | null>(null);
  const smartWalletPlanRef = useRef<PreparedAaveDepositPlan | null>(null);
  const successScale = useRef(new Animated.Value(0.72)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const [step, setStep] = useState<AuthorizationStep>("enter");
  const [amountText, setAmountText] = useState("");
  const [reviewedAmount, setReviewedAmount] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [authorizedAmount, setAuthorizedAmount] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [successKind, setSuccessKind] = useState<"authorized" | "deposited">("authorized");
  const [executionEnabled, setExecutionEnabled] = useState(false);

  const availableAmount = parseUsdc(availableUsd);
  const hasAvailable = Number.isFinite(availableAmount) && availableAmount > 0;
  const normalizedAmount = normalizeAmountText(amountText);
  const canContinue =
    !isPreparing &&
    !isExecuting &&
    hasAvailable &&
    AMOUNT_PATTERN.test(normalizedAmount) &&
    parseUsdc(normalizedAmount) > 0;

  const remainingLabel = useMemo(() => {
    if (!Number.isFinite(availableAmount)) {
      return "Available balance unavailable";
    }

    return `Available ${formatUsdc(availableUsd)}`;
  }, [availableAmount, availableUsd]);

  const resetToEnter = useCallback((message?: string) => {
    preparedRef.current = null;
    smartWalletPlanRef.current = null;
    setReviewedAmount(null);
    setExpiresAt(null);
    setAuthorizedAmount(null);
    setSuccessKind("authorized");
    setExecutionEnabled(false);
    setStep("enter");
    setActionError(message ?? null);
  }, []);

  const returnToGrow = useCallback(() => {
    setAmountText("");
    resetToEnter();
  }, [resetToEnter]);

  useEffect(() => {
    if (step !== "success" || !authorizedAmount) {
      return;
    }

    successScale.setValue(0.72);
    successOpacity.setValue(0);

    Animated.parallel([
      Animated.spring(successScale, {
        toValue: 1,
        friction: 7,
        tension: 86,
        useNativeDriver: true,
      }),
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();

    const timeout = setTimeout(() => {
      returnToGrow();
    }, 1800);

    return () => {
      clearTimeout(timeout);
    };
  }, [authorizedAmount, returnToGrow, step, successOpacity, successScale]);

  const handleBack = useCallback(() => {
    if (isPreparing || isAuthorizing || isExecuting) {
      return;
    }

    if (step === "review") {
      resetToEnter();
      return;
    }

    if (step === "success") {
      returnToGrow();
      return;
    }

    onBack();
  }, [isAuthorizing, isExecuting, isPreparing, onBack, resetToEnter, returnToGrow, step]);

  const handleContinue = useCallback(async () => {
    if (isPreparing || isAuthorizing || isExecuting) {
      return;
    }

    const amountUsdc = normalizeAmountText(amountText);
    const entered = parseUsdc(amountUsdc);

    if (!AMOUNT_PATTERN.test(amountUsdc) || !Number.isFinite(entered) || entered <= 0) {
      setActionError("Enter a valid USDC amount.");
      return;
    }

    if (!hasAvailable || entered > availableAmount) {
      setActionError("This amount is greater than your available USDC.");
      return;
    }

    setIsPreparing(true);
    setActionError(null);

    try {
      const accessToken = await getAccessToken();

      if (isSmartWalletGrow) {
        const plan = await prepareSmartWalletDeposit(accessToken ?? "", amountUsdc);
        preparedRef.current = null;
        smartWalletPlanRef.current = plan;
        setExecutionEnabled(plan.executionEnabled);
        setReviewedAmount(plan.amountUsdc);
        setExpiresAt(null);
        setStep("review");
        return;
      }

      const prepared = await prepareGrowthAuthorization(accessToken ?? "", amountUsdc);

      if (isAuthorizationExpired(prepared.expiresAt)) {
        resetToEnter("This authorization expired. Enter the amount again.");
        return;
      }

      preparedRef.current = prepared;
      setReviewedAmount(prepared.amountUsdc);
      setExpiresAt(prepared.expiresAt);
      setStep("review");
    } catch (prepareError) {
      setActionError(
        prepareError instanceof Error
          ? prepareError.message
          : "We couldn’t prepare this authorization.",
      );
    } finally {
      setIsPreparing(false);
    }
  }, [
    amountText,
    availableAmount,
    getAccessToken,
    hasAvailable,
    isAuthorizing,
    isExecuting,
    isPreparing,
    isSmartWalletGrow,
    resetToEnter,
  ]);

  const handleStartEarning = useCallback(async () => {
    if (!isSmartWalletGrow || isPreparing || isAuthorizing || isExecuting) {
      return;
    }

    const reviewed = reviewedAmount;
    if (!reviewed) {
      return;
    }

    setIsExecuting(true);
    setActionError(null);

    try {
      const accessToken = await getAccessToken();
      const plan = await prepareSmartWalletDeposit(accessToken ?? "", reviewed);
      smartWalletPlanRef.current = plan;
      setExecutionEnabled(plan.executionEnabled);

      if (!plan.executionEnabled) {
        setActionError("Smart Wallet deposits are not enabled.");
        return;
      }

      const client = await getClientForChain({ chainId: BASE_CHAIN_ID });
      const executable = assertExecutableAavePlan({
        plan,
        expectedSmartWalletAddress: smartWalletAddress ?? plan.smartWalletAddress,
        embeddedEoaAddress: getEmbeddedEthereumAddress(user),
        clientChainId: client.chain?.id ?? null,
        clientSmartWalletAddress: client.account?.address ?? null,
      });

      await submitSmartWalletDeposit(accessToken ?? "", plan.id);

      let hash: string | null = null;
      try {
        hash = await client.sendTransaction({ calls: executable.calls });
      } catch (sendError) {
        await failSmartWalletDeposit(accessToken ?? "", plan.id).catch(() => undefined);
        throw sendError;
      }

      if (!hash) {
        await failSmartWalletDeposit(accessToken ?? "", plan.id).catch(() => undefined);
        setActionError("We couldn’t start earning. Please try again.");
        return;
      }

      const confirmed = await confirmSmartWalletDeposit(
        accessToken ?? "",
        plan.id,
        hash,
      );
      smartWalletPlanRef.current = null;
      setSuccessKind("deposited");
      setAuthorizedAmount(confirmed.amountUsdc);
      setStep("success");
      await onSmartWalletDepositSuccess?.();
    } catch (executeError) {
      if (executeError instanceof AavePlanGuardError) {
        setActionError(executeError.message);
        return;
      }

      setActionError(
        executeError instanceof Error
          ? executeError.message
          : "We couldn’t start earning. Please try again.",
      );
    } finally {
      setIsExecuting(false);
    }
  }, [
    getAccessToken,
    getClientForChain,
    isAuthorizing,
    isExecuting,
    isPreparing,
    isSmartWalletGrow,
    onSmartWalletDepositSuccess,
    reviewedAmount,
    smartWalletAddress,
    user,
  ]);

  const handleAuthorize = useCallback(async () => {
    const prepared = preparedRef.current;

    if (!prepared || isPreparing || isAuthorizing || isExecuting) {
      return;
    }

    if (isAuthorizationExpired(prepared.expiresAt)) {
      resetToEnter("This authorization expired. Enter the amount again.");
      return;
    }

    setIsAuthorizing(true);
    setActionError(null);

    try {
      const signatureResult = await generateAuthorizationSignature(
        payloadHexToBytes(prepared.payload),
      );
      const signature = signatureResult.signature?.trim() ?? "";

      if (signature.length < 16) {
        setActionError("We couldn’t authorize this amount. Please try again.");
        return;
      }

      if (isAuthorizationExpired(prepared.expiresAt)) {
        resetToEnter("This authorization expired. Enter the amount again.");
        return;
      }

      const accessToken = await getAccessToken();
      const confirmed = await confirmGrowthAuthorization(
        accessToken ?? "",
        prepared.id,
        signature,
      );

      preparedRef.current = null;
      setAuthorizedAmount(confirmed.amountUsdc);
      setStep("success");
    } catch (authorizeError) {
      if (
        authorizeError instanceof GrowthAuthorizationApiError &&
        authorizeError.message.toLowerCase().includes("expired")
      ) {
        resetToEnter("This authorization expired. Enter the amount again.");
        return;
      }

      setActionError(
        authorizeError instanceof Error
          ? authorizeError.message
          : "We couldn’t authorize this amount. Please try again.",
      );
    } finally {
      setIsAuthorizing(false);
    }
  }, [
    generateAuthorizationSignature,
    getAccessToken,
    isAuthorizing,
    isExecuting,
    isPreparing,
    resetToEnter,
  ]);

  const title = step === "review" ? "Review amount" : "Choose Yield";
  const subtitle =
    step === "review"
      ? isSmartWalletGrow
        ? executionEnabled
          ? "This moves the exact amount to Grow. The rate is variable and can change."
          : "This prepares the deposit. Money will not move yet."
        : "Confirm the exact USDC amount. This only authorizes the request. No money will move yet."
      : "See your current Grow balance, earned yield, and estimated variable rate.";

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
          {step === "success" ? (
            <View style={styles.backButtonSpacer} />
          ) : (
            <Pressable
              style={styles.backButton}
              onPress={handleBack}
              accessibilityLabel="Back"
              disabled={isPreparing || isAuthorizing || isExecuting}
            >
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
          )}
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.section}>
          {step !== "success" ? (
            <>
              <Text style={styles.eyebrow}>Growth</Text>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </>
          ) : null}

          {step === "enter" && loading && !growth ? (
            <View style={styles.statusCard}>
              <ActivityIndicator color={colors.raspberry} />
              <Text style={styles.statusText}>Loading your Growth details…</Text>
            </View>
          ) : null}

          {step === "enter" && growth ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Grow balance</Text>
              <Text style={styles.balanceValue}>
                {formatUsdc(growth.currentRedeemableUsdc)}
              </Text>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Earned yield</Text>
                <Text style={styles.detailValue}>{formatUsdc(growth.earnedYieldUsdc)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated APY</Text>
                <Text style={styles.detailValue}>{growth.liveApyPercent}%</Text>
              </View>
              <Text style={styles.cardBody}>
                APY is variable and can change. Values reflect the latest available data.
              </Text>
              {loading ? <Text style={styles.refreshingText}>Refreshing…</Text> : null}
            </View>
          ) : null}

          {step === "enter" ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {isSmartWalletGrow ? "Amount to prepare" : "Amount to authorize"}
              </Text>
              <Text style={styles.availableText}>{remainingLabel}</Text>
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
                  editable={!isPreparing}
                  accessibilityLabel="Amount in USDC"
                />
              </View>
              <Pressable
                style={[styles.primaryButton, !canContinue ? styles.primaryButtonDisabled : null]}
                onPress={() => {
                  void handleContinue();
                }}
                disabled={!canContinue}
                accessibilityRole="button"
                accessibilityLabel="Continue to review amount"
              >
                {isPreparing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryButtonLabel}>Continue</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          {step === "review" && reviewedAmount ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Exact amount</Text>
              <Text style={styles.balanceValue}>{formatUsdc(reviewedAmount)}</Text>
              <Text style={styles.cardBody}>
                {isSmartWalletGrow
                  ? executionEnabled
                    ? "Start earning this exact amount. Money will move when you confirm."
                    : "The deposit is prepared. Execution is not enabled yet, so no money will move."
                  : "Authorize this exact amount for Grow. Nothing will move until a later step."}
              </Text>
              {expiresAt ? (
                <Text style={styles.refreshingText}>
                  This authorization expires at {new Date(expiresAt).toLocaleTimeString()}.
                </Text>
              ) : null}
              {isSmartWalletGrow && executionEnabled ? (
                <Pressable
                  style={[styles.primaryButton, isExecuting ? styles.primaryButtonDisabled : null]}
                  onPress={() => {
                    void handleStartEarning();
                  }}
                  disabled={isExecuting}
                  accessibilityRole="button"
                  accessibilityLabel={`Start earning ${formatUsdc(reviewedAmount)}`}
                >
                  {isExecuting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>
                      Start earning {formatUsdc(reviewedAmount)}
                    </Text>
                  )}
                </Pressable>
              ) : null}
              {isSmartWalletGrow ? null : (
                <Pressable
                  style={[styles.primaryButton, isAuthorizing ? styles.primaryButtonDisabled : null]}
                  onPress={() => {
                    void handleAuthorize();
                  }}
                  disabled={isAuthorizing}
                  accessibilityRole="button"
                  accessibilityLabel={`Authorize ${formatUsdc(reviewedAmount)}`}
                >
                  {isAuthorizing ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonLabel}>
                      Authorize {formatUsdc(reviewedAmount)}
                    </Text>
                  )}
                </Pressable>
              )}
            </View>
          ) : null}

          {step === "success" && authorizedAmount ? (
            <View style={styles.successMoment} accessibilityRole="summary">
              <Animated.View
                style={[
                  styles.successMark,
                  {
                    opacity: successOpacity,
                    transform: [{ scale: successScale }],
                  },
                ]}
              >
                <View style={styles.successHalo}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={36} color={colors.white} />
                  </View>
                </View>
              </Animated.View>
              <Animated.View style={[styles.successCopy, { opacity: successOpacity }]}>
                <Text style={styles.successHeadline}>
                  {successKind === "deposited" ? "You're earning" : "Authorized!"}
                </Text>
                <Text style={styles.successAmount}>{formatUsdcCurrency(authorizedAmount)}</Text>
                <Text style={styles.successBody}>
                  {successKind === "deposited"
                    ? "This amount is now in Grow. The rate is variable and can change."
                    : "Your authorization is ready. No money has moved yet."}
                </Text>
              </Animated.View>
            </View>
          ) : null}

          {step === "enter" && error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => {
                  void onRetry();
                }}
                accessibilityRole="button"
                accessibilityLabel="Retry loading Growth"
              >
                <Text style={styles.retryLabel}>Try again</Text>
              </Pressable>
            </View>
          ) : null}

          {actionError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{actionError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <AppTabBar active="home" />
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
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.raspberry,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 8,
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
  card: {
    marginTop: 24,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 20,
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.inkMuted,
  },
  balanceValue: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 18,
    backgroundColor: colors.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 12,
  },
  detailLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  detailValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
  },
  cardBody: {
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  availableText: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  inputRow: {
    marginTop: 16,
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
  primaryButton: {
    marginTop: 20,
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
  statusCard: {
    marginTop: 24,
    minHeight: 120,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statusText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  refreshingText: {
    marginTop: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.inkMuted,
  },
  errorCard: {
    marginTop: 12,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(229, 75, 122, 0.25)",
    backgroundColor: "rgba(252, 238, 242, 0.6)",
    padding: spacing.card,
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
  },
  retryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.white,
  },
  successMoment: {
    flex: 1,
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  successMark: {
    alignItems: "center",
    justifyContent: "center",
  },
  successHalo: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: colors.roseSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  successCopy: {
    marginTop: 28,
    alignItems: "center",
  },
  successHeadline: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.3,
    color: colors.ink,
    textAlign: "center",
  },
  successAmount: {
    marginTop: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.ink,
    textAlign: "center",
  },
  successBody: {
    marginTop: 12,
    maxWidth: 260,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
