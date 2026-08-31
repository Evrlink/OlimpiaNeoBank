import { Ionicons } from "@expo/vector-icons";
import { usePrivy } from "@privy-io/expo";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityListCard } from "@/components/ActivityListCard";
import { AppTabBar } from "@/components/AppTabBar";
import { getActivity, type ActivityItem } from "@/services/api/activity";
import { colors, radius, spacing } from "@/theme/colors";

const PAGE_SIZE = 20;

type ActivityScreenProps = {
  onBack: () => void;
};

export function ActivityScreen({ onBack }: ActivityScreenProps) {
  const { getAccessToken } = usePrivy();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreLock = useRef(false);

  const loadPage = useCallback(
    async (cursor?: string) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      const page = await getActivity(accessToken, {
        limit: PAGE_SIZE,
        cursor,
      });

      setItems((current) => {
        if (!cursor) {
          return page.items;
        }

        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });

      const sameCursor = Boolean(cursor && page.nextCursor === cursor);
      setNextCursor(
        page.items.length === 0 || sameCursor ? null : page.nextCursor,
      );
    },
    [getAccessToken],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setIsLoading(true);

      try {
        await loadPage();
      } catch {
        if (!cancelled) {
          setItems([]);
          setNextCursor(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const handleLoadOlder = useCallback(async () => {
    if (!nextCursor || loadMoreLock.current) {
      return;
    }

    loadMoreLock.current = true;
    setIsLoadingMore(true);

    try {
      await loadPage(nextCursor);
    } catch {
      // Keep the list already on screen.
    } finally {
      loadMoreLock.current = false;
      setIsLoadingMore(false);
    }
  }, [loadPage, nextCursor]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
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
        <View style={styles.topBar}>
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.ink} />
          </Pressable>
          <Text style={styles.wordmark}>Olimpia</Text>
          <View style={styles.backButtonSpacer} />
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>Your transfers, in dollars.</Text>

          {isLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={colors.raspberry} />
            </View>
          ) : items.length > 0 ? (
            <>
              <ActivityListCard items={items} />
              {nextCursor ? (
                <Pressable
                  style={styles.loadOlder}
                  onPress={() => {
                    void handleLoadOlder();
                  }}
                  disabled={isLoadingMore}
                  accessibilityRole="button"
                  accessibilityLabel="Load older activity"
                >
                  {isLoadingMore ? (
                    <ActivityIndicator color={colors.raspberry} />
                  ) : (
                    <Text style={styles.loadOlderLabel}>Load older activity</Text>
                  )}
                </Pressable>
              ) : null}
            </>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={20} color={colors.inkMuted} />
              <Text style={styles.emptyCopy}>
                No activity yet. Your transfers will show up here.
              </Text>
            </View>
          )}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenX + 8,
    paddingBottom: spacing.block,
    paddingTop: spacing.card,
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
  backButtonSpacer: {
    width: 40,
    height: 40,
  },
  wordmark: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 22,
    color: colors.berry,
  },
  section: {
    flex: 1,
    paddingTop: spacing.block,
  },
  title: {
    fontFamily: "CormorantGaramond_400Regular",
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  subtitle: {
    marginTop: 12,
    maxWidth: 320,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    color: colors.inkMuted,
  },
  loadingWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  loadOlder: {
    marginTop: 16,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  loadOlderLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: colors.raspberry,
  },
  emptyCard: {
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
  emptyCopy: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
  },
});
