import { usePrivy } from "@privy-io/expo";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import type { TabId } from "@/components/AppTabBar";
import { WithdrawSheet } from "@/components/WithdrawSheet";
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
import { getGrowth, type GrowthSummary } from "@/services/api/growth";

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
  const [growth, setGrowth] = useState<GrowthSummary | null>(null);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [growthError, setGrowthError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const homeRequestId = useRef(0);
  const growthRequestId = useRef(0);
  const withdrawExecutingRef = useRef(false);
  const onBalanceDisplayChangeRef = useRef(onBalanceDisplayChange);
  onBalanceDisplayChangeRef.current = onBalanceDisplayChange;
  const isSmartWallet = authSync.wallet.moneyAddressMode === "smart_wallet";
  const growBalance = Number(growth?.currentRedeemableUsdc);
  const canWithdraw =
    isSmartWallet && Number.isFinite(growBalance) && growBalance > 0;

  const isHomeVisible = activeTab === "home" && homeOverlay === null;

  const refreshGrowth = useCallback(
    async (providedAccessToken?: string) => {
      const requestId = ++growthRequestId.current;
      setGrowthLoading(true);
      setGrowthError(null);

      try {
        const accessToken = providedAccessToken ?? (await getAccessToken());
        const nextGrowth = await getGrowth(accessToken ?? "");

        if (requestId === growthRequestId.current) {
          setGrowth(nextGrowth);
        }
      } catch (error) {
        if (requestId === growthRequestId.current) {
          setGrowthError(
            error instanceof Error
              ? error.message
              : "Unable to load Growth. Please try again.",
          );
        }
      } finally {
        if (requestId === growthRequestId.current) {
          setGrowthLoading(false);
        }
      }
    },
    [getAccessToken],
  );

  const refreshHome = useCallback(async (): Promise<AuthSyncBalance | null> => {
    const requestId = ++homeRequestId.current;

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        return null;
      }

      const [balanceResult, activityResult] = await Promise.allSettled([
        getBalance(accessToken),
        getActivity(accessToken, { limit: 5 }),
        refreshGrowth(accessToken),
      ]);

      if (requestId !== homeRequestId.current) {
        return null;
      }

      let nextBalance: AuthSyncBalance | null = null;

      if (balanceResult.status === "fulfilled") {
        nextBalance = balanceResult.value;
        onBalanceDisplayChangeRef.current?.(balanceResult.value);
      }

      if (activityResult.status === "fulfilled") {
        setActivityItems(activityResult.value.items);
      }

      return nextBalance;
    } catch {
      // Keep the last known Home data on screen.
      return null;
    }
  }, [getAccessToken, refreshGrowth]);

  useEffect(() => {
    if (!isHomeVisible) {
      return;
    }

    void refreshHome();
  }, [isHomeVisible, refreshHome]);

  useEffect(() => {
    if (homeOverlay === "choose-yield") {
      void refreshGrowth();
    }
  }, [homeOverlay, refreshGrowth]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        return;
      }

      if (isHomeVisible) {
        void refreshHome();
      } else if (homeOverlay === "choose-yield") {
        void refreshGrowth();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [homeOverlay, isHomeVisible, refreshGrowth, refreshHome]);

  const handlePullToRefresh = useCallback(async () => {
    setRefreshingHome(true);

    try {
      await refreshHome();
    } finally {
      setRefreshingHome(false);
    }
  }, [refreshHome]);

  const handleTabPress = (tab: TabId) => {
    if (!withdrawExecutingRef.current) {
      setHomeOverlay(null);
    }
    setActiveTab(tab);
  };

  const handleWithdrawClose = useCallback(() => {
    if (withdrawExecutingRef.current) {
      return;
    }

    setWithdrawOpen(false);
  }, []);

  const handleWithdrawRefresh = useCallback(async () => {
    const nextBalance = await refreshHome();
    return nextBalance?.availableUsd ?? authSync.balance.availableUsd;
  }, [authSync.balance.availableUsd, refreshHome]);

  let content = null;

  if (homeOverlay === "choose-yield") {
    content = (
      <ChooseYieldScreen
        growth={growth}
        availableUsd={authSync.balance.availableUsd}
        moneyAddressMode={authSync.wallet.moneyAddressMode ?? "eoa"}
        smartWalletAddress={
          authSync.wallet.moneyAddressMode === "smart_wallet"
            ? authSync.wallet.address
            : null
        }
        loading={growthLoading}
        error={growthError}
        getAccessToken={getAccessToken}
        onRetry={refreshGrowth}
        onBack={() => setHomeOverlay(null)}
        onSmartWalletDepositSuccess={async () => {
          await refreshHome();
        }}
      />
    );
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
            growth={growth}
            activityItems={activityItems}
            refreshing={refreshingHome}
            onRefresh={handlePullToRefresh}
            onChooseYield={() => setHomeOverlay("choose-yield")}
            onSend={() => setHomeOverlay("send")}
            onReceive={() => setHomeOverlay("receive")}
            onWithdraw={canWithdraw ? () => setWithdrawOpen(true) : undefined}
            showWithdraw={canWithdraw}
            onSeeAllActivity={() => setHomeOverlay("activity")}
          />
        ) : null}
        {activeTab === "savings" ? <SavingsScreen /> : null}
        {activeTab === "card" ? <CardScreen /> : null}
        {activeTab === "profile" ? (
          <ProfileScreen
            user={authSync.user}
            balance={authSync.balance}
            embeddedWalletAddress={authSync.wallet.address}
            onSignOut={onSignOut}
          />
        ) : null}
      </>
    );
  }

  return (
    <TabNavigationProvider onTabPress={handleTabPress}>
      <View style={{ flex: 1 }}>{content}</View>
      {isSmartWallet ? (
        <WithdrawSheet
          visible={withdrawOpen}
          growBalanceUsdc={growth?.currentRedeemableUsdc ?? "0"}
          availableUsd={authSync.balance.availableUsd}
          moneyAddressMode={authSync.wallet.moneyAddressMode}
          smartWalletAddress={authSync.wallet.address}
          getAccessToken={getAccessToken}
          onClose={handleWithdrawClose}
          onRefreshBalances={handleWithdrawRefresh}
          onExecutionLockChange={(locked) => {
            withdrawExecutingRef.current = locked;
          }}
        />
      ) : null}
    </TabNavigationProvider>
  );
}
