import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppPreviewWordmarkProps = {
  className?: string;
};

/** Centered Olimpia wordmark — matches Welcome (A1). Cormorant, berry, text-h3. */
export function AppPreviewWordmark({ className }: AppPreviewWordmarkProps) {
  return (
    <p className={cn("text-center font-display text-h3 tracking-tight text-berry", className)}>
      Olimpia
    </p>
  );
}

type AppPreviewTopBarProps = {
  className?: string;
  leftSlot?: ReactNode;
};

/** Centered wordmark with optional absolute left action (e.g. back). */
export function AppPreviewTopBar({ className, leftSlot }: AppPreviewTopBarProps) {
  return (
    <div className={cn("relative flex min-h-10 items-center justify-center", className)}>
      {leftSlot ? (
        <div className="absolute left-0 top-1/2 -translate-y-1/2">{leftSlot}</div>
      ) : null}
      <AppPreviewWordmark />
    </div>
  );
}
