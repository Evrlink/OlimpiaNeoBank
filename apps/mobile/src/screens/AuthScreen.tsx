import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useRef } from "react";
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
import { useEmailAuthFlow } from "@/hooks/useEmailAuthFlow";
import { colors, radius, spacing } from "@/theme/colors";

export type AuthMode = "signup" | "signin";
export type AuthSuccessDestination = "youre-in" | "home";

type AuthScreenProps = {
  mode: AuthMode;
  onSuccess: (destination: AuthSuccessDestination) => void;
  onBack: () => void;
};

const authSparkles = [
  { top: "8%", left: "72%" },
  { top: "14%", left: "84%" },
  { top: "18%", left: "62%" },
];

export function AuthScreen({ mode, onSuccess, onBack }: AuthScreenProps) {
  const isSignIn = mode === "signin";
  const title = isSignIn ? "Welcome back" : "Create your account";
  const subtitle = isSignIn
    ? "Sign in to pick up where you left off."
    : "Sign up in minutes. Olimpia keeps the money tools simple behind the scenes.";
  const loadingCopy = isSignIn ? "Signing you in..." : "Creating your account...";

  const otpRefs = useRef<Array<TextInput | null>>([]);

  const {
    step,
    email,
    setEmail,
    otpDigits,
    updateOtpDigit,
    inlineError,
    resendSeconds,
    isSendingCode,
    isSubmittingCode,
    submitEmail,
    submitOtp,
    resendCode,
    resetToEmail,
  } = useEmailAuthFlow(mode, onSuccess);

  const isLoading = step === "loading" || isSendingCode || isSubmittingCode;
  const displayEmail = email.trim() || "you@example.com";
  const resendLabel = useMemo(() => {
    if (resendSeconds > 0) {
      return `Resend code in 00:${String(resendSeconds).padStart(2, "0")}`;
    }

    return "Resend code";
  }, [resendSeconds]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    updateOtpDigit(index, digit);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["rgba(229, 75, 122, 0.12)", "rgba(251, 221, 230, 0.2)", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
      />
      {authSparkles.map((pos, index) => (
        <View
          key={index}
          style={[styles.sparkle, { top: pos.top as `${number}%`, left: pos.left as `${number}%` }]}
        />
      ))}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={step === "otp" ? resetToEmail : onBack}
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        {step === "otp" ? (
          <View style={styles.otpSection}>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.otpCopy}>We sent a 6-digit code to</Text>
            <Text style={styles.otpEmail}>{displayEmail}</Text>

            <View style={styles.otpGrid}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  textContentType={index === 0 ? "oneTimeCode" : "none"}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
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
              style={styles.resendButton}
              onPress={() => void resendCode()}
              disabled={resendSeconds > 0 || isLoading}
            >
              <Text style={[styles.resendText, resendSeconds === 0 ? styles.resendActive : null]}>
                {resendLabel}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.primaryButton, isLoading ? styles.buttonDisabled : null]}
              onPress={() => void submitOtp()}
              disabled={isLoading}
            >
              <Text style={styles.primaryLabel}>Verify</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.emailSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            <View style={styles.fieldCard}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.inkMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                  autoComplete="email"
                  placeholder="you@example.com"
                  placeholderTextColor={colors.inkMuted}
                  style={[styles.textInput, inlineError ? styles.fieldError : null]}
                />
              </View>
            </View>

            {inlineError ? (
              <Text style={styles.errorText} accessibilityRole="alert">
                {inlineError}
              </Text>
            ) : null}

            <Pressable
              style={[styles.primaryButton, isLoading ? styles.buttonDisabled : null]}
              onPress={() => void submitEmail()}
              disabled={isLoading}
            >
              <Text style={styles.primaryLabel}>Continue</Text>
            </Pressable>

            <View style={styles.trustRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="rgba(229, 75, 122, 0.8)" />
              <Text style={styles.trustText}>
                Secure sign in. No seed phrases. No crypto setup.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.raspberry} size="large" />
          <Text style={styles.loadingText}>{loadingCopy}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  sparkle: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.85)",
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
  emailSection: {
    flex: 1,
    paddingTop: spacing.block,
  },
  otpSection: {
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
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 4,
  },
  otpCopy: {
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  otpEmail: {
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  otpGrid: {
    marginTop: 20,
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
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  fieldError: {
    borderColor: colors.raspberry,
  },
  errorText: {
    marginTop: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.raspberry,
  },
  resendButton: {
    marginTop: 16,
    alignSelf: "flex-start",
  },
  resendText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  resendActive: {
    fontFamily: "Inter_600SemiBold",
    color: colors.raspberry,
  },
  primaryButton: {
    marginTop: 24,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  trustRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 8,
  },
  trustText: {
    flexShrink: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 16,
    color: colors.inkMuted,
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(247, 244, 241, 0.82)",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.inkMuted,
  },
});
