import { useEffect, useState } from "react";
import { View } from "react-native";
import type { TabId } from "@/components/AppTabBar";
import { TabNavigationProvider } from "@/context/TabNavigationContext";
import { CardScreen } from "@/screens/CardScreen";
import { ChooseYieldScreen } from "@/screens/ChooseYieldScreen";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ReceiveMoneyScreen } from "@/screens/ReceiveMoneyScreen";
import { SavingsScreen } from "@/screens/SavingsScreen";
import { SendMoneyScreen } from "@/screens/SendMoneyScreen";
import type { AuthSyncBalance, AuthSyncResponse } from "@/services/api/authSync";

type HomeOverlay = "choose-yield" | "send" | "receive" | null;

type AuthenticatedTabShellProps = {
  authSync: AuthSyncResponse;
  onSignOut: () => void;
  onBalanceDisplayChange?: (balance: AuthSyncBalance) => void;
  initialHomeOverlay?: HomeOverlay;
};

export function AuthenticatedTabShell({
  authSync,
  onSignOut,
  onBalanceDisplayChange: _onBalanceDisplayChange,
  initialHomeOverlay = null,
}: AuthenticatedTabShellProps) {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [homeOverlay, setHomeOverlay] = useState<HomeOverlay>(initialHomeOverlay);
  const [displayBalance, setDisplayBalance] = useState(authSync.balance);

  useEffect(() => {
    setDisplayBalance(authSync.balance);
  }, [authSync.balance]);

  const handleTabPress = (tab: TabId) => {
    setHomeOverlay(null);
    setActiveTab(tab);
  };

  let content = null;

  if (homeOverlay === "choose-yield") {
    content = <ChooseYieldScreen onBack={() => setHomeOverlay(null)} />;
  } else if (homeOverlay === "send") {
    content = <SendMoneyScreen onBack={() => setHomeOverlay(null)} />;
  } else if (homeOverlay === "receive") {
    content = (
      <ReceiveMoneyScreen
        onBack={() => setHomeOverlay(null)}
        address={authSync.wallet.address || null}
      />
    );
  } else {
    content = (
      <>
        {activeTab === "home" ? (
          <EmptyHomeScreen
            user={authSync.user}
            balance={displayBalance}
            onChooseYield={() => setHomeOverlay("choose-yield")}
            onSend={() => setHomeOverlay("send")}
            onReceive={() => setHomeOverlay("receive")}
          />
        ) : null}
        {activeTab === "savings" ? <SavingsScreen /> : null}
        {activeTab === "card" ? <CardScreen /> : null}
        {activeTab === "profile" ? (
          <ProfileScreen
            user={authSync.user}
            balance={displayBalance}
            onSignOut={onSignOut}
          />
        ) : null}
      </>
    );
  }

  return (
    <TabNavigationProvider onTabPress={handleTabPress}>
      <View style={{ flex: 1 }}>{content}</View>
    </TabNavigationProvider>
  );
}
