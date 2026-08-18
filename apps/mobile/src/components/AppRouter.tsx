import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AuthenticatedTabShell } from "@/components/AuthenticatedTabShell";
import { useSessionRestore } from "@/hooks/useSessionRestore";
import { AuthScreen, type AuthMode } from "@/screens/AuthScreen";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { YoureInScreen } from "@/screens/YoureInScreen";
import { colors } from "@/theme/colors";

type AppScreen = "welcome" | "auth" | "youre-in" | "home";

export function AppRouter() {
  const { isBootstrapping, authSync, setAuthSync, sessionRestored, clearAuthenticatedSession } =
    useSessionRestore();
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [openReceiveOnHome, setOpenReceiveOnHome] = useState(false);

  const handleSignOut = () => {
    clearAuthenticatedSession();
    setOpenReceiveOnHome(false);
    setScreen("welcome");
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
            setOpenReceiveOnHome(false);
            setScreen(destination);
          }}
          onBack={() => setScreen("welcome")}
        />
      ) : screen === "youre-in" ? (
        <YoureInScreen
          onExplore={() => {
            setOpenReceiveOnHome(false);
            setScreen("home");
          }}
          onReceive={() => {
            setOpenReceiveOnHome(true);
            setScreen("home");
          }}
        />
      ) : authSync ? (
        <AuthenticatedTabShell
          authSync={authSync}
          initialHomeOverlay={openReceiveOnHome ? "receive" : null}
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
