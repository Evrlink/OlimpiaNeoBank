import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme/colors";

type WelcomeScreenProps = {
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

const sparkles = [
  { top: "12%", left: "18%" },
  { top: "22%", left: "72%" },
  { top: "34%", left: "44%" },
];

const features: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "sparkles-outline", label: "Earn yield on USDC" },
  { icon: "card-outline", label: "Spend anywhere Visa is accepted" },
  { icon: "book-outline", label: "Learn DeFi on your terms" },
];

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <LinearGradient
        colors={["rgba(229, 75, 122, 0.12)", "rgba(251, 221, 230, 0.2)", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
      />
      {sparkles.map((pos, i) => (
        <View key={i} style={[styles.sparkle, { top: pos.top as `${number}%`, left: pos.left as `${number}%` }]} />
      ))}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.wordmark}>Olimpia</Text>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Financial freedom, designed for women</Text>
          <Text style={styles.headline}>
            Better than a checking account,{" "}
            <Text style={styles.headlineAccent}>everything your bank can't do.</Text>
          </Text>

          <View style={styles.featureList}>
            {features.map(({ icon, label }) => (
              <View key={label} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Ionicons name={icon} size={18} color={colors.raspberry} />
                </View>
                <Text style={styles.featureLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.tagline}>More choices. More freedom.</Text>
          <Text style={styles.subhead}>Save, spend, and grow your money with confidence.</Text>
        </View>

        <View style={styles.ctaStack}>
          <Pressable style={styles.primaryButton} onPress={onGetStarted}>
            <Text style={styles.primaryLabel}>Get started</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={onSignIn}>
            <Text style={styles.secondaryLabel}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
  },
  hero: {
    flex: 1,
    paddingTop: spacing.block + 8,
  },
  eyebrow: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.raspberry,
  },
  headline: {
    marginTop: 20,
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  headlineAccent: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontWeight: "400",
  },
  featureList: {
    marginTop: 24,
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  tagline: {
    marginTop: 24,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.berry,
  },
  subhead: {
    marginTop: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    lineHeight: 29,
    color: colors.inkMuted,
  },
  ctaStack: {
    gap: 12,
    paddingTop: 24,
  },
  primaryButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  secondaryButton: {
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
});
