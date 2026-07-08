import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme/colors";

type YoureInScreenProps = {
  onExplore: () => void;
};

const valueProps = [
  {
    icon: "leaf-outline" as const,
    title: "Earn yield",
    description: "Your money can grow over time.",
  },
  {
    icon: "flag-outline" as const,
    title: "Set goals",
    description: "Create savings goals for what matters most.",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "You're in control",
    description: "Move your money anytime, always your choice.",
  },
];

const steps = [
  {
    icon: "business-outline" as const,
    step: 1,
    title: "Add USD",
    description: "Add funds from your bank.",
  },
  {
    icon: "cash-outline" as const,
    step: 2,
    title: "Convert to USDC",
    description: "Convert to USDC, earn yield.",
  },
  {
    icon: "sparkles-outline" as const,
    step: 3,
    title: "Earn and access",
    description: "USDC earns the yield. Cash out to your bank any time.",
  },
];

const builtForYou = ["No lock ups", "Withdraw anytime", "Full transparency"];

export function YoureInScreen({ onExplore }: YoureInScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
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
        <View style={styles.header}>
          <View style={styles.sparkleRow}>
            <Ionicons name="sparkles" size={14} color={colors.raspberry} />
            <Ionicons name="sparkles" size={10} color={colors.raspberry} style={styles.sparkleSmall} />
          </View>
          <Text style={styles.wordmark}>Olimpia</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.headline}>You're in!</Text>
          <Text style={styles.subhead}>
            Simple access to decentralized finance{"\n"}
            so you can save, grow, and reach your goals.
          </Text>
        </View>

        <View style={styles.valuePropRow}>
          {valueProps.map(({ icon, title, description }) => (
            <View key={title} style={styles.valueProp}>
              <View style={styles.valueIconWrap}>
                <Ionicons name={icon} size={18} color={colors.raspberry} />
              </View>
              <Text style={styles.valueTitle}>{title}</Text>
              <Text style={styles.valueDescription}>{description}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Here's how it works</Text>
        <View style={styles.stepsRow}>
          {steps.map(({ icon, step, title, description }, index) => (
            <View key={title} style={styles.stepGroup}>
              <View style={styles.stepItem}>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={icon} size={16} color={colors.inkMuted} />
                </View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{step}</Text>
                </View>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepDescription}>{description}</Text>
              </View>
              {index < steps.length - 1 ? (
                <Ionicons name="chevron-forward" size={14} color="rgba(107, 107, 107, 0.25)" />
              ) : null}
            </View>
          ))}
        </View>

        <View style={styles.builtForYouCard}>
          <Text style={styles.builtForYouTitle}>Built for you</Text>
          {builtForYou.map((item) => (
            <View key={item} style={styles.builtForYouRow}>
              <View style={styles.checkWrap}>
                <Ionicons name="checkmark" size={10} color={colors.white} />
              </View>
              <Text style={styles.builtForYouItem}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryLabel}>Add funds and start earning</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onExplore}>
          <Text style={styles.secondaryLabel}>Explore the app</Text>
        </Pressable>
        <View style={styles.disclaimerRow}>
          <Ionicons name="shield-checkmark-outline" size={12} color={colors.inkMuted} />
          <Text style={styles.disclaimer}>
            Olimpia provides access to third party financial services. Yield is variable and not
            guaranteed.
          </Text>
        </View>
      </View>
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
    paddingHorizontal: spacing.screenX + 4,
    paddingTop: spacing.card,
    paddingBottom: spacing.block,
  },
  header: {
    alignItems: "center",
    position: "relative",
  },
  sparkleRow: {
    position: "absolute",
    left: 0,
    top: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  sparkleSmall: {
    opacity: 0.7,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
  },
  hero: {
    marginTop: spacing.block,
    alignItems: "center",
  },
  headline: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.ink,
    textAlign: "center",
  },
  subhead: {
    marginTop: 12,
    maxWidth: 288,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 19,
    color: colors.inkMuted,
    textAlign: "center",
  },
  valuePropRow: {
    marginTop: spacing.block,
    flexDirection: "row",
    gap: 8,
  },
  valueProp: {
    flex: 1,
    alignItems: "center",
  },
  valueIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(229, 75, 122, 0.35)",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: colors.raspberry,
    textAlign: "center",
  },
  valueDescription: {
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 10,
    lineHeight: 14,
    color: colors.inkMuted,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: spacing.block,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
    textAlign: "center",
  },
  stepsRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  stepItem: {
    flex: 1,
    alignItems: "center",
  },
  stepIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadge: {
    marginTop: 6,
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 9,
    color: colors.white,
  },
  stepTitle: {
    marginTop: 6,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: colors.ink,
    textAlign: "center",
  },
  stepDescription: {
    marginTop: 4,
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 13,
    color: colors.inkMuted,
    textAlign: "center",
  },
  builtForYouCard: {
    marginTop: spacing.block,
    borderRadius: radius.card,
    backgroundColor: "rgba(251, 221, 230, 0.55)",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  builtForYouTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  builtForYouRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkWrap: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  builtForYouItem: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    color: colors.ink,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 225, 218, 0.3)",
    backgroundColor: "rgba(247, 244, 241, 0.95)",
    paddingHorizontal: spacing.screenX + 4,
    paddingTop: 12,
    paddingBottom: spacing.card,
    gap: 10,
  },
  primaryButton: {
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  secondaryButton: {
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  disclaimerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 4,
  },
  disclaimer: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 9,
    lineHeight: 13,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
