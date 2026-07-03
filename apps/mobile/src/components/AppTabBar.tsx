import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

type TabId = "home" | "savings" | "card" | "profile";

const tabs: {
  id: TabId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "home", label: "Home", icon: "home-outline", activeIcon: "home" },
  { id: "savings", label: "Savings", icon: "wallet-outline", activeIcon: "wallet" },
  { id: "card", label: "Card", icon: "card-outline", activeIcon: "card" },
  { id: "profile", label: "Profile", icon: "person-outline", activeIcon: "person" },
];

type AppTabBarProps = {
  active?: TabId;
};

export function AppTabBar({ active = "home" }: AppTabBarProps) {
  return (
    <View style={styles.bar}>
      {tabs.map(({ id, label, icon, activeIcon }) => {
        const isActive = id === active;
        return (
          <View key={id} style={styles.tab}>
            <Ionicons
              name={isActive ? activeIcon : icon}
              size={22}
              color={isActive ? colors.raspberry : colors.inkMuted}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: colors.inkMuted,
    opacity: 0.7,
  },
  labelActive: {
    fontFamily: "Inter_600SemiBold",
    color: colors.raspberry,
    opacity: 1,
  },
});
