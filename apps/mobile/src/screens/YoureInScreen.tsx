import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme/colors";

type YoureInScreenProps = {
  onExplore: () => void;
  onAddMoney: () => void;
};

const valueProps = [
  { icon: "leaf-outline" as const, title: "Earn yield" },
  { icon: "flag-outline" as const, title: "Set goals" },
  { icon: "shield-checkmark-outline" as const, title: "You're in control" },
];

const steps = ["Add money", "Earn yield", "Grow money"] as const;

const builtForYou = ["No lockups", "Withdraw anytime", "Higher yields than your bank"];

export function YoureInScreen({ onExplore, onAddMoney }: YoureInScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["rgba(252, 238, 242, 0.95)", colors.background, colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.wordmark}>Olimpia</Text>

        <View style={styles.hero}>
          <Text style={styles.headline}>Simple access to decentralized finance.</Text>
          <Text style={styles.subhead}>Save, grow, and stay in control.</Text>
        </View>

        <View style={styles.valuePropRow}>
          {valueProps.map(({ icon, title }) => (
            <View key={title} style={styles.valueProp}>
              <View style={styles.valueIconWrap}>
                <Ionicons name={icon} size={18} color={colors.raspberry} />
              </View>
              <Text style={styles.valueTitle}>{title}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.stepsRow}>
          {steps.map((label, index) => (
            <View key={label} style={styles.stepGroup}>
              <Text style={styles.stepLabel}>{label}</Text>
              {index < steps.length - 1 ? (
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color="rgba(107, 107, 107, 0.35)"
                  style={styles.stepChevron}
                />
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
        <Pressable
          style={styles.primaryButton}
          onPress={onAddMoney}
          accessibilityRole="button"
          accessibilityLabel="Start earning"
        >
          <Text style={styles.primaryLabel}>Start earning</Text>
        </Pressable>
        <Pressable onPress={onExplore} accessibilityRole="button" accessibilityLabel="Explore">
          <Text style={styles.exploreLink}>Explore</Text>
        </Pressable>
        <Text style={styles.disclaimer}>Yield is variable and not guaranteed.</Text>
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
    paddingHorizontal: spacing.screenX + 8,
    paddingTop: spacing.card,
    paddingBottom: spacing.block,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
    textAlign: "center",
  },
  hero: {
    marginTop: 32,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.ink,
    textAlign: "center",
  },
  subhead: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
    textAlign: "center",
  },
  valuePropRow: {
    marginTop: 40,
    flexDirection: "row",
    gap: 12,
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
    borderColor: "rgba(229, 75, 122, 0.3)",
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  valueTitle: {
    marginTop: 10,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink,
    textAlign: "center",
  },
  sectionTitle: {
    marginTop: 40,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
    textAlign: "center",
  },
  stepsRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    lineHeight: 16,
    color: colors.ink,
    textAlign: "center",
  },
  stepChevron: {
    marginHorizontal: 2,
  },
  builtForYouCard: {
    marginTop: 40,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    paddingHorizontal: spacing.card,
    paddingVertical: 16,
  },
  builtForYouTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  builtForYouRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.ink,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: "rgba(247, 244, 241, 0.95)",
    paddingHorizontal: spacing.screenX + 8,
    paddingTop: 12,
    paddingBottom: spacing.card,
    gap: 12,
    alignItems: "center",
  },
  primaryButton: {
    alignSelf: "stretch",
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
  exploreLink: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: colors.inkMuted,
  },
  disclaimer: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    color: colors.inkMuted,
    textAlign: "center",
  },
});
