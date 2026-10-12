import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type YoureInScreenProps = {
  onExplore: () => void;
  onReceive: () => void;
};

const readyColors = {
  wordmark: "#6E2A45",
  charcoal: "#2E2B2C",
  muted: "#6F6869",
  berry: "#C93A6B",
  thread: "#E8C2CE",
  cta: "#E04E7B",
  ctaText: "#FFFFFF",
  secondary: "#5C5457",
  footnote: "#776C70",
  screen: "#F8F4F1",
  scrim: "rgba(46, 43, 44, 0.32)",
  sheet: "#FFFFFF",
  grabber: "#DDD3D4",
  sheetText: "#5C5457",
} as const;

const gradientColors = ["#F5DFE4", "#F7EBEC", "#F8F3F0", "#F8F4F1"] as const;

const steps = [
  {
    label: "Step 1",
    title: "Add USDC",
    body: "Send USDC to your Olimpia account from an app like Coinbase.",
    help: true,
    thread: true,
  },
  {
    label: "Step 2",
    title: "Grow with Yield, no lock ups!",
    body: "Enjoy the benefits of yield with flexibility banks can't offer. Withdraw anytime!",
    thread: true,
  },
  {
    label: "Step 3",
    title: "Set a goal",
    body: "Choose what you're growing your money toward.",
    thread: false,
  },
] as const;

const helpLines = [
  "USDC is a digital dollar designed to hold a $1 value.",
  "Buy and add USDC from an app like Coinbase.",
  "We'll guide you through the steps.",
] as const;

export function YoureInScreen({ onExplore, onReceive }: YoureInScreenProps) {
  const insets = useSafeAreaInsets();
  const [helpOpen, setHelpOpen] = useState(false);
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(Math.max(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 72 || gesture.vy > 0.8) {
          translateY.setValue(0);
          setHelpOpen(false);
          return;
        }

        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  const closeHelp = () => {
    translateY.setValue(0);
    setHelpOpen(false);
  };

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
            paddingBottom: Math.max(34, insets.bottom),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.wordmark}>Olimpia</Text>
        <Text style={styles.headline}>
          Your account{"\n"}
          is ready.
        </Text>
        <Text style={styles.subhead}>Here's how to get started.</Text>

        <View style={styles.steps}>
          {steps.map((step) => (
            <View key={step.label} style={styles.step}>
              <View style={styles.stepDot} />
              {step.thread ? <View style={styles.stepLine} /> : null}
              <View style={styles.stepBody}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepText}>{step.body}</Text>
                {"help" in step ? (
                  <Pressable
                    style={styles.stepLink}
                    onPress={() => setHelpOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel="How does this work?"
                  >
                    <Text style={styles.stepLinkLabel}>How does this work?</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.spacer} />

        <View style={styles.actions}>
          <Pressable
            style={styles.primaryButton}
            onPress={onReceive}
            accessibilityRole="button"
            accessibilityLabel="Add USDC"
          >
            <Text style={styles.primaryLabel}>Add USDC</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={onExplore}
            accessibilityRole="button"
            accessibilityLabel="I'll do this later"
          >
            <Text style={styles.secondaryLabel}>I'll do this later</Text>
          </Pressable>
          <Text style={styles.footnote}>Yield is variable and not guaranteed.</Text>
        </View>
      </ScrollView>

      <Modal visible={helpOpen} transparent animationType="slide" onRequestClose={closeHelp}>
        <View style={styles.sheetRoot}>
          <Pressable
            style={styles.scrim}
            onPress={closeHelp}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(48, insets.bottom),
                transform: [{ translateY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>How do I add USDC?</Text>
            {helpLines.map((line, index) => (
              <Text
                key={line}
                style={[styles.sheetLine, index === 0 ? styles.sheetLineFirst : null]}
              >
                {line}
              </Text>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: readyColors.screen,
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
    color: readyColors.wordmark,
  },
  headline: {
    marginTop: 32,
    fontFamily: "CormorantGaramond_500Medium",
    fontSize: 46,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: readyColors.charcoal,
  },
  subhead: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: readyColors.muted,
  },
  steps: {
    marginTop: 32,
    gap: 24,
  },
  step: {
    position: "relative",
    paddingLeft: 28,
  },
  stepDot: {
    position: "absolute",
    left: 0,
    top: 3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: readyColors.berry,
  },
  stepLine: {
    position: "absolute",
    left: 4,
    top: 16,
    bottom: -27,
    width: 1,
    backgroundColor: readyColors.thread,
  },
  stepBody: {
    gap: 4,
  },
  stepLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: readyColors.berry,
  },
  stepTitle: {
    marginTop: 2,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
    color: readyColors.charcoal,
  },
  stepText: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: readyColors.muted,
  },
  stepLink: {
    alignSelf: "flex-start",
    marginTop: -8,
    marginBottom: -12,
    paddingVertical: 12,
  },
  stepLinkLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    lineHeight: 20,
    color: readyColors.berry,
  },
  spacer: {
    flexGrow: 1,
    minHeight: 16,
  },
  actions: {
    gap: 4,
  },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: readyColors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: readyColors.ctaText,
  },
  secondaryButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  secondaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: readyColors.secondary,
  },
  footnote: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: readyColors.footnote,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: readyColors.scrim,
  },
  sheet: {
    paddingTop: 10,
    paddingHorizontal: 24,
    backgroundColor: readyColors.sheet,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: readyColors.grabber,
  },
  sheetTitle: {
    marginTop: 28,
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: readyColors.charcoal,
  },
  sheetLine: {
    marginTop: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 17,
    lineHeight: 26,
    color: readyColors.sheetText,
  },
  sheetLineFirst: {
    marginTop: 8,
  },
});
