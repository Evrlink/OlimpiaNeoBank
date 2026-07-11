/**
 * Shared layout / color / spacing recipes for in-phone app previews.
 * Keep screens on these tokens so chrome stays consistent.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AppTabBar } from "./app-tab-bar";

export const previewPad = {
  /** Authenticated tab screens (Home, Profile, Savings, Card, home-funded). */
  tab: "px-6 pb-4 pt-4",
  /** Flows with back + wordmark (Add Money steps, Add funds, Auth body). */
  flow: "px-6 pb-6 pt-3",
} as const;

/** Standard surface card. */
export const previewCard =
  "rounded-2xl border border-border/40 bg-card";

/** Elevated card (primary actions / balance). */
export const previewCardElevated = cn(previewCard, "shadow-card");

/** Soft rose callout surface. */
export const previewCallout =
  "rounded-2xl border border-rose/20 bg-rose-soft/60";

/** Primary in-app CTA — Inter body-sm, raspberry, 48px. */
export const previewPrimaryBtn =
  "flex h-12 w-full items-center justify-center rounded-2xl bg-raspberry text-body-sm font-semibold text-white transition hover:opacity-90";

/** Secondary / outline CTA. */
export const previewSecondaryBtn =
  "flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-body-sm font-semibold text-foreground transition hover:border-foreground/20";

/** Icon well used on Send/Receive and list rows. */
export const previewIconCircle =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/70 text-raspberry";

/** Profile / home avatar. */
export const previewAvatar =
  "h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-rose to-raspberry ring-2 ring-background";

type PreviewTabShellProps = {
  active: "home" | "savings" | "card" | "profile";
  children: ReactNode;
  /** Optional atmospheric wash behind content. */
  wash?: boolean;
  /** Soft bottom fade so overflow content feels scrollable. */
  scrollFade?: boolean;
  className?: string;
};

/** Tab roots: shared padding + pinned AppTabBar. */
export function PreviewTabShell({
  active,
  children,
  wash = false,
  scrollFade = false,
  className,
}: PreviewTabShellProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {wash ? <div className="app-welcome-bg" aria-hidden /> : null}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col overflow-y-auto",
            previewPad.tab,
            scrollFade && "pb-8",
            className,
          )}
        >
          {children}
        </div>
        {scrollFade ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-background via-background/80 to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
      <AppTabBar active={active} />
    </div>
  );
}

type PreviewFlowShellProps = {
  children: ReactNode;
  /** When true, mounts AppTabBar (e.g. Add Money gallery with nav on every state). */
  showTabBar?: boolean;
  tabActive?: "home" | "savings" | "card" | "profile";
  wash?: boolean;
  className?: string;
};

/** Flow screens: shared padding + welcome wash; optional tab bar. */
export function PreviewFlowShell({
  children,
  showTabBar = false,
  tabActive = "home",
  wash = true,
  className,
}: PreviewFlowShellProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      {wash ? <div className="app-welcome-bg" aria-hidden /> : null}
      <div
        className={cn(
          "relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto",
          previewPad.flow,
          className,
        )}
      >
        {children}
      </div>
      {showTabBar ? <AppTabBar active={tabActive} /> : null}
    </div>
  );
}
