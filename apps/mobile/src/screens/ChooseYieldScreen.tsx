import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import type { GrowthSummary } from "@/services/api/growth";
import { colors, radius, spacing } from "@/theme/colors";

type ChooseYieldScreenProps = {
  growth: GrowthSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void | Promise<void>;
  onBack: () => void;
};

function formatUsdc(value: string): string {
  return value.startsWith("-") ? `-$${value.slice(1)}` : `$${value}`;
}

export function ChooseYieldScreen({
  growth,
  loading,
  error,
  onRetry,
  onBack,
}: ChooseYieldScreenProps) {
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
          <Text style={styles.eyebrow}>Growth</Text>
          <Text style={styles.title}>Choose Yield</Text>
          <Text style={styles.subtitle}>
            See your current Grow balance, earned yield, and estimated variable rate.
          </Text>

          {loading && !growth ? (
            <View style={styles.statusCard}>
              <ActivityIndicator color={colors.raspberry} />
              <Text style={styles.statusText}>Loading your Growth details…</Text>
            </View>
          ) : null}

          {growth ? (
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

          {error ? (
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
});
