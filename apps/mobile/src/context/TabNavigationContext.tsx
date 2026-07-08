import { createContext, useContext, type ReactNode } from "react";
import type { TabId } from "@/components/AppTabBar";

type TabNavigationContextValue = {
  onTabPress: (tab: TabId) => void;
};

const TabNavigationContext = createContext<TabNavigationContextValue | null>(null);

type TabNavigationProviderProps = {
  children: ReactNode;
  onTabPress: (tab: TabId) => void;
};

export function TabNavigationProvider({ children, onTabPress }: TabNavigationProviderProps) {
  return (
    <TabNavigationContext.Provider value={{ onTabPress }}>{children}</TabNavigationContext.Provider>
  );
}

export function useTabNavigation(): TabNavigationContextValue | null {
  return useContext(TabNavigationContext);
}
