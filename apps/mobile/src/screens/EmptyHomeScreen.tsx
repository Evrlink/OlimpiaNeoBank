import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import { colors, radius, spacing } from "@/theme/colors";

export function EmptyHomeScreen() {
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
            <Text style={styles.greetingMuted}>Hi Sarah ✨</Text>
            <Text style={styles.greetingName}>Sarah</Text>
          </View>
          <LinearGradient
            colors={[colors.rose, colors.raspberry]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </View>

        <Text style={styles.headline}>Let's get started.</Text>
        <Text style={styles.subhead}>
          Add funds to begin building toward the life you choose.
        </Text>

        <Pressable style={styles.ctaCard}>
          <View style={styles.ctaIconWrap}>
            <Text style={styles.ctaIcon}>+</Text>
          </View>
          <View style={styles.ctaCopy}>
            <Text style={styles.ctaLabel}>Add money</Text>
            <Text style={styles.ctaSub}>Secure transfer to your balance</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Text style={styles.trustLine}>Once you add funds, your balance can earn over time.</Text>
        <Text style={styles.trustLineMuted}>
          Your money stays yours — withdraw to your bank when you're ready.
        </Text>
        <Text style={styles.balanceLine}>Money available · $0.00</Text>

        <View style={styles.quickRow}>
          {[
            { icon: "arrow-up-outline" as const, label: "Send" },
            { icon: "arrow-down-outline" as const, label: "Receive" },
          ].map(({ icon, label }) => (
            <View key={label} style={styles.quickItem}>
              <View style={styles.quickIconWrap}>
                <Ionicons name={icon} size={16} color={colors.raspberry} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Your first savings goal will appear here</Text>
        </View>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Growth earnings will show here when you're ready
          </Text>
        </View>

        <View style={styles.activityEmpty}>
          <Text style={styles.activityTitle}>No activity yet</Text>
          <Text style={styles.activitySub}>Your first deposit will show up here</Text>
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
    opacity: 0.85,
  },
  quickItem: {
    alignItems: "center",
    gap: 6,
  },
  quickIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
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
