import { usePrivy } from "@privy-io/expo";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppTabBar } from "@/components/AppTabBar";
import type { AuthSyncBalance, AuthSyncUser } from "@/services/api/authSync";
import { colors, radius, spacing } from "@/theme/colors";
import { getGreetingName } from "@/utils/auth";

type ProfileScreenProps = {
  user: AuthSyncUser;
  balance: AuthSyncBalance;
  onSignOut: () => void;
};

function formatAccountDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ProfileScreen({ user, balance, onSignOut }: ProfileScreenProps) {
  const { logout } = usePrivy();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const greetingName = getGreetingName(user);
  const email = user.email?.trim();
  const createdAt = user.createdAt?.trim();

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setSignOutError(null);
    setIsSigningOut(true);

    try {
      await logout();
      onSignOut();
    } catch {
      setSignOutError("Sign out didn't finish. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <LinearGradient
        colors={["rgba(252, 238, 242, 0.95)", colors.background, colors.background]}
        style={styles.backgroundWash}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.45 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Profile</Text>

        <View style={styles.piaCard}>
          <View style={styles.piaHeader}>
            <Text style={styles.piaTitle}>Pia</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonLabel}>Coming soon</Text>
            </View>
          </View>
          <View style={styles.piaBubble}>
            <Text style={styles.piaBody}>
              Pia will help explain your balance, money tools, and next steps in simple language.
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <ProfileField label="Name" value={greetingName} />
          {email ? <ProfileField label="Email" value={email} /> : null}
          <ProfileField label="Balance" value={`$${balance.totalDisplayUsd}`} />
          {createdAt ? (
            <ProfileField label="Account created" value={formatAccountDate(createdAt)} />
          ) : null}
        </View>

        <Pressable
          style={[styles.signOutButton, isSigningOut ? styles.signOutButtonDisabled : null]}
          onPress={() => void handleSignOut()}
          disabled={isSigningOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutLabel}>{isSigningOut ? "Signing out…" : "Sign out"}</Text>
        </Pressable>
        {signOutError ? (
          <Text style={styles.signOutError} accessibilityRole="alert">
            {signOutError}
          </Text>
        ) : null}
      </ScrollView>

      <AppTabBar active="profile" />
    </SafeAreaView>
  );
}

type ProfileFieldProps = {
  label: string;
  value: string;
};

function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundWash: {
    ...StyleSheet.absoluteFillObject,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenX,
    paddingTop: 8,
    paddingBottom: spacing.block,
  },
  title: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
  },
  piaCard: {
    marginTop: spacing.block,
    padding: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    gap: 12,
  },
  piaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  piaTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.roseSoft,
  },
  comingSoonLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    lineHeight: 14,
    color: colors.raspberry,
    textTransform: "capitalize",
  },
  piaBubble: {
    padding: 12,
    borderRadius: radius.card,
    borderTopLeftRadius: 6,
    backgroundColor: colors.background,
  },
  piaBody: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  card: {
    marginTop: spacing.block,
    padding: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.4)",
    backgroundColor: colors.card,
    gap: 16,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: colors.inkMuted,
  },
  fieldValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
  },
  signOutButton: {
    marginTop: spacing.block,
    paddingVertical: 14,
    paddingHorizontal: spacing.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: "rgba(232, 225, 218, 0.6)",
    backgroundColor: colors.card,
    alignItems: "center",
  },
  signOutButtonDisabled: {
    opacity: 0.6,
  },
  signOutLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    lineHeight: 22,
    color: colors.berryDark,
  },
  signOutError: {
    marginTop: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.raspberry,
    textAlign: "center",
  },
});
