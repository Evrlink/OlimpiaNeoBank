/**
 * Savings tab — named goals earning yield (APY). No target dates.
 * Add USDC to a goal; show principal earning + earned yield.
 */
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import { colors, radius, spacing } from "@/theme/colors";

type SavingsGoal = {
  id: string;
  title: string;
  principalUsd: number;
  earnedUsd: number;
  apyPercent: number;
};

type ScreenMode = "list" | "add" | "create";

const DEFAULT_APY = 4.2;

const INITIAL_GOALS: SavingsGoal[] = [];

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseAmount(text: string): number {
  const parsed = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function SavingsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>(INITIAL_GOALS);
  const [mode, setMode] = useState<ScreenMode>("list");
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const [goalIndex, setGoalIndex] = useState(0);
  const { width: windowWidth } = useWindowDimensions();
  const goalCardWidth = Math.max(windowWidth - spacing.screenX * 2 - 20, 280);
  const goalStride = goalCardWidth + 12;

  const totals = useMemo(() => {
    const principal = goals.reduce((sum, goal) => sum + goal.principalUsd, 0);
    const earned = goals.reduce((sum, goal) => sum + goal.earnedUsd, 0);
    return { principal, earned, apy: DEFAULT_APY };
  }, [goals]);

  const onGoalScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(event.nativeEvent.contentOffset.x / goalStride);
    setGoalIndex(Math.min(Math.max(next, 0), Math.max(goals.length - 1, 0)));
  };

  const handleConfirmAdd = () => {
    const amount = parseAmount(amountText);
    if (amount <= 0 || !selectedGoalId) {
      return;
    }
    setGoals((current) =>
      current.map((goal) =>
        goal.id === selectedGoalId
          ? { ...goal, principalUsd: goal.principalUsd + amount }
          : goal,
      ),
    );
    setAmountText("");
    setMode("list");
  };

  const handleCreateGoal = () => {
    const title = newTitle.trim() || "Goal";
    const id = `${title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const amount = parseAmount(amountText);
    const next: SavingsGoal = {
      id,
      title,
      principalUsd: amount > 0 ? amount : 0,
      earnedUsd: 0,
      apyPercent: DEFAULT_APY,
    };
    setGoals((current) => [...current, next]);
    setSelectedGoalId(id);
    setGoalIndex(goals.length);
    setNewTitle("");
    setAmountText("");
    setMode("list");
  };

  if (mode === "add" && goals.length > 0) {
    return (
      <AddToSavingsView
        goals={goals}
        selectedGoalId={selectedGoalId}
        amountText={amountText}
        onSelectGoal={setSelectedGoalId}
        onChangeAmount={setAmountText}
        onBack={() => {
          setAmountText("");
          setMode("list");
        }}
        onConfirm={handleConfirmAdd}
      />
    );
  }

  // Empty = create form on one screen. Also used for “New goal” from the list.
  if (goals.length === 0 || mode === "create") {
    return (
      <CreateGoalView
        title={newTitle}
        amountText={amountText}
        showBack={goals.length > 0}
        isFirstGoal={goals.length === 0}
        onChangeTitle={setNewTitle}
        onChangeAmount={setAmountText}
        onBack={() => {
          setAmountText("");
          setMode("list");
        }}
        onCreate={handleCreateGoal}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Wash />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <Text style={styles.title}>Savings</Text>
        <Text style={styles.subtitle}>Your goals earn yield in USDC. Add anytime.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.muted}>Amount</Text>
          <Text style={styles.heroAmount}>${formatUsd(totals.principal)}</Text>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.apyLabel}>APY</Text>
              <Text style={styles.summaryValue}>{totals.apy}%</Text>
            </View>
            <View style={styles.alignEnd}>
              <Text style={styles.mutedSmall}>You’ve earned</Text>
              <Text style={styles.earnedValue}>${formatUsd(totals.earned)}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() => {
            setSelectedGoalId(goals[goalIndex]?.id ?? goals[0]?.id ?? "");
            setAmountText("");
            setMode("add");
          }}
          accessibilityRole="button"
          accessibilityLabel="Add to savings"
        >
          <Ionicons name="add" size={18} color={colors.white} />
          <Text style={styles.primaryLabel}>Add to savings</Text>
        </Pressable>
        <Text style={styles.hint}>Add USDC from your available balance to a goal.</Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitleInline}>Your goals</Text>
          {goals.length > 1 ? (
            <Text style={styles.scrollHint}>
              {goalIndex + 1} of {goals.length}
            </Text>
          ) : null}
        </View>

        <ScrollView
          horizontal
          pagingEnabled={false}
          decelerationRate="fast"
          snapToInterval={goalStride}
          snapToAlignment="start"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onScroll={onGoalScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.goalCarouselContent}
          style={styles.goalCarousel}
        >
          {goals.map((goal) => (
            <View key={goal.id} style={[styles.goalCard, { width: goalCardWidth }]}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.goalAmount}>${formatUsd(goal.principalUsd)}</Text>
              </View>
              <View style={styles.goalMeta}>
                <View>
                  <Text style={styles.mutedSmall}>APY</Text>
                  <Text style={styles.metaValue}>{goal.apyPercent}%</Text>
                </View>
                <View style={styles.alignEnd}>
                  <Text style={styles.mutedSmall}>You’ve earned</Text>
                  <Text style={styles.earnedValue}>${formatUsd(goal.earnedUsd)}</Text>
                </View>
              </View>
              <Pressable
                style={styles.goalAddButton}
                onPress={() => {
                  setSelectedGoalId(goal.id);
                  setAmountText("");
                  setMode("add");
                }}
                accessibilityRole="button"
                accessibilityLabel={`Add USDC to ${goal.title} goal`}
              >
                <Text style={styles.goalAddLabel}>Add to {goal.title} goal</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {goals.length > 1 ? (
          <View style={styles.pagerRow}>
            <View style={styles.dots} accessibilityLabel="Goal pages">
              {goals.map((goal, index) => (
                <View
                  key={goal.id}
                  style={[styles.dot, index === goalIndex ? styles.dotActive : null]}
                />
              ))}
            </View>
            {goalIndex < goals.length - 1 ? (
              <View style={styles.swipeHint}>
                <Text style={styles.scrollHint}>Swipe</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.inkMuted} />
              </View>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => {
            setAmountText("");
            setMode("create");
          }}
          accessibilityRole="button"
          accessibilityLabel="New goal"
        >
          <Ionicons name="add" size={18} color={colors.ink} />
          <Text style={styles.secondaryLabel}>New goal</Text>
        </Pressable>
      </ScrollView>
      <AppTabBar active="savings" />
    </SafeAreaView>
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

type AddToSavingsViewProps = {
  goals: SavingsGoal[];
  selectedGoalId: string;
  amountText: string;
  onSelectGoal: (id: string) => void;
  onChangeAmount: (value: string) => void;
  onBack: () => void;
  onConfirm: () => void;
};

function AddToSavingsView({
  goals,
  selectedGoalId,
  amountText,
  onSelectGoal,
  onChangeAmount,
  onBack,
  onConfirm,
}: AddToSavingsViewProps) {
  const selected = goals.find((goal) => goal.id === selectedGoalId);
  const amount = parseAmount(amountText);
  const afterPrincipal = (selected?.principalUsd ?? 0) + (amount > 0 ? amount : 0);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Wash />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.flowContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backSpacer} />
        </View>

        <Text style={styles.title}>Add to savings</Text>
        <Text style={styles.subtitle}>
          Move USDC from your available balance into a goal. It starts earning the current APY.
        </Text>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Amount (USDC)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              value={amountText}
              onChangeText={onChangeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              accessibilityLabel="Amount in USDC"
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Add to</Text>
        {goals.map((goal) => {
          const selectedGoal = goal.id === selectedGoalId;
          return (
            <Pressable
              key={goal.id}
              style={[styles.selectRow, selectedGoal ? styles.selectRowActive : null]}
              onPress={() => onSelectGoal(goal.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedGoal }}
            >
              <View>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <Text style={styles.mutedSmall}>
                  ${formatUsd(goal.principalUsd)} earning · {goal.apyPercent}% APY
                </Text>
              </View>
              {selectedGoal ? <Text style={styles.selectedTag}>Selected</Text> : null}
            </Pressable>
          );
        })}

        {selected ? (
          <View style={styles.summaryCard}>
            <Text style={styles.muted}>After this add</Text>
            <Text style={styles.cardHeadline}>
              {selected.title} · ${formatUsd(afterPrincipal)}
            </Text>
            <Text style={styles.body}>
              Continues earning at {DEFAULT_APY}% APY. Yield is variable and not guaranteed.
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, amount <= 0 ? styles.buttonDisabled : null]}
          onPress={onConfirm}
          disabled={amount <= 0}
          accessibilityRole="button"
          accessibilityLabel="Confirm add"
        >
          <Text style={styles.primaryLabel}>Confirm add</Text>
        </Pressable>
      </ScrollView>
      <AppTabBar active="savings" />
    </SafeAreaView>
  );
}

type CreateGoalViewProps = {
  title: string;
  amountText: string;
  showBack: boolean;
  isFirstGoal: boolean;
  onChangeTitle: (value: string) => void;
  onChangeAmount: (value: string) => void;
  onBack: () => void;
  onCreate: () => void;
};

function CreateGoalView({
  title,
  amountText,
  showBack,
  isFirstGoal,
  onChangeTitle,
  onChangeAmount,
  onBack,
  onCreate,
}: CreateGoalViewProps) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Wash />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={isFirstGoal ? styles.scrollContent : styles.flowContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {showBack ? (
          <View style={styles.topBar}>
            <Pressable style={styles.backButton} onPress={onBack} accessibilityLabel="Back">
              <Ionicons name="arrow-back" size={20} color={colors.ink} />
            </Pressable>
            <Text style={styles.wordmark}>Olimpia</Text>
            <View style={styles.backSpacer} />
          </View>
        ) : null}

        <Text style={styles.title}>{isFirstGoal ? "Savings" : "New goal"}</Text>
        <Text style={styles.subtitle}>Name a goal and add money when you’re ready.</Text>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Goal title</Text>
          <TextInput
            value={title}
            onChangeText={onChangeTitle}
            placeholder="Name your goal"
            placeholderTextColor={colors.inkMuted}
            style={styles.titleInput}
            accessibilityLabel="Goal title"
            autoCorrect
            autoCapitalize="words"
          />
        </View>

        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Add money (optional)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currency}>$</Text>
            <TextInput
              value={amountText}
              onChangeText={onChangeAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.inkMuted}
              style={styles.input}
              accessibilityLabel="Optional amount in dollars"
            />
          </View>
        </View>

        <Pressable
          style={[styles.primaryButton, !title.trim() ? styles.buttonDisabled : null]}
          onPress={onCreate}
          disabled={!title.trim()}
          accessibilityRole="button"
          accessibilityLabel="Create goal"
        >
          <Text style={styles.primaryLabel}>Create goal</Text>
        </Pressable>
        <Text style={styles.hint}>You can add yield later from Home when you’re ready.</Text>
      </ScrollView>
      <AppTabBar active="savings" />
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
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.block,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitleInline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  scrollHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.inkMuted,
  },
  goalCarousel: {
    marginHorizontal: -spacing.screenX,
  },
  goalCarouselContent: {
    paddingHorizontal: spacing.screenX,
    gap: 12,
  },
  pagerRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.raspberry,
  },
  swipeHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  flowContent: {
    paddingHorizontal: spacing.screenX + 8,
    paddingTop: spacing.card,
    paddingBottom: spacing.block,
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
  backSpacer: {
    width: 40,
    height: 40,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    marginTop: 8,
  },
  subtitle: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  summaryCard: {
    marginTop: 24,
    paddingHorizontal: spacing.card,
    paddingVertical: 20,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  muted: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: colors.inkMuted,
  },
  mutedSmall: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.inkMuted,
  },
  heroAmount: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  summaryRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  apyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.raspberry,
  },
  summaryValue: {
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  earnedValue: {
    marginTop: 4,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.raspberry,
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  primaryButton: {
    marginTop: 16,
    height: 48,
    borderRadius: radius.card,
    backgroundColor: colors.raspberry,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  hint: {
    marginTop: 8,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: colors.inkMuted,
  },
  sectionTitle: {
    marginTop: 32,
    marginBottom: 12,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  goalCard: {
    marginBottom: 0,
    paddingHorizontal: spacing.card,
    paddingVertical: 16,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  goalTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: colors.ink,
  },
  goalAmount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.ink,
  },
  goalMeta: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaValue: {
    marginTop: 2,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  goalAddButton: {
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(229, 75, 122, 0.25)",
    backgroundColor: "rgba(252, 238, 242, 0.6)",
    alignItems: "center",
  },
  goalAddLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.raspberry,
  },
  secondaryButton: {
    marginTop: 8,
    height: 48,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.ink,
  },
  cardHeadline: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 22,
    color: colors.ink,
  },
  body: {
    marginTop: 8,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  fieldCard: {
    marginTop: 24,
    paddingHorizontal: spacing.card,
    paddingVertical: 14,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.inkMuted,
  },
  inputRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currency: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.ink,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 18,
    color: colors.ink,
    padding: 0,
  },
  titleInput: {
    marginTop: 8,
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: colors.ink,
    padding: 0,
  },
  selectRow: {
    marginBottom: 8,
    paddingHorizontal: spacing.card,
    paddingVertical: 14,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectRowActive: {
    borderColor: "rgba(229, 75, 122, 0.35)",
    borderWidth: 2,
  },
  selectedTag: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.raspberry,
  },
});
