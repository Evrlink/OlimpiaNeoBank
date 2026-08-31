import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import type { AuthSyncBalance, AuthSyncUser } from "@/services/api/authSync";
import { getGreetingName } from "@/utils/auth";
import { colors, radius, spacing } from "@/theme/colors";

type EmptyHomeScreenProps = {
  user: AuthSyncUser;
  balance: AuthSyncBalance;
  refreshing?: boolean;
  onRefresh?: () => void | Promise<void>;
  onChooseYield: () => void;
  onSend: () => void;
  onReceive: () => void;
};

function parseBalance(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function EmptyHomeScreen({
  user,
  balance,
  refreshing = false,
  onRefresh,
  onChooseYield,
  onSend,
  onReceive,
}: EmptyHomeScreenProps) {
  const greetingName = getGreetingName(user);
  const isFunded = parseBalance(balance.totalDisplayUsd) > 0;
  const isEarning = parseBalance(balance.growthAllocatedUsd) > 0;
  const hasAvailable = parseBalance(balance.availableUsd) > 0;
  const estimatedApyPercent = 4.2;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["rgba(252, 238, 242, 0.95)", colors.background, colors.background]}
        style={styles.backgroundWash}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void onRefresh();
              }}
              tintColor={colors.raspberry}
              colors={[colors.raspberry]}
            />
          ) : undefined
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingMuted}>Hi {greetingName} ✨</Text>
            <Text style={styles.greetingName}>{greetingName}</Text>
          </View>
          <LinearGradient
            colors={[colors.rose, colors.raspberry]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        {isFunded ? (
          <>
            {isEarning ? (
              <>
                <Text style={styles.fundedHeadline}>Your money is growing.</Text>
                <Text style={styles.fundedSubhead}>
                  Available to use, and earning yield.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.fundedHeadline}>You’re ready to start earning.</Text>
                <Text style={styles.fundedSubhead}>
                  Your money is here and ready to grow.
                </Text>
              </>
            )}

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Available balance</Text>
              <Text style={styles.balanceAmount}>${balance.availableUsd}</Text>

              {hasAvailable ? (
                <>
                  <Text style={styles.yieldPrompt}>Put this to work</Text>
                  <Pressable
                    style={styles.primaryButton}
                    onPress={onChooseYield}
                    accessibilityRole="button"
                    accessibilityLabel="Choose Yield"
                  >
                    <Text style={styles.primaryButtonLabel}>Choose Yield</Text>
                    <Ionicons name="arrow-forward" size={16} color={colors.white} />
                  </Pressable>
                </>
              ) : null}

              <View style={styles.balanceDivider} />

              {isEarning ? (
                <View style={styles.earningStatusRow}>
                  <View style={styles.earningDot} />
                  <Text style={styles.earningStatus}>Earning</Text>
                </View>
              ) : null}
              <Text style={styles.balanceSecondaryLabel}>Earning yield</Text>
              <Text style={styles.balanceSecondaryAmount}>
                ${balance.growthAllocatedUsd}
              </Text>
              {isEarning ? (
                <Text style={styles.earningMeta}>Est. {estimatedApyPercent}% APY</Text>
              ) : null}
            </View>

            <View style={styles.utilityRow}>
              {(
                [
                  {
                    icon: "arrow-up-outline" as const,
                    label: "Send",
                    onPress: onSend,
                  },
                  {
                    icon: "arrow-down-outline" as const,
                    label: "Receive",
                    onPress: onReceive,
                  },
                ] as const
              ).map(({ icon, label, onPress }) => (
                <Pressable
                  key={label}
                  style={styles.utilityItem}
                  onPress={onPress}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                >
                  <View style={styles.utilityIconWrap}>
                    <Ionicons name={icon} size={18} color={colors.raspberry} />
                  </View>
                  <Text style={styles.utilityLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.addMoneyRow}
              onPress={onReceive}
              accessibilityRole="button"
              accessibilityLabel="Receive USDC"
            >
              <View style={styles.addMoneyIconWrap}>
                <Ionicons name="arrow-down-outline" size={18} color={colors.white} />
              </View>
              <View style={styles.addMoneyCopy}>
                <Text style={styles.addMoneyTitle}>Receive USDC</Text>
                <Text style={styles.addMoneySub}>Add more anytime</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Text style={styles.activityHeader}>Recent activity</Text>
            <View style={styles.activityEmptyCard}>
              <Ionicons name="time-outline" size={20} color={colors.inkMuted} />
              <Text style={styles.activityEmptyCopy}>
                No activity yet. Your transfers will show up here.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.headline}>You're all set.</Text>
            <Text style={styles.subhead}>
              Fund your balance by sending USDC on Base to your Olimpia address.
            </Text>

            <Pressable
              style={styles.ctaCard}
              onPress={onReceive}
              accessibilityRole="button"
              accessibilityLabel="Receive USDC"
            >
              <View style={styles.ctaIconWrap}>
                <Ionicons name="arrow-down-outline" size={20} color={colors.raspberry} />
              </View>
              <View style={styles.ctaCopy}>
                <Text style={styles.ctaLabel}>Receive USDC</Text>
                <Text style={styles.ctaSub}>From Coinbase or another wallet</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            <Text style={styles.trustLine}>
              Only send USDC on Base. Your balance updates after the transfer arrives.
            </Text>
            <Text style={styles.balanceLine}>Balance · ${balance.totalDisplayUsd}</Text>

            <View style={styles.quickRow}>
              <View style={styles.quickItem} accessibilityRole="text">
                <View style={styles.quickIconWrapDisabled}>
                  <Ionicons name="arrow-up-outline" size={16} color={colors.inkMuted} />
                </View>
                <Text style={styles.quickLabelDisabled}>Send</Text>
                <Text style={styles.quickComingSoon}>Coming soon</Text>
              </View>
              <Pressable
                style={styles.quickItemActive}
                onPress={onReceive}
                accessibilityRole="button"
                accessibilityLabel="Receive"
              >
                <View style={styles.quickIconWrap}>
                  <Ionicons name="arrow-down-outline" size={16} color={colors.raspberry} />
                </View>
                <Text style={styles.quickLabel}>Receive</Text>
              </Pressable>
            </View>

            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Savings goals — Coming soon</Text>
            </View>
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>Growth — Coming soon</Text>
            </View>

            <View style={styles.activityEmpty}>
              <Text style={styles.activityEmptyTitle}>No activity yet</Text>
              <Text style={styles.activityEmptySub}>Your transfers will show up here</Text>
            </View>
          </>
        )}
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
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenX,
    paddingBottom: spacing.block,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingMuted: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  greetingName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    marginTop: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.background,
  },
  fundedHeadline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.ink,
    marginTop: spacing.block,
  },
  fundedSubhead: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
    marginTop: 8,
  },
  balanceCard: {
    marginTop: 28,
    paddingVertical: 20,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  earningStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  earningDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
  },
  earningStatus: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.2,
    color: colors.raspberry,
  },
  balanceLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  balanceAmount: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  balanceDivider: {
    marginTop: 18,
    marginBottom: 16,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(232, 225, 218, 0.7)",
  },
  balanceSecondaryLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  balanceSecondaryAmount: {
    marginTop: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  earningMeta: {
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  yieldPrompt: {
    marginTop: 16,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  primaryButton: {
    marginTop: 12,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  utilityRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
    marginTop: 32,
  },
  utilityItem: {
    alignItems: "center",
    gap: 8,
    minWidth: 64,
  },
  utilityIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  utilityLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.ink,
  },
  addMoneyRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  addMoneyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  addMoneyIcon: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
    color: colors.white,
    marginTop: -1,
  },
  addMoneyCopy: {
    flex: 1,
  },
  addMoneyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
  },
  addMoneySub: {
    marginTop: 2,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  activityHeader: {
    marginTop: 32,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  activityEmptyCard: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  activityEmptyCopy: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
  headline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    marginTop: spacing.block,
  },
  subhead: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: colors.inkMuted,
    marginTop: 8,
  },
  ctaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    padding: spacing.card,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    shadowColor: colors.raspberry,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIcon: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.raspberry,
  },
  ctaCopy: {
    flex: 1,
  },
  ctaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  ctaSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: colors.inkMuted,
  },
  trustLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.card,
  },
  trustLineMuted: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    opacity: 0.8,
    marginTop: 4,
  },
  balanceLine: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: spacing.card,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.block,
    marginTop: 20,
  },
  quickItem: {
    alignItems: "center",
    gap: 4,
    opacity: 0.75,
  },
  quickItemActive: {
    alignItems: "center",
    gap: 4,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickIconWrapDisabled: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(232, 225, 218, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.ink,
  },
  quickLabelDisabled: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  quickComingSoon: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: colors.inkMuted,
    opacity: 0.85,
  },
  placeholder: {
    marginTop: spacing.card,
    paddingVertical: 20,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: "rgba(232, 225, 218, 0.4)",
  },
  placeholderText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  activityEmpty: {
    marginTop: spacing.block,
    paddingVertical: 32,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: "rgba(232, 225, 218, 0.5)",
    alignItems: "center",
  },
  activityEmptyTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: colors.ink,
  },
  activityEmptySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
