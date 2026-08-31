import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { ActivityItem } from "@/services/api/activity";
import { colors, radius, spacing } from "@/theme/colors";

function activityTitle(type: string): string {
  if (type === "received") {
    return "Received";
  }

  if (type === "sent") {
    return "Sent";
  }

  return type;
}

function formatActivityDate(iso: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type ActivityListCardProps = {
  items: ActivityItem[];
};

export function ActivityListCard({ items }: ActivityListCardProps) {
  return (
    <View style={styles.card}>
      {items.map((item, index) => {
        const dateLabel = formatActivityDate(item.createdAt);
        const isSent = item.type === "sent";

        return (
          <View
            key={item.id}
            style={[styles.row, index > 0 ? styles.rowDivider : null]}
          >
            <View style={styles.iconWrap}>
              <Ionicons
                name={isSent ? "arrow-up-outline" : "arrow-down-outline"}
                size={16}
                color={colors.raspberry}
              />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{activityTitle(item.type)}</Text>
              {dateLabel ? <Text style={styles.meta}>{dateLabel}</Text> : null}
            </View>
            <Text style={styles.amount}>${item.amountUsd}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: spacing.card,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 225, 218, 0.4)",
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: "rgba(251, 221, 230, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
  },
  meta: {
    marginTop: 2,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: colors.inkMuted,
  },
  amount: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: colors.ink,
  },
});
