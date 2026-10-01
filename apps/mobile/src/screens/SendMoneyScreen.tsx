import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { usePrivy } from "@privy-io/expo";
import { useSmartWallets } from "@privy-io/expo/smart-wallets";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
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
  AAVE_V3_BASE_POOL,
  AAVE_V3_BASE_USDC_A_TOKEN,
  BASE_USDC,
} from "@/services/aaveAddresses";
import {
  executeSmartWalletSend,
  type SmartWalletSendSession,
} from "@/services/usdcSendExecution";
import { parseBaseWalletAddress } from "@/services/usdcSendQr";
import { colors, radius, spacing } from "@/theme/colors";
import { getEmbeddedEthereumAddress } from "@/utils/auth";

const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/;
const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

type SendStep = "form" | "confirm" | "sending" | "sent";

type SendMoneyScreenProps = {
  onBack: () => void;
  availableUsd: string;
  moneyAddressMode: "eoa" | "smart_wallet" | null | undefined;
  smartWalletAddress: string | null;
  getAccessToken: () => Promise<string | null>;
  onSent: () => Promise<void>;
  onExecutionLockChange?: (locked: boolean) => void;
};

function shortenAddress(address: string): string {
  if (address.length < 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

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

function normalizeAddress(address: string): string {
  return address.trim().toLowerCase();
}

function isForbiddenDestination(destination: string, smartWallet: string | null): boolean {
  const dest = normalizeAddress(destination);
  return (
    Boolean(smartWallet && dest === normalizeAddress(smartWallet)) ||
    dest === ZERO_ADDRESS ||
    dest === normalizeAddress(BASE_USDC) ||
    dest === normalizeAddress(AAVE_V3_BASE_USDC_A_TOKEN) ||
    dest === normalizeAddress(AAVE_V3_BASE_POOL)
  );
}

function toSendUserMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message.trim() : "";

  if (/not enabled/i.test(raw)) {
    return "Sends aren’t available right now.";
  }
  if (/already been attempted/i.test(raw)) {
    return "This send is still processing.";
  }
  if (/greater than your available/i.test(raw)) {
    return "This amount is greater than your available balance.";
  }
  if (/already (open|submitted)|in progress/i.test(raw)) {
    return "A transfer is already in progress.";
  }
  if (/only for Smart Wallet/i.test(raw)) {
    return "Send is available on Smart Wallet accounts.";
  }
  if (
    raw &&
    !/0x|aave|gas|hash|wallet|userop|user op|uint256/i.test(raw)
  ) {
    return raw;
  }

  return "We couldn’t complete this send. Please try again.";
}

function createSession(): SmartWalletSendSession {
  return {
    plan: null,
    sentTransactionHash: null,
    submitted: false,
    sendAttempted: false,
  };
}

function loadCameraModule(): typeof import("expo-camera") | null {
  try {
    return require("expo-camera") as typeof import("expo-camera");
  } catch {
    return null;
  }
}

function SendQrScanner({
  onScanned,
  onClose,
}: {
  onScanned: (data: string) => void;
  onClose: () => void;
}) {
  const camera = loadCameraModule();
  if (!camera) {
    return null;
  }

  return (
    <SendQrScannerView camera={camera} onScanned={onScanned} onClose={onClose} />
  );
}

function SendQrScannerView({
  camera,
  onScanned,
  onClose,
}: {
  camera: typeof import("expo-camera");
  onScanned: (data: string) => void;
  onClose: () => void;
}) {
  const { CameraView, useCameraPermissions } = camera;
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission && !permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  if (!permission?.granted) {
    return (
      <View style={styles.scannerRoot}>
        <SafeAreaView style={styles.scannerBar} edges={["top"]}>
          <Pressable
            style={styles.scannerClose}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close scanner"
          >
            <Text style={styles.scannerCloseLabel}>Cancel</Text>
          </Pressable>
          <Text style={styles.scannerHint}>Camera access is required to scan.</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.scannerRoot}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={({ data }) => onScanned(data)}
      />
      <SafeAreaView style={styles.scannerBar} edges={["top"]}>
        <Pressable
          style={styles.scannerClose}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
        >
          <Text style={styles.scannerCloseLabel}>Cancel</Text>
        </Pressable>
        <Text style={styles.scannerHint}>Scan a Base wallet QR</Text>
      </SafeAreaView>
    </View>
  );
}

export function SendMoneyScreen({
  onBack,
  availableUsd,
  moneyAddressMode,
  smartWalletAddress,
  getAccessToken,
  onSent,
  onExecutionLockChange,
}: SendMoneyScreenProps) {
  const { getClientForChain } = useSmartWallets();
  const { user } = usePrivy();
  const sessionRef = useRef<SmartWalletSendSession>(createSession());
  const executionLockRef = useRef(false);
  const scannedRef = useRef(false);
  const [step, setStep] = useState<SendStep>("form");
  const [addressText, setAddressText] = useState("");
  const [amountText, setAmountText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sentAmount, setSentAmount] = useState<string | null>(null);
  const [sentDestination, setSentDestination] = useState<string | null>(null);
  const [sentHash, setSentHash] = useState<string | null>(null);

  const isSmartWallet = moneyAddressMode === "smart_wallet";
  const parsedAddress = parseBaseWalletAddress(addressText) ?? addressText.trim();
  const addressValid = ADDRESS_PATTERN.test(parsedAddress);
  const destinationForbidden = addressValid
    ? isForbiddenDestination(parsedAddress, smartWalletAddress)
    : false;
  const normalizedAmount = normalizeAmountText(amountText);
  const enteredMicros = toUsdcMicros(normalizedAmount);
  const availableMicros = toUsdcMicros(availableUsd);
  const exceedsAvailable =
    enteredMicros !== null && availableMicros !== null && enteredMicros > availableMicros;
  const amountValid =
    enteredMicros !== null && enteredMicros > 0n && !exceedsAvailable;
  const canSubmitForm =
    isSmartWallet &&
    addressValid &&
    !destinationForbidden &&
    amountValid &&
    !executionLockRef.current;

  const setExecutionLock = (locked: boolean) => {
    executionLockRef.current = locked;
    onExecutionLockChange?.(locked);
  };

  const handleBack = () => {
    if (executionLockRef.current || step === "sending") {
      return;
    }
    if (step === "confirm") {
      setStep("form");
      return;
    }
    if (step === "sent") {
      void handleDone();
      return;
    }
    onBack();
  };

  const handleScan = () => {
    setCameraMessage(null);
    if (!loadCameraModule()) {
      setCameraMessage("Camera access is off. Paste the address from the field instead.");
      return;
    }
    scannedRef.current = false;
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scannedRef.current) {
      return;
    }
    scannedRef.current = true;
    const parsed = parseBaseWalletAddress(data);
    setScanning(false);
    if (!parsed) {
      setCameraMessage("That code isn’t a Base wallet address.");
      return;
    }
    setAddressText(parsed);
    setCameraMessage(null);
  };

  const handleMax = () => {
    setAmountText(availableUsd);
  };

  const handleSend = () => {
    if (!canSubmitForm) {
      return;
    }
    setActionError(null);
    setAddressText(parsedAddress);
    setAmountText(normalizedAmount);
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (executionLockRef.current || step === "sending") {
      return;
    }

    const session = sessionRef.current;
    if (
      session.plan &&
      (session.plan.amountUsdc !== normalizedAmount ||
        session.plan.destinationAddress.toLowerCase() !== parsedAddress.toLowerCase()) &&
      !session.sendAttempted &&
      !session.plan.sendAttemptedAt
    ) {
      sessionRef.current = createSession();
    }

    setActionError(null);
    setStep("sending");
    setExecutionLock(true);

    void (async () => {
      try {
        const accessToken = await getAccessToken();
        const confirmed = await executeSmartWalletSend({
          accessToken: accessToken ?? "",
          amountUsdc: normalizedAmount,
          destinationAddress: parsedAddress,
          session: sessionRef.current,
          moneyAddressMode,
          expectedSmartWalletAddress: smartWalletAddress,
          embeddedEoaAddress: getEmbeddedEthereumAddress(user),
          getClientForChain: async ({ chainId }) => {
            const client = await getClientForChain({ chainId });
            return client;
          },
        });

        setSentAmount(confirmed.amountUsdc);
        setSentDestination(confirmed.destinationAddress);
        setSentHash(confirmed.transactionHash);
        setStep("sent");
        try {
          await onSent();
        } catch {
          // Confirmed sends still show success if Home refresh fails.
        }
      } catch (error) {
        setActionError(toSendUserMessage(error));
        setStep("confirm");
      } finally {
        setExecutionLock(false);
      }
    })();
  };

  const handleDone = async () => {
    if (executionLockRef.current) {
      return;
    }
    sessionRef.current = createSession();
    setStep("form");
    setAddressText("");
    setAmountText("");
    setSentAmount(null);
    setSentDestination(null);
    setSentHash(null);
    setActionError(null);
    try {
      await onSent();
    } catch {
      // Closing Send after a confirmed transfer should still return Home.
    }
    onBack();
  };

  const handleViewTransaction = () => {
    if (!sentHash) {
      return;
    }
    void Linking.openURL(`https://basescan.org/tx/${sentHash}`);
  };

  const title =
    step === "confirm"
      ? "Confirm Send"
      : step === "sending"
        ? "Sending"
        : step === "sent"
          ? "Sent"
          : "Send";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["rgba(229, 75, 122, 0.12)", "rgba(251, 221, 230, 0.2)", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
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
              disabled={step === "sending"}
            >
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
            <Text style={styles.wordmark}>Olimpia</Text>
            <View style={styles.backButtonSpacer} />
          </View>

          <View style={styles.section}>
            <Text style={styles.title}>{title}</Text>

            {step === "form" ? (
              <>
                <Text style={styles.subtitle}>
                  Send available USDC on Base to any wallet address.
                </Text>

                {!isSmartWallet ? (
                  <View style={styles.noticeCard}>
                    <Text style={styles.noticeBody}>
                      Send is available on Smart Wallet accounts.
                    </Text>
                  </View>
                ) : null}

                <Text style={styles.fieldLabel}>Wallet address</Text>
                <TextInput
                  value={addressText}
                  onChangeText={setAddressText}
                  editable
                  contextMenuHidden={false}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  textContentType="none"
                  spellCheck={false}
                  placeholder="0x…"
                  placeholderTextColor={colors.inkMuted}
                  style={styles.input}
                  accessibilityLabel="Wallet address"
                />
                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={handleScan}
                    accessibilityRole="button"
                    accessibilityLabel="Scan QR"
                  >
                    <Ionicons name="qr-code-outline" size={16} color={colors.berry} />
                    <Text style={styles.secondaryButtonLabel}>Scan QR</Text>
                  </Pressable>
                </View>
                {destinationForbidden ? (
                  <Text style={styles.inlineError}>This destination can’t receive this send.</Text>
                ) : null}
                {cameraMessage ? (
                  <Text style={styles.inlineError}>{cameraMessage}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Amount</Text>
                <TextInput
                  value={amountText}
                  onChangeText={setAmountText}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={colors.inkMuted}
                  style={styles.input}
                  accessibilityLabel="Amount in USDC"
                />
                <View style={styles.availableRow}>
                  <Text style={styles.availableLabel}>
                    Available {formatUsdc(availableUsd)}
                  </Text>
                  <Pressable
                    onPress={handleMax}
                    accessibilityRole="button"
                    accessibilityLabel="Max"
                  >
                    <Text style={styles.maxLabel}>Max</Text>
                  </Pressable>
                </View>
                {exceedsAvailable ? (
                  <Text style={styles.inlineError}>
                    This amount is greater than your available balance.
                  </Text>
                ) : null}

                <Text style={styles.safety}>USDC on Base only</Text>

                <Pressable
                  style={[styles.primaryButton, canSubmitForm ? null : styles.primaryButtonDisabled]}
                  onPress={handleSend}
                  disabled={!canSubmitForm}
                  accessibilityRole="button"
                  accessibilityLabel="Send"
                >
                  <Text style={styles.primaryButtonLabel}>Send</Text>
                </Pressable>
              </>
            ) : null}

            {step === "confirm" ? (
              <>
                <Text style={styles.subtitle}>Review this send before you confirm.</Text>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Amount</Text>
                  <Text style={styles.cardValue}>{formatUsdc(normalizedAmount)}</Text>
                  <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>To</Text>
                  <Text style={styles.cardValue}>{shortenAddress(parsedAddress)}</Text>
                </View>
                <Text style={styles.safety}>USDC on Base only</Text>
                {actionError ? <Text style={styles.inlineError}>{actionError}</Text> : null}
                <Pressable
                  style={[
                    styles.primaryButton,
                    isSmartWallet ? null : styles.primaryButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!isSmartWallet}
                  accessibilityRole="button"
                  accessibilityLabel="Confirm Send"
                >
                  <Text style={styles.primaryButtonLabel}>Confirm Send</Text>
                </Pressable>
                <Pressable
                  style={styles.textButton}
                  onPress={() => setStep("form")}
                  accessibilityRole="button"
                  accessibilityLabel="Back"
                >
                  <Text style={styles.textButtonLabel}>Back</Text>
                </Pressable>
              </>
            ) : null}

            {step === "sending" ? (
              <View style={styles.processingCard}>
                <ActivityIndicator color={colors.raspberry} />
                <Text style={styles.processingTitle}>Sending</Text>
                <Text style={styles.processingBody}>
                  {formatUsdc(normalizedAmount)} to {shortenAddress(parsedAddress)}
                </Text>
              </View>
            ) : null}

            {step === "sent" ? (
              <>
                <View style={styles.card}>
                  <Text style={styles.cardLabel}>Amount sent</Text>
                  <Text style={styles.cardValue}>
                    {formatUsdc(sentAmount ?? normalizedAmount)}
                  </Text>
                  <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>To</Text>
                  <Text style={styles.cardValue}>
                    {shortenAddress(sentDestination ?? parsedAddress)}
                  </Text>
                  <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Transaction</Text>
                  <Text style={styles.hashValue}>
                    {sentHash ? shortenAddress(sentHash) : "—"}
                  </Text>
                </View>
                <Pressable
                  style={styles.primaryButton}
                  onPress={handleViewTransaction}
                  accessibilityRole="button"
                  accessibilityLabel="View Transaction on BaseScan"
                >
                  <Text style={styles.primaryButtonLabel}>View Transaction on BaseScan</Text>
                </Pressable>
                <Pressable
                  style={styles.textButton}
                  onPress={() => void handleDone()}
                  accessibilityRole="button"
                  accessibilityLabel="Done"
                >
                  <Text style={styles.textButtonLabel}>Done</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AppTabBar active="home" />

      {scanning ? (
        <SendQrScanner
          onScanned={(data) => handleBarCodeScanned({ data })}
          onClose={() => setScanning(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  noticeCard: {
    marginTop: 16,
    borderRadius: radius.card,
    backgroundColor: colors.roseSoft,
    padding: spacing.card,
  },
  noticeBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.berry,
  },
  fieldLabel: {
    marginTop: 24,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: colors.ink,
  },
  fieldLabelSpaced: {
    marginTop: 20,
  },
  input: {
    marginTop: 8,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.8)",
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: colors.ink,
  },
  rowActions: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(111, 43, 70, 0.09)",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.berry,
  },
  availableRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  availableLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  maxLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.berry,
  },
  safety: {
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  inlineError: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.raspberry,
  },
  primaryButton: {
    marginTop: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  textButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  textButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.berry,
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
  cardLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  cardLabelSpaced: {
    marginTop: 16,
  },
  cardValue: {
    marginTop: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.ink,
  },
  hashValue: {
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.ink,
  },
  processingCard: {
    marginTop: 32,
    alignItems: "center",
    gap: 12,
  },
  processingTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.ink,
  },
  processingBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  scannerRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.ink,
    zIndex: 20,
  },
  scannerBar: {
    paddingHorizontal: spacing.screenX,
  },
  scannerClose: {
    alignSelf: "flex-start",
    paddingVertical: 12,
  },
  scannerCloseLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  scannerHint: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.white,
  },
});
