import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Presentation wrapper for the hero iPhone.
 * Angle / perspective are CSS-owned (see .hero-phone-device) so they stay
 * consistent with reduced-motion and mobile breakpoints.
 */
export function HeroPhoneDevice({ children }: { children: ReactNode }) {
  return <div className={cn("hero-phone-device")}>{children}</div>;
}
