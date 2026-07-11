import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { usePrivy } from "@privy-io/expo";
import { AuthenticatedTabShell } from "@/components/AuthenticatedTabShell";
import { useSessionRestore } from "@/hooks/useSessionRestore";
import { AddMoneyScreen } from "@/screens/AddMoneyScreen";
import { AuthScreen, type AuthMode } from "@/screens/AuthScreen";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { YoureInScreen } from "@/screens/YoureInScreen";
import { getMe } from "@/services/api/me";
import { colors } from "@/theme/colors";

type AppScreen = "welcome" | "auth" | "youre-in" | "add-money" | "home";

export function AppRouter() {
  const { getAccessToken } = usePrivy();
  const { isBootstrapping, authSync, setAuthSync, sessionRestored, clearAuthenticatedSession } =
    useSessionRestore();
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  const handleSignOut = () => {
    clearAuthenticatedSession();
    setScreen("welcome");
  };

  const refreshBalanceAfterDeposit = async () => {
    if (!authSync) {
      return;
    }

    try {
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      const me = await getMe(token);
      setAuthSync({ ...authSync, balance: me.balance });
    } catch {
      // Deposit completed server-side; keep navigating home even if refresh fails.
    }
  };

  if (isBootstrapping) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.raspberry} />
      </View>
    );
  }

  if (sessionRestored && authSync) {
    return (
      <>
        <StatusBar style="dark" />
        <AuthenticatedTabShell
          authSync={authSync}
          onSignOut={handleSignOut}
          onBalanceDisplayChange={(balance) => {
            setAuthSync({ ...authSync, balance });
          }}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      {screen === "welcome" ? (
        <WelcomeScreen
          onGetStarted={() => {
            setAuthMode("signup");
            setScreen("auth");
          }}
          onSignIn={() => {
            setAuthMode("signin");
            setScreen("auth");
          }}
        />
      ) : screen === "auth" ? (
        <AuthScreen
          mode={authMode}
          onSuccess={({ destination, syncResult }) => {
            setAuthSync(syncResult);
            setScreen(destination);
          }}
          onBack={() => setScreen("welcome")}
        />
      ) : screen === "youre-in" ? (
        <YoureInScreen
          onExplore={() => setScreen("home")}
          onAddMoney={() => setScreen("add-money")}
        />
      ) : screen === "add-money" && authSync ? (
        <AddMoneyScreen
          onBack={() => setScreen("youre-in")}
          onCompleted={() => {
            void refreshBalanceAfterDeposit().finally(() => {
              setScreen("home");
            });
          }}
          showTabBar={false}
        />
      ) : authSync ? (
        <AuthenticatedTabShell
          authSync={authSync}
          onSignOut={handleSignOut}
          onBalanceDisplayChange={(balance) => {
            setAuthSync({ ...authSync, balance });
          }}
        />
      ) : (
        <WelcomeScreen
          onGetStarted={() => {
            setAuthMode("signup");
            setScreen("auth");
          }}
          onSignIn={() => {
            setAuthMode("signin");
            setScreen("auth");
          }}
        />
      )}
    </>
  );
}
