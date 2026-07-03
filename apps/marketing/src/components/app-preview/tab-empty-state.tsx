import type { LucideIcon } from "lucide-react";
import { AppTabBar } from "./app-tab-bar";

type TabEmptyStateProps = {
  active: "savings" | "card";
  icon: LucideIcon;
  title: string;
  description: string;
};

export function TabEmptyState({ active, icon: Icon, title, description }: TabEmptyStateProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col items-center justify-center px-6 pb-4 pt-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose/70 text-raspberry">
          <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
        </span>
        <h1 className="mt-5 text-h3 font-semibold text-foreground">{title}</h1>
        <p className="mt-2 max-w-[26ch] text-body-sm text-ink-muted">{description}</p>
      </div>

      <AppTabBar active={active} />
    </div>
  );
}
