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
import { PrivyProvider } from "@privy-io/expo";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppRouter } from "@/components/AppRouter";
import {
  privyAppId,
  privyClientId,
  privyConfig,
  privySupportedChains,
} from "@/config/privy";
import { colors } from "@/theme/colors";

export default function App() {
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
      {...(privyClientId ? { clientId: privyClientId } : {})}
      supportedChains={[...privySupportedChains]}
      config={privyConfig}
    >
      <SafeAreaProvider>
        <AppRouter />
      </SafeAreaProvider>
    </PrivyProvider>
  );
}
