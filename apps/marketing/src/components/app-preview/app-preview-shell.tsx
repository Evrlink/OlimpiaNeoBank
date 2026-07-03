import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const previewScreens = [
  { id: "welcome", label: "Welcome", to: "/app-preview/welcome" as const },
  { id: "youre-in", label: "You're in", to: "/app-preview/youre-in" as const },
  { id: "home", label: "Empty Home", to: "/app-preview/home" as const },
  { id: "add-funds", label: "Add funds", to: "/app-preview/add-funds" as const },
  { id: "savings", label: "Savings", to: "/app-preview/savings" as const },
  { id: "card", label: "Card", to: "/app-preview/card" as const },
  { id: "profile", label: "Profile", to: "/app-preview/profile" as const },
] as const;

type PreviewScreenId = (typeof previewScreens)[number]["id"];

type AppPreviewShellProps = {
  title: string;
  description: string;
  active: PreviewScreenId;
  children: ReactNode;
};

export function AppPreviewShell({ title, description, active, children }: AppPreviewShellProps) {
  return (
    <div className="min-h-screen bg-surface/50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <p className="text-label font-semibold uppercase tracking-[0.18em] text-raspberry">
          Phase 2 app preview
        </p>
        <h1 className="mt-2 text-h2 font-semibold text-foreground">{title}</h1>
        <p className="mt-2 text-body-sm text-ink-muted">{description}</p>

        <nav
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Preview screens"
        >
          {previewScreens.map(({ id, label, to }) => (
            <Link
              key={id}
              to={to}
              className={cn(
                "rounded-full px-3 py-1.5 text-body-sm font-semibold transition",
                active === id
                  ? "bg-raspberry text-white"
                  : "bg-card text-foreground ring-1 ring-border hover:bg-background",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 flex justify-center">{children}</div>
      </div>
    </div>
  );
}
