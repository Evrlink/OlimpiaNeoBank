/**
 * Savings tab — one informational My Goal, stored on the account.
 * The goal is a name and target only. It does not move USDC.
 */
import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import { AuthSyncApiError } from "@/services/api/authSync";
import { getGoal, saveGoal, type SavingsGoal } from "@/services/api/goal";
import { colors, radius, spacing } from "@/theme/colors";

type SavingsScreenProps = {
  getAccessToken: () => Promise<string | null>;
  currentGrowBalanceUsdc?: string | null;
  growLoading?: boolean;
};

const NAME_MAX_LENGTH = 80;
const SETUP_PLACEHOLDER = "#A39A94";

const RING_RADIUS = 84;
const RING_SIZE = 192;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function cents(value: string): number {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return 0;
  }

  const [whole = "0", fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(`${fraction}00`.slice(0, 2));
}

function fromCents(value: number): string {
  const centsValue = Math.max(0, value);
  return `${Math.floor(centsValue / 100)}.${String(centsValue % 100).padStart(2, "0")}`;
}

function normalizeUsd(value: string | null | undefined): string | null {
  if (!value || !/^\d+(\.\d+)?$/.test(value.trim())) {
    return null;
  }

  return fromCents(cents(value));
}

function formatGoalUsd(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  const wholeDollars = value.endsWith(".00");
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: wholeDollars ? 0 : 2,
    maximumFractionDigits: wholeDollars ? 0 : 2,
  });
}

function formatYield(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return value;
  }

  return `+${amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function progressPercent(growBalanceUsdc: string, targetAmountUsd: string): number {
  const target = cents(targetAmountUsd);
  if (target <= 0) {
    return 0;
  }

  return Math.floor((cents(growBalanceUsdc) * 100) / target);
}

function showYieldStrip(yieldEarnedUsdc: string | null): boolean {
  if (!yieldEarnedUsdc) {
    return false;
  }

  return cents(yieldEarnedUsdc) > 0;
}

function sanitizeAmount(text: string): string {
  const cleaned = text.replace(/[^0-9.]/g, "");
  const [whole = "", ...rest] = cleaned.split(".");
  if (rest.length === 0) {
    return whole;
  }

  return `${whole}.${rest.join("").slice(0, 2)}`;
}

function isValidTarget(text: string): boolean {
  if (!/^\d+(\.\d{1,2})?$/.test(text)) {
    return false;
  }

  const amount = Number(text);
  return Number.isFinite(amount) && amount > 0;
}

export function SavingsScreen({
  getAccessToken,
  currentGrowBalanceUsdc = null,
  growLoading = false,
}: SavingsScreenProps) {
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetText, setTargetText] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [amountFocused, setAmountFocused] = useState(false);

  const loadGoal = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const accessToken = (await getAccessToken()) ?? "";
      const saved = await getGoal(accessToken);
      setGoal(saved);
      setEditing(false);
    } catch (error) {
      const message =
        error instanceof AuthSyncApiError
          ? error.message
          : "Unable to load your goal.";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void loadGoal();
  }, [loadGoal]);

  const canSave = name.trim().length > 0 && isValidTarget(targetText) && !saving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const accessToken = (await getAccessToken()) ?? "";
      const saved = await saveGoal(accessToken, {
        name: name.trim(),
        targetAmountUsd: Number(targetText).toFixed(2),
      });

      if (!saved) {
        setSaveError("Unable to save your goal.");
        return;
      }

      try {
        setGoal((await getGoal(accessToken)) ?? saved);
      } catch {
        setGoal(saved);
      }
      setEditing(false);
    } catch (error) {
      const message =
        error instanceof AuthSyncApiError
          ? error.message
          : "Unable to save your goal.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  function startEditing() {
    if (!goal) {
      return;
    }

    setName(goal.name);
    setTargetText(goal.targetAmountUsd);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setSaveError(null);
    setEditing(false);
  }

  const showGoalForm = !loading && !loadError && (!goal || editing);
  const liveGrowBalanceUsdc =
    goal?.growBalanceUsdc ?? normalizeUsd(currentGrowBalanceUsdc);
  const liveRemainingUsdc =
    goal?.remainingUsdc ??
    (goal && liveGrowBalanceUsdc
      ? fromCents(cents(goal.targetAmountUsd) - cents(liveGrowBalanceUsdc))
      : null);
  const showSavedProgress = Boolean(
    goal && !editing && liveGrowBalanceUsdc && liveRemainingUsdc,
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Wash />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {showGoalForm ? (
          <View style={styles.setupTitle}>
            <Text style={styles.title}>My Goal</Text>
            <Text style={styles.setupSubtitle}>What are you working toward?</Text>
          </View>
        ) : (
          <View style={styles.headerRow}>
            <Text style={styles.title}>My Goal</Text>
            {!loading && !loadError && goal && !editing ? (
              <Pressable
                style={styles.editButton}
                onPress={startEditing}
                accessibilityRole="button"
                accessibilityLabel="Edit goal"
              >
                <Text style={styles.editLabel}>Edit goal</Text>
              </Pressable>
            ) : (
              <View style={styles.editButton} />
            )}
          </View>
        )}
        {loading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.raspberry} />
            <Text style={styles.subtitle}>Loading your goal.</Text>
          </View>
        ) : null}

        {!loading && loadError ? (
          <View style={styles.statusBlock}>
            <Text style={styles.subtitle}>{loadError}</Text>
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                void loadGoal();
              }}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <Text style={styles.primaryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        {showSavedProgress && goal && liveGrowBalanceUsdc && liveRemainingUsdc ? (
          <SavedGoal
            name={goal.name}
            targetAmountUsd={goal.targetAmountUsd}
            growBalanceUsdc={liveGrowBalanceUsdc}
            remainingUsdc={liveRemainingUsdc}
            yieldEarnedUsdc={goal.yieldEarnedUsdc}
          />
        ) : null}

        {!loading && !loadError && goal && !editing && !showSavedProgress && growLoading ? (
          <View style={styles.statusBlock}>
            <ActivityIndicator color={colors.raspberry} />
            <Text style={styles.subtitle}>Loading your goal.</Text>
          </View>
        ) : null}

        {showGoalForm ? (
          <View style={styles.setup}>
            <View style={styles.setupCard}>
              <View style={styles.setupField}>
                <Text style={styles.setupLabel}>Goal name</Text>
                <TextInput
                  style={[
                    styles.setupNameInput,
                    nameFocused ? styles.setupInputFocused : null,
                  ]}
                  value={name}
                  onChangeText={(value) => setName(value.slice(0, NAME_MAX_LENGTH))}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  placeholder="Emergency Fund"
                  placeholderTextColor={SETUP_PLACEHOLDER}
                  autoCorrect={false}
                  accessibilityLabel="Goal name"
                />
              </View>
              <View style={styles.setupField}>
                <Text style={styles.setupLabel}>Target amount</Text>
                <View
                  style={[
                    styles.setupAmountRow,
                    amountFocused ? styles.setupInputFocused : null,
                  ]}
                >
                  <Text style={styles.setupCurrency}>$</Text>
                  <TextInput
                    style={styles.setupAmountInput}
                    value={targetText}
                    onChangeText={(value) => setTargetText(sanitizeAmount(value))}
                    onFocus={() => setAmountFocused(true)}
                    onBlur={() => setAmountFocused(false)}
                    placeholder="5,000"
                    placeholderTextColor={SETUP_PLACEHOLDER}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Target amount"
                  />
                </View>
              </View>
            </View>
            <Pressable
              style={[styles.setupButton, !canSave ? styles.setupButtonDisabled : null]}
              onPress={() => {
                void handleSave();
              }}
              disabled={!canSave}
              accessibilityRole="button"
              accessibilityLabel={editing ? "Save changes" : "Set my goal"}
            >
              <Text
                style={[
                  styles.setupButtonLabel,
                  !canSave ? styles.setupButtonLabelDisabled : null,
                ]}
              >
                {saving ? "Saving" : editing ? "Save changes" : "Set my goal"}
              </Text>
            </Pressable>
            {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
            <View style={styles.setupNote}>
              <Ionicons name="trending-up" size={16} color={colors.inkMuted} />
              <Text style={styles.noteText}>
                Your Grow balance counts toward your goal. Setting a goal doesn't move money.
              </Text>
            </View>
            {editing ? (
              <Pressable
                onPress={cancelEditing}
                disabled={saving}
                style={styles.setupCancel}
                accessibilityRole="button"
                accessibilityLabel="Cancel editing goal"
              >
                <Text style={styles.setupCancelLabel}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <AppTabBar active="savings" />
    </SafeAreaView>
  );
}

function SavedGoal({
  name,
  targetAmountUsd,
  growBalanceUsdc,
  remainingUsdc,
  yieldEarnedUsdc,
}: {
  name: string;
  targetAmountUsd: string;
  growBalanceUsdc: string;
  remainingUsdc: string;
  yieldEarnedUsdc: string | null;
}) {
  const percent = progressPercent(growBalanceUsdc, targetAmountUsd);
  const filled = Math.min(percent, 100) / 100;
  const dash = filled * RING_CIRCUMFERENCE;
  const yieldVisible = showYieldStrip(yieldEarnedUsdc);

  return (
    <View>
      <View style={styles.goalCard}>
        <Text style={styles.goalName}>{name}</Text>
        <View style={styles.ring} accessibilityLabel={`${percent} percent of your goal`}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke={colors.rose}
              strokeWidth={12}
              fill="none"
            />
            {dash > 0 ? (
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.raspberry}
                strokeWidth={12}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${RING_CIRCUMFERENCE}`}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            ) : null}
          </Svg>
          <View style={styles.percentWrap} pointerEvents="none">
            <Text style={styles.percent}>{percent}%</Text>
          </View>
        </View>
        <View style={styles.amounts}>
          <Text style={styles.ofLine}>
            {formatGoalUsd(growBalanceUsdc)} of {formatGoalUsd(targetAmountUsd)}
          </Text>
          <Text style={styles.toGo}>{formatGoalUsd(remainingUsdc)} to go</Text>
        </View>
        {yieldVisible && yieldEarnedUsdc ? (
          <View style={styles.yieldStrip}>
            <Text style={styles.yieldAmount}>{formatYield(yieldEarnedUsdc)} yield earned ✨</Text>
            <Text style={styles.yieldSub}>Lifetime, from Grow</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.noteRow}>
        <Ionicons name="trending-up" size={16} color={colors.inkMuted} />
        <Text style={styles.noteText}>Your Grow balance is working toward your goal.</Text>
      </View>
    </View>
  );
}

function Wash() {
  return (
    <LinearGradient
      colors={["rgba(252, 238, 242, 0.95)", colors.background, colors.background]}
      style={StyleSheet.absoluteFill}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.45 }}
    />
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
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.block,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  editButton: {
    minWidth: 72,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  editLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.inkMuted,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  statusBlock: {
    marginTop: 24,
    gap: 12,
  },
  goalCard: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.8)",
    alignItems: "center",
    gap: 20,
    shadowColor: colors.berry,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 2,
  },
  goalName: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 36,
    lineHeight: 40,
    color: colors.berry,
    textAlign: "center",
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  percentWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: colors.ink,
  },
  amounts: {
    alignItems: "center",
    gap: 4,
  },
  ofLine: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    lineHeight: 28,
    color: colors.ink,
    textAlign: "center",
  },
  toGo: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: "center",
  },
  yieldStrip: {
    alignSelf: "stretch",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: radius.card,
    backgroundColor: colors.roseSoft,
    gap: 2,
  },
  yieldAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    lineHeight: 22,
    color: colors.berry,
  },
  yieldSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  noteRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },
  noteText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkMuted,
  },
  primaryButton: {
    marginTop: 16,
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
  setupTitle: {
    marginTop: 8,
    gap: 8,
  },
  setupSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  setup: {
    marginTop: 24,
    gap: 24,
  },
  setupCard: {
    padding: 20,
    gap: 24,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.8)",
    shadowColor: colors.berry,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 1,
  },
  setupField: {
    gap: 6,
  },
  setupLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: colors.inkMuted,
  },
  setupNameInput: {
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 32,
    lineHeight: 38,
    color: colors.berry,
  },
  setupAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  setupInputFocused: {
    borderBottomColor: colors.raspberry,
  },
  setupCurrency: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 32,
    color: colors.inkMuted,
  },
  setupAmountInput: {
    flex: 1,
    padding: 0,
    fontFamily: "Inter_600SemiBold",
    fontSize: 24,
    lineHeight: 32,
    color: colors.ink,
  },
  setupButton: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.berryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  setupButtonDisabled: {
    backgroundColor: colors.border,
  },
  setupButtonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.white,
  },
  setupButtonLabelDisabled: {
    color: colors.inkMuted,
  },
  setupNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  setupCancel: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  setupCancelLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: colors.inkMuted,
  },
  errorText: {
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.raspberry,
  },
});
