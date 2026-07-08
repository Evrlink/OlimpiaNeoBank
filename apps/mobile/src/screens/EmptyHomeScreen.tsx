import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import type { AuthSyncBalance, AuthSyncUser } from "@/services/api/authSync";
import { getGreetingName } from "@/utils/auth";
import { colors, radius, spacing } from "@/theme/colors";

type EmptyHomeScreenProps = {
  user: AuthSyncUser;
  balance: AuthSyncBalance;
};

export function EmptyHomeScreen({ user, balance }: EmptyHomeScreenProps) {
  const greetingName = getGreetingName(user);
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

        <Text style={styles.headline}>You're all set.</Text>
        <Text style={styles.subhead}>
          Add money from your bank to fund your Olimpia balance.
        </Text>

        <View style={styles.ctaCardDisabled} accessibilityRole="text">
          <View style={styles.ctaIconWrapDisabled}>
            <Text style={styles.ctaIconDisabled}>+</Text>
          </View>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaLabelDisabled}>Add money</Text>
            <Text style={styles.ctaSubDisabled}>Coming soon</Text>
          </View>
        </View>

        <Text style={styles.trustLine}>
          Your balance is shown in dollars and updates after each transfer.
        </Text>
        <Text style={styles.trustLineMuted}>
          Send, savings, and growth — Coming soon.
        </Text>
        <Text style={styles.balanceLine}>Balance · ${balance.totalDisplayUsd}</Text>

        <View style={styles.quickRow}>
          {[
            { icon: "arrow-up-outline" as const, label: "Send" },
            { icon: "arrow-down-outline" as const, label: "Receive" },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.quickItem} accessibilityRole="text">
              <View style={styles.quickIconWrapDisabled}>
                <Ionicons name={icon} size={16} color={colors.inkMuted} />
              </View>
              <Text style={styles.quickLabelDisabled}>{label}</Text>
              <Text style={styles.quickComingSoon}>Coming soon</Text>
            </View>
          ))}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Savings goals — Coming soon</Text>
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Growth — Coming soon</Text>
        </View>

        <View style={styles.activityEmpty}>
          <Text style={styles.activityTitle}>No activity yet</Text>
          <Text style={styles.activitySub}>Your transfers will show up here</Text>
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
  ctaCardDisabled: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    padding: spacing.card,
    borderRadius: radius.card,
    backgroundColor: "rgba(232, 225, 218, 0.35)",
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.85,
  },
  ctaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIconWrapDisabled: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(232, 225, 218, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaIcon: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.raspberry,
  },
  ctaIconDisabled: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.inkMuted,
  },
  ctaCopy: {
    flex: 1,
  },
  ctaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  ctaLabelDisabled: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.inkMuted,
  },
  ctaSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 2,
  },
  ctaSubDisabled: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 2,
    opacity: 0.85,
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
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
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
  activityTitle: {
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    color: colors.ink,
  },
  activitySub: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 4,
  },
});
