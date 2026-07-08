import { useState } from "react";
import { View } from "react-native";
import type { TabId } from "@/components/AppTabBar";
import { TabNavigationProvider } from "@/context/TabNavigationContext";
import { CardScreen } from "@/screens/CardScreen";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { SavingsScreen } from "@/screens/SavingsScreen";
import type { AuthSyncResponse } from "@/services/api/authSync";

type AuthenticatedTabShellProps = {
  authSync: AuthSyncResponse;
};

export function AuthenticatedTabShell({ authSync }: AuthenticatedTabShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");

  return (
    <TabNavigationProvider onTabPress={setActiveTab}>
      <View style={{ flex: 1 }}>
        {activeTab === "home" ? (
          <EmptyHomeScreen user={authSync.user} balance={authSync.balance} />
        ) : null}
        {activeTab === "savings" ? <SavingsScreen /> : null}
        {activeTab === "card" ? <CardScreen /> : null}
        {activeTab === "profile" ? (
          <ProfileScreen user={authSync.user} balance={authSync.balance} />
        ) : null}
      </View>
    </TabNavigationProvider>
  );
}
