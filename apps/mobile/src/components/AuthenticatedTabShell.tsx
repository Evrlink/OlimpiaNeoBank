import { usePrivy } from "@privy-io/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import type { TabId } from "@/components/AppTabBar";
import { TabNavigationProvider } from "@/context/TabNavigationContext";
import { ActivityScreen } from "@/screens/ActivityScreen";
import { CardScreen } from "@/screens/CardScreen";
import { ChooseYieldScreen } from "@/screens/ChooseYieldScreen";
import { EmptyHomeScreen } from "@/screens/EmptyHomeScreen";
import { ProfileScreen } from "@/screens/ProfileScreen";
import { ReceiveMoneyScreen } from "@/screens/ReceiveMoneyScreen";
import { SavingsScreen } from "@/screens/SavingsScreen";
import { SendMoneyScreen } from "@/screens/SendMoneyScreen";
import { getActivity, type ActivityItem } from "@/services/api/activity";
import { getBalance } from "@/services/api/balance";
import type { AuthSyncBalance, AuthSyncResponse } from "@/services/api/authSync";

type HomeOverlay = "choose-yield" | "send" | "receive" | "activity" | null;

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
  const [refreshingHome, setRefreshingHome] = useState(false);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const homeRequestId = useRef(0);
  const onBalanceDisplayChangeRef = useRef(onBalanceDisplayChange);
  onBalanceDisplayChangeRef.current = onBalanceDisplayChange;

  const isHomeVisible = activeTab === "home" && homeOverlay === null;

  const refreshHome = useCallback(async () => {
    const requestId = ++homeRequestId.current;

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        return;
      }

      const [balanceResult, activityResult] = await Promise.allSettled([
        getBalance(accessToken),
        getActivity(accessToken, { limit: 5 }),
      ]);

      if (requestId !== homeRequestId.current) {
        return;
      }

      if (balanceResult.status === "fulfilled") {
        onBalanceDisplayChangeRef.current?.(balanceResult.value);
      }

      if (activityResult.status === "fulfilled") {
        setActivityItems(activityResult.value.items);
      }
    } catch {
      // Keep the last known Home data on screen.
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (!isHomeVisible) {
      return;
    }

    void refreshHome();
  }, [isHomeVisible, refreshHome]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && isHomeVisible) {
        void refreshHome();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isHomeVisible, refreshHome]);

  const handlePullToRefresh = useCallback(async () => {
    setRefreshingHome(true);

    try {
      await refreshHome();
    } finally {
      setRefreshingHome(false);
    }
  }, [refreshHome]);

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
  } else if (homeOverlay === "activity") {
    content = <ActivityScreen onBack={() => setHomeOverlay(null)} />;
  } else {
    content = (
      <>
        {activeTab === "home" ? (
          <EmptyHomeScreen
            user={authSync.user}
            balance={authSync.balance}
            activityItems={activityItems}
            refreshing={refreshingHome}
            onRefresh={handlePullToRefresh}
            onChooseYield={() => setHomeOverlay("choose-yield")}
            onSend={() => setHomeOverlay("send")}
            onReceive={() => setHomeOverlay("receive")}
            onSeeAllActivity={() => setHomeOverlay("activity")}
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
