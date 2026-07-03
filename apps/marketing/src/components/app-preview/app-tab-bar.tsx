import { CreditCard, Home, PiggyBank, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "home", label: "Home", Icon: Home, to: "/app-preview/home" as const },
  { id: "savings", label: "Savings", Icon: PiggyBank, to: "/app-preview/savings" as const },
  { id: "card", label: "Card", Icon: CreditCard, to: "/app-preview/card" as const },
  { id: "profile", label: "Profile", Icon: User, to: "/app-preview/profile" as const },
] as const;

type TabId = (typeof tabs)[number]["id"];

type AppTabBarProps = {
  active?: TabId;
};

export function AppTabBar({ active = "home" }: AppTabBarProps) {
  return (
    <nav
      className="shrink-0 border-t border-border bg-card px-2 pb-1 pt-2"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-4 gap-1">
        {tabs.map(({ id, label, Icon, to }) => {
          const isActive = id === active;
          return (
            <Link
              key={id}
              to={to}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1",
                isActive ? "text-raspberry" : "text-ink-muted/70",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.25 : 2} aria-hidden />
              <span className={cn("text-[10px]", isActive ? "font-semibold" : "font-medium")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
