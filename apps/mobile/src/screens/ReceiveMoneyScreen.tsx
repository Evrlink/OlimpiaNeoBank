import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState, type ComponentType } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import QRCodeLib from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import { colors, radius, spacing } from "@/theme/colors";

type QRCodeProps = {
  value: string;
  size: number;
  backgroundColor: string;
  color: string;
};

const QRCode = QRCodeLib as unknown as ComponentType<QRCodeProps>;

type ReceiveMoneyScreenProps = {
  onBack: () => void;
  address: string | null;
};

function shortenAddress(address: string): string {
  if (address.length < 12) {
    return address;
  }

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Share your Base USDC address so you can fund your Olimpia balance. */
export function ReceiveMoneyScreen({ onBack, address }: ReceiveMoneyScreenProps) {
  const [copied, setCopied] = useState(false);
  const hasAddress = Boolean(address && address.trim().length > 0);
  const displayAddress = address?.trim() ?? "";
  const qrValue = useMemo(() => displayAddress, [displayAddress]);

  const handleCopy = async () => {
    if (!hasAddress) {
      return;
    }

    await Clipboard.setStringAsync(displayAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Receive USDC</Text>
          <Text style={styles.subtitle}>
            Send USDC on Base to this address from Coinbase or another wallet.
          </Text>

          <View style={styles.warningCard} accessibilityRole="text">
            <Ionicons name="warning-outline" size={18} color={colors.raspberry} />
            <Text style={styles.warningBody}>
              Only send USDC on Base. Other networks or tokens may be lost.
            </Text>
          </View>

          {hasAddress ? (
            <>
              <View style={styles.qrWrap}>
                <QRCode value={qrValue} size={168} backgroundColor={colors.card} color={colors.ink} />
              </View>

              <View style={styles.addressCard}>
                <Text style={styles.addressLabel}>Your Base address</Text>
                <Text style={styles.addressValue} selectable>
                  {displayAddress}
                </Text>
                <Text style={styles.addressShort}>{shortenAddress(displayAddress)}</Text>

                <Pressable
                  style={styles.copyButton}
                  onPress={() => {
                    void handleCopy();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Copy address"
                >
                  <Ionicons
                    name={copied ? "checkmark" : "copy-outline"}
                    size={16}
                    color={colors.white}
                  />
                  <Text style={styles.copyButtonLabel}>{copied ? "Copied" : "Copy address"}</Text>
                </Pressable>
              </View>

              <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>How to send from Coinbase</Text>
                <Text style={styles.tipsBody}>1. Open Coinbase → Send</Text>
                <Text style={styles.tipsBody}>2. Choose USDC</Text>
                <Text style={styles.tipsBody}>3. Select Base network</Text>
                <Text style={styles.tipsBody}>4. Paste this address and send</Text>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Address unavailable</Text>
              <Text style={styles.cardBody}>
                Your receive address isn’t ready yet. Sign out and back in, or try again in a
                moment.
              </Text>
            </View>
          )}
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
  warningCard: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(229, 75, 122, 0.25)",
    backgroundColor: "rgba(251, 221, 230, 0.55)",
    paddingHorizontal: spacing.card,
    paddingVertical: 14,
  },
  warningBody: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    lineHeight: 20,
    color: colors.ink,
  },
  qrWrap: {
    marginTop: 24,
    alignSelf: "center",
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  addressCard: {
    marginTop: 20,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 20,
  },
  addressLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  addressValue: {
    marginTop: 10,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
  },
  addressShort: {
    marginTop: 6,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  copyButton: {
    marginTop: 16,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  copyButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  tipsCard: {
    marginTop: 16,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 18,
  },
  tipsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
  },
  tipsBody: {
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
    fontSize: 16,
    color: colors.ink,
  },
  cardBody: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
});
