import {
  CormorantGaramond_400Regular,
  CormorantGaramond_400Regular_Italic,
  useFonts,
} from "@expo-google-fonts/cormorant-garamond";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts as useInterFonts,
} from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { PrivyProvider } from "@privy-io/expo";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  privyAppId,
  privyClientId,
  privyConfig,
  privySupportedChains,
} from "@/config/privy";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { WelcomeScreen } from "@/screens/WelcomeScreen";
import { colors } from "@/theme/colors";

type AppScreen = "welcome" | "home";

export default function App() {
  const [screen, setScreen] = useState<AppScreen>("welcome");
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });
  const [displayLoaded] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
  });

  if (!interLoaded || !displayLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.raspberry} />
      </View>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      clientId={privyClientId}
      supportedChains={[...privySupportedChains]}
      config={privyConfig}
    >
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {screen === "welcome" ? (
          <WelcomeScreen
            onGetStarted={() => setScreen("home")}
            onSignIn={() => setScreen("home")}
          />
        ) : (
          <EmptyHomeScreen />
        )}
      </SafeAreaProvider>
    </PrivyProvider>
  );
}
