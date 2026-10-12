import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

type WelcomeScreenProps = {
  onGetStarted?: () => void;
  onSignIn?: () => void;
};

const welcomeColors = {
  wordmark: "#6E2A45",
  eyebrow: "#E04E7B",
  charcoal: "#2E2B2C",
  iconChip: "#FBE1E8",
  iconStroke: "#E04E7B",
  tagline: "#7A2E4A",
  supporting: "#85797D",
  cta: "#E04E7B",
  ctaText: "#FFFFFF",
  signInMuted: "#6F6869",
  signInLink: "#C93A6B",
  screen: "#F8F4F1",
} as const;

const gradientColors = ["#F5DFE4", "#F7EBEC", "#F8F3F0", "#F8F4F1"] as const;

function YieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 3.5l1.6 4.4 4.4 1.6-4.4 1.6L10 15.5l-1.6-4.4L4 9.5l4.4-1.6z"
        stroke={welcomeColors.iconStroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 13.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"
        stroke={welcomeColors.iconStroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 3v3M16.5 4.5h3"
        stroke={welcomeColors.iconStroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LearnIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 5h6a3.5 3.5 0 0 1 3.5 3.5V20a2.5 2.5 0 0 0-2.5-2.5h-7z"
        stroke={welcomeColors.iconStroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.5 5h-6A3.5 3.5 0 0 0 12 8.5V20a2.5 2.5 0 0 1 2.5-2.5h7z"
        stroke={welcomeColors.iconStroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const features = [
  { key: "yield", Icon: YieldIcon, label: "Earn yield on USDC" },
  { key: "learn", Icon: LearnIcon, label: "Learn DeFi on your terms" },
] as const;

export function WelcomeScreen({ onGetStarted, onSignIn }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.38, 0.7, 1]}
        start={{ x: 0.33, y: 0.03 }}
        end={{ x: 0.67, y: 0.97 }}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(74, insets.top),
            paddingBottom: Math.max(64, insets.bottom),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.wordmark}>Olimpia</Text>

        <Text style={styles.eyebrow}>Financial freedom, designed for women</Text>

        <Text style={styles.headline}>
          Better than a checking{"\n"}
          account,{" "}
          <Text style={styles.headlineAccent}>
            everything your bank{"\n"}
            can't do.
          </Text>
        </Text>

        <View style={styles.featureList}>
          {features.map(({ key, Icon, label }) => (
            <View key={key} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Icon />
              </View>
              <Text style={styles.featureLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.tagline}>More choices. More freedom.</Text>
        <Text style={styles.supporting}>Save, spend, and grow your money with confidence.</Text>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={onGetStarted}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={styles.primaryLabel}>Get started</Text>
          </Pressable>
          <Pressable
            style={styles.signInRow}
            onPress={onSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
          >
            <Text style={styles.signInMuted}>Already have an account?</Text>
            <Text style={styles.signInLink}>Sign in</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: welcomeColors.screen,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 30,
    lineHeight: 30,
    color: welcomeColors.wordmark,
  },
  eyebrow: {
    marginTop: 56,
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: welcomeColors.eyebrow,
  },
  headline: {
    marginTop: 20,
    fontFamily: "Inter_700Bold",
    fontSize: 25,
    lineHeight: 32,
    letterSpacing: -0.4,
    color: welcomeColors.charcoal,
  },
  headlineAccent: {
    fontFamily: "CormorantGaramond_400Regular_Italic",
    fontSize: 28,
    letterSpacing: 0,
    fontWeight: "400",
  },
  featureList: {
    marginTop: 44,
    gap: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: welcomeColors.iconChip,
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 16,
    lineHeight: 22,
    color: welcomeColors.charcoal,
  },
  tagline: {
    marginTop: 48,
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    color: welcomeColors.tagline,
  },
  supporting: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 28,
    color: welcomeColors.supporting,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 24,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: welcomeColors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: welcomeColors.ctaText,
  },
  signInRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  signInMuted: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    color: welcomeColors.signInMuted,
  },
  signInLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    color: welcomeColors.signInLink,
  },
});
