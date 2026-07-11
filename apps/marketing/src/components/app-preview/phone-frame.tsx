import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

/** Device chrome for Phase 2 app screen previews (not marketing PhoneMockup). */
export function PhoneFrame({ children, className }: PhoneFrameProps) {
  return (
    <div className={cn("relative w-full max-w-[390px]", className)}>
      <div className="relative rounded-[3.25rem] bg-[#111] p-[10px] shadow-[0_40px_80px_-20px_rgba(47,47,47,0.28),0_15px_40px_-15px_rgba(229,75,122,0.22)]">
        <div
          className="pointer-events-none absolute inset-0 rounded-[3.25rem] ring-1 ring-inset ring-white/[0.12]"
          aria-hidden
        />
        <div className="relative flex min-h-[780px] flex-col overflow-hidden rounded-[2.75rem] bg-background">
          {/* Mockup-scale status bar — phone chrome only */}
          <div className="relative flex h-11 shrink-0 items-center justify-between px-7 pt-3 text-[11px] font-semibold text-foreground">
            <span>9:41</span>
            <div className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111]" />
            <div className="flex items-center gap-1.5">
              <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor" aria-hidden>
                <rect x="0" y="6" width="2" height="3" rx="0.5" />
                <rect x="3.5" y="4" width="2" height="5" rx="0.5" />
                <rect x="7" y="2" width="2" height="7" rx="0.5" />
                <rect x="10.5" y="0" width="2" height="9" rx="0.5" />
              </svg>
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none" aria-hidden>
                <rect x="0.5" y="0.5" width="14" height="9" rx="2" stroke="currentColor" opacity="0.5" />
                <rect x="2" y="2" width="11" height="6" rx="1" fill="currentColor" />
                <rect x="15.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          <div className="mx-auto mb-2 h-1 w-28 shrink-0 rounded-full bg-foreground/15" aria-hidden />
        </div>
      </div>
    </div>
  );
}
