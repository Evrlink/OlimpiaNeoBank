import { useEffect, useState } from "react";
import { View } from "react-native";
import { usePrivy } from "@privy-io/expo";
import type { TabId } from "@/components/AppTabBar";
import { TabNavigationProvider } from "@/context/TabNavigationContext";
import { AddMoneyScreen } from "@/screens/AddMoneyScreen";
import { CardScreen } from "@/screens/CardScreen";
import { ChooseYieldScreen } from "@/screens/ChooseYieldScreen";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ReceiveMoneyScreen } from "@/screens/ReceiveMoneyScreen";
import { SavingsScreen } from "@/screens/SavingsScreen";
import { SendMoneyScreen } from "@/screens/SendMoneyScreen";
import type { AuthSyncBalance, AuthSyncResponse } from "@/services/api/authSync";
import { getMe } from "@/services/api/me";

type AuthenticatedTabShellProps = {
  authSync: AuthSyncResponse;
  onSignOut: () => void;
  onBalanceDisplayChange?: (balance: AuthSyncBalance) => void;
};

type HomeOverlay = "add-money" | "choose-yield" | "send" | "receive" | null;

export function AuthenticatedTabShell({
  authSync,
  onSignOut,
  onBalanceDisplayChange,
}: AuthenticatedTabShellProps) {
  const { getAccessToken } = usePrivy();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [homeOverlay, setHomeOverlay] = useState<HomeOverlay>(null);
  const [displayBalance, setDisplayBalance] = useState(authSync.balance);

  useEffect(() => {
    setDisplayBalance(authSync.balance);
  }, [authSync.balance]);

  const handleTabPress = (tab: TabId) => {
    setHomeOverlay(null);
    setActiveTab(tab);
  };

  const refreshBalanceAfterDeposit = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        return;
      }

      const me = await getMe(token);
      setDisplayBalance(me.balance);
      onBalanceDisplayChange?.(me.balance);
    } catch {
      // Keep current display balance if refresh fails; deposit already completed server-side.
    }
  };

  let content = null;

  if (homeOverlay === "add-money") {
    content = (
      <AddMoneyScreen
        onBack={() => setHomeOverlay(null)}
        onCompleted={() => {
          void refreshBalanceAfterDeposit().finally(() => {
            setHomeOverlay(null);
          });
        }}
      />
    );
  } else if (homeOverlay === "choose-yield") {
    content = <ChooseYieldScreen onBack={() => setHomeOverlay(null)} />;
  } else if (homeOverlay === "send") {
    content = <SendMoneyScreen onBack={() => setHomeOverlay(null)} />;
  } else if (homeOverlay === "receive") {
    content = <ReceiveMoneyScreen onBack={() => setHomeOverlay(null)} />;
  } else {
    content = (
      <>
        {activeTab === "home" ? (
          <EmptyHomeScreen
            user={authSync.user}
            balance={displayBalance}
            onAddMoney={() => setHomeOverlay("add-money")}
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
