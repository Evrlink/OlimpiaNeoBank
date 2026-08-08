import { Ionicons } from "@expo/vector-icons";
import { usePrivy } from "@privy-io/expo";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
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
  CoinbaseCheckoutWebView,
  type OnrampApiEvent,
} from "@/components/CoinbaseCheckoutWebView";
import {
  cancelDeposit,
  createDeposit,
  reconcileDeposit,
  startFundingVerification,
  submitFundingVerification,
  watchDepositStatus,
  type Deposit,
  type DepositStatus,
  type FundingVerification,
} from "@/services/api/funding";
import { colors, radius, spacing } from "@/theme/colors";

type FlowStep =
  | "amount"
  | "review"
  | "verify-email"
  | "verify-email-otp"
  | "verify-phone"
  | "verify-phone-otp"
  | "checkout"
  | "status";

type AddMoneyScreenProps = {
  onBack: () => void;
  onCompleted: (amountUsd: string) => void;
  showTabBar?: boolean;
};

const COINBASE_TOS_URL = "https://www.coinbase.com/legal/guest-checkout/us";
const COINBASE_UA_URL = "https://www.coinbase.com/legal/user_agreement";
const COINBASE_PRIVACY_URL = "https://www.coinbase.com/legal/privacy";

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
  const [tosAccepted, setTosAccepted] = useState(false);
  const [agreementAcceptedAt, setAgreementAcceptedAt] = useState<string | null>(null);
  const [emailDestination, setEmailDestination] = useState("");
  const [phoneDestination, setPhoneDestination] = useState("");
  const [emailVerification, setEmailVerification] = useState<FundingVerification | null>(null);
  const [smsVerification, setSmsVerification] = useState<FundingVerification | null>(null);
  const [emailVerificationId, setEmailVerificationId] = useState<string | null>(null);
  const [smsVerificationId, setSmsVerificationId] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [checkoutHint, setCheckoutHint] = useState("Apple Pay is ready when the button appears.");
  const otpRefs = useRef<Array<TextInput | null>>([]);
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
    if ((step !== "status" && step !== "checkout") || !deposit?.id || !accessToken) {
      return;
    }

    completedRef.current = false;

    const stop = watchDepositStatus(accessToken, deposit.id, (next) => {
      setDeposit(next);

      if (next.status === "completed" || next.status === "failed") {
        setStep("status");
      }

      if (next.status === "completed" && !completedRef.current) {
        completedRef.current = true;
        setTimeout(() => {
          onCompletedRef.current(next.amountUsd);
        }, 900);
      }
    });

    return stop;
  }, [step, deposit?.id, accessToken]);

  const resetOtp = () => {
    setOtpDigits(["", "", "", "", "", ""]);
  };

  const handleContinueFromAmount = () => {
    if (!canContinue) {
      setInlineError("Enter an amount greater than zero.");
      return;
    }

    setInlineError(null);
    setStep("review");
  };

  const handleAcceptTos = (accepted: boolean) => {
    setTosAccepted(accepted);
    setAgreementAcceptedAt(accepted ? new Date().toISOString() : null);
    setInlineError(null);
  };

  const requireToken = async (): Promise<string | null> => {
    const token = accessToken ?? (await getAccessToken());
    if (!token) {
      setInlineError("Please sign in again to add money.");
      return null;
    }
    setAccessToken(token);
    return token;
  };

  const startDeposit = async (shouldFail: boolean) => {
    if (!amountUsd) {
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);

    try {
      const token = await requireToken();
      if (!token) {
        return;
      }

      const created = await createDeposit({
        accessToken: token,
        amountUsd,
        forceFail: shouldFail,
        idempotencyKey: `add-money-${Date.now()}`,
        agreementAcceptedAt: agreementAcceptedAt ?? undefined,
        smsVerificationId: smsVerificationId ?? undefined,
        emailVerificationId: emailVerificationId ?? undefined,
        paymentMethod: "apple_pay",
      });
      setDeposit(created);

      if (created.hostedUrl && !shouldFail) {
        setCheckoutHint("Apple Pay is ready when the button appears.");
        setStep("checkout");
        return;
      }

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
    if (!tosAccepted || !agreementAcceptedAt) {
      setInlineError("Accept the Coinbase Guest Checkout terms to continue.");
      return;
    }

    setInlineError(null);
    setStep("verify-email");
  };

  const sendEmailCode = async () => {
    setIsSubmitting(true);
    setInlineError(null);

    try {
      const token = await requireToken();
      if (!token) {
        return;
      }

      const started = await startFundingVerification({
        accessToken: token,
        channel: "email",
        destination: emailDestination.trim() || undefined,
      });
      setEmailVerification(started);
      setEmailDestination(started.destination);
      resetOtp();
      setStep("verify-email-otp");
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Unable to send a code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendSmsCode = async () => {
    setIsSubmitting(true);
    setInlineError(null);

    try {
      const token = await requireToken();
      if (!token) {
        return;
      }

      const started = await startFundingVerification({
        accessToken: token,
        channel: "sms",
        destination: phoneDestination.trim() || undefined,
      });
      setSmsVerification(started);
      setPhoneDestination(started.destination);
      resetOtp();
      setStep("verify-phone-otp");
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Unable to send a code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitCurrentOtp = async () => {
    const otpCode = otpDigits.join("");
    if (otpCode.length !== 6) {
      setInlineError("Enter the 6-digit code.");
      return;
    }

    const isEmail = step === "verify-email-otp";
    const verification = isEmail ? emailVerification : smsVerification;

    if (!verification) {
      setInlineError("Start verification again.");
      return;
    }

    setIsSubmitting(true);
    setInlineError(null);

    try {
      const token = await requireToken();
      if (!token) {
        return;
      }

      const submitted = await submitFundingVerification({
        accessToken: token,
        verificationId: verification.verificationId,
        otpCode,
        channel: verification.channel,
        destination: verification.destination,
      });

      if (isEmail) {
        setEmailVerificationId(submitted.verificationId);
        resetOtp();
        setStep("verify-phone");
        return;
      }

      setSmsVerificationId(submitted.verificationId);
      await startDeposit(false);
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : "Unable to verify that code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckoutEvent = (event: OnrampApiEvent) => {
    const localized = event.data?.errorMessage?.trim();

    switch (event.eventName) {
      case "onramp_api.load_pending":
        setCheckoutHint("Preparing Apple Pay…");
        break;
      case "onramp_api.load_success":
        setCheckoutHint("Tap Apple Pay to continue. Payment must be started from that button.");
        break;
      case "onramp_api.load_error":
        setInlineError(localized || "Apple Pay couldn’t load. Start a new deposit.");
        break;
      case "onramp_api.commit_success":
        setCheckoutHint("Payment started. Keep this screen open while it finishes.");
        break;
      case "onramp_api.commit_error":
        setInlineError(localized || "Apple Pay couldn’t start. Nothing was added to your balance.");
        if (accessToken && deposit?.id) {
          void cancelDeposit(accessToken, deposit.id)
            .then(setDeposit)
            .catch(() => undefined);
        }
        setStep("status");
        break;
      case "onramp_api.cancel":
        if (accessToken && deposit?.id) {
          void cancelDeposit(accessToken, deposit.id)
            .then((next) => {
              setDeposit(next);
              setStep("status");
            })
            .catch(() => {
              setStep("status");
            });
        } else {
          setStep("status");
        }
        break;
      case "onramp_api.polling_start":
        setCheckoutHint("Checking payment status…");
        break;
      case "onramp_api.polling_success":
        setCheckoutHint("Funds sent. Updating your Olimpia balance…");
        if (accessToken && deposit?.id) {
          void reconcileDeposit(accessToken, deposit.id)
            .then(setDeposit)
            .catch(() => undefined);
        }
        break;
      case "onramp_api.polling_error":
        setInlineError(localized || "Payment processing failed. Nothing was added to your balance.");
        if (accessToken && deposit?.id) {
          void reconcileDeposit(accessToken, deposit.id)
            .then((next) => {
              setDeposit(next);
              if (next.status === "completed" || next.status === "failed") {
                setStep("status");
              }
            })
            .catch(() => undefined);
        }
        break;
    }
  };

  const handleTryAgain = () => {
    setDeposit(null);
    setInlineError(null);
    setCheckoutHint("Apple Pay is ready when the button appears.");
    setStep("amount");
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setInlineError(null);
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleBack = () => {
    if (step === "review") {
      setStep("amount");
      return;
    }

    if (step === "verify-email" || step === "verify-email-otp") {
      setStep("review");
      return;
    }

    if (step === "verify-phone" || step === "verify-phone-otp") {
      setStep("verify-email");
      return;
    }

    if (step === "checkout") {
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
  const backDisabled =
    (step === "status" && status !== "failed") || step === "checkout";

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
            disabled={backDisabled}
          >
            {backDisabled ? (
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
              ${formatDisplayAmount(amountUsd)} will be added with Apple Pay via Coinbase.
            </Text>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>You’re adding</Text>
              <Text style={styles.summaryAmount}>${formatDisplayAmount(amountUsd)}</Text>
              <Text style={styles.summaryHint}>Shown in dollars in your Olimpia balance.</Text>
            </View>

            <Pressable
              style={styles.tosRow}
              onPress={() => handleAcceptTos(!tosAccepted)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: tosAccepted }}
            >
              <View style={[styles.checkbox, tosAccepted ? styles.checkboxChecked : null]}>
                {tosAccepted ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
              </View>
              <Text style={styles.tosText}>
                I agree to Coinbase’s Guest Checkout Terms, User Agreement, and Privacy Policy.
              </Text>
            </Pressable>

            <View style={styles.linkRow}>
              <Pressable onPress={() => void Linking.openURL(COINBASE_TOS_URL)}>
                <Text style={styles.linkText}>Guest Checkout Terms</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(COINBASE_UA_URL)}>
                <Text style={styles.linkText}>User Agreement</Text>
              </Pressable>
              <Pressable onPress={() => void Linking.openURL(COINBASE_PRIVACY_URL)}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Pressable>
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, !tosAccepted || isSubmitting ? styles.buttonDisabled : null]}
              onPress={handleConfirm}
              disabled={!tosAccepted || isSubmitting}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
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

        {step === "verify-email" || step === "verify-phone" ? (
          <View style={styles.section}>
            <Text style={styles.title}>
              {step === "verify-email" ? "Verify your email" : "Verify your phone"}
            </Text>
            <Text style={styles.subtitle}>
              {step === "verify-email"
                ? "Coinbase needs a verified email before Apple Pay checkout."
                : "Coinbase needs a verified US cell number. Sandbox can use +10005550100."}
            </Text>

            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>
                {step === "verify-email" ? "Email address" : "US phone number"}
              </Text>
              <TextInput
                value={step === "verify-email" ? emailDestination : phoneDestination}
                onChangeText={(value) => {
                  if (step === "verify-email") {
                    setEmailDestination(value);
                  } else {
                    setPhoneDestination(value);
                  }
                  setInlineError(null);
                }}
                keyboardType={step === "verify-email" ? "email-address" : "phone-pad"}
                autoCapitalize="none"
                placeholder={step === "verify-email" ? "you@example.com" : "+15555550100"}
                placeholderTextColor={colors.inkMuted}
                style={styles.textInput}
              />
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting ? styles.buttonDisabled : null]}
              onPress={() => {
                void (step === "verify-email" ? sendEmailCode() : sendSmsCode());
              }}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryLabel}>Send code</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "verify-email-otp" || step === "verify-phone-otp" ? (
          <View style={styles.section}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{" "}
              {step === "verify-email-otp"
                ? emailVerification?.destination ?? emailDestination
                : smsVerification?.destination ?? phoneDestination}
              .
            </Text>

            <View style={styles.otpGrid}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={`${step}-${index}`}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  style={[styles.otpCell, inlineError ? styles.fieldError : null]}
                />
              ))}
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, isSubmitting ? styles.buttonDisabled : null]}
              onPress={() => void submitCurrentOtp()}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryLabel}>
                {step === "verify-email-otp" ? "Verify email" : "Verify phone"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {step === "checkout" && deposit?.hostedUrl ? (
          <View style={styles.checkoutSection}>
            <Text style={styles.title}>Pay with Apple Pay</Text>
            <Text style={styles.subtitle}>{checkoutHint}</Text>
            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}
            <CoinbaseCheckoutWebView url={deposit.hostedUrl} onEvent={handleCheckoutEvent} />
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
  checkoutSection: {
    flex: 1,
    paddingTop: spacing.block,
    gap: 12,
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
  tosRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.raspberry,
    borderColor: colors.raspberry,
  },
  tosText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
  },
  linkRow: {
    marginTop: 12,
    gap: 8,
  },
  linkText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.raspberry,
  },
  otpGrid: {
    marginTop: 24,
    flexDirection: "row",
    gap: 7,
  },
  otpCell: {
    flex: 1,
    height: 48,
    minWidth: 0,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.5)",
    backgroundColor: colors.card,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 19,
    color: colors.ink,
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
