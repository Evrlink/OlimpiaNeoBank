import type { LucideIcon } from "lucide-react";
import { PreviewTabShell, previewIconCircle } from "./preview-chrome";

type TabEmptyStateProps = {
  active: "savings" | "card";
  icon: LucideIcon;
  title: string;
  description: string;
};

export function TabEmptyState({ active, icon: Icon, title, description }: TabEmptyStateProps) {
  return (
    <PreviewTabShell
      active={active}
      wash
      className="items-center justify-center text-center"
    >
      <span className={`${previewIconCircle} h-14 w-14`}>
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden />
      </span>
      <h1 className="mt-5 text-h3 font-semibold text-foreground">{title}</h1>
      <p className="mt-2 max-w-[26ch] text-body-sm text-ink-muted">{description}</p>
    </PreviewTabShell>
  );
}
