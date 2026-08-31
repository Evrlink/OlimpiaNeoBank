import { usePrivy } from "@privy-io/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import type { TabId } from "@/components/AppTabBar";
import { TabNavigationProvider } from "@/context/TabNavigationContext";
import { CardScreen } from "@/screens/CardScreen";
import { ChooseYieldScreen } from "@/screens/ChooseYieldScreen";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ReceiveMoneyScreen } from "@/screens/ReceiveMoneyScreen";
import { SavingsScreen } from "@/screens/SavingsScreen";
import { SendMoneyScreen } from "@/screens/SendMoneyScreen";
import { getBalance } from "@/services/api/balance";
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
  onBalanceDisplayChange,
  initialHomeOverlay = null,
}: AuthenticatedTabShellProps) {
  const { getAccessToken } = usePrivy();
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [homeOverlay, setHomeOverlay] = useState<HomeOverlay>(initialHomeOverlay);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const balanceRequestId = useRef(0);
  const onBalanceDisplayChangeRef = useRef(onBalanceDisplayChange);
  onBalanceDisplayChangeRef.current = onBalanceDisplayChange;

  const isHomeVisible = activeTab === "home" && homeOverlay === null;

  const refreshBalance = useCallback(async () => {
    const requestId = ++balanceRequestId.current;

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      const balance = await getBalance(accessToken);

      if (requestId !== balanceRequestId.current) {
        return;
      }

      onBalanceDisplayChangeRef.current?.(balance);
    } catch {
      // Keep the last known balance on screen.
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isHomeVisible) {
      return;
    }

    void refreshBalance();
  }, [isHomeVisible, refreshBalance]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isHomeVisible) {
        void refreshBalance();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isHomeVisible, refreshBalance]);

  const handlePullToRefresh = useCallback(async () => {
    setRefreshingBalance(true);

    try {
      await refreshBalance();
    } finally {
      setRefreshingBalance(false);
    }
  }, [refreshBalance]);

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
            balance={authSync.balance}
            refreshing={refreshingBalance}
            onRefresh={handlePullToRefresh}
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
            balance={authSync.balance}
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
