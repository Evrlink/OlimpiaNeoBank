import { Bookmark, ChevronRight, Eye, Plus, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppTabBar } from "./app-tab-bar";

function BalanceCardAccent() {
  return (
    <svg
      viewBox="0 0 160 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute -bottom-1 right-0 h-[4.75rem] w-[7.5rem] text-raspberry/[0.14]"
      aria-hidden
    >
      <path
        d="M12 58c28-14 52-8 76 2s48 16 72 6"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M20 66c24-10 48-4 70 4s46 12 68 4"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M28 74c22-8 44-2 64 4s42 10 60 2"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function EmptyHomeScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-4 pt-4">
        <header className="flex items-center justify-between">
          <p className="text-[0.9375rem] font-medium text-foreground">Hi Sarah ✨</p>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-raspberry text-[0.8125rem] font-semibold tracking-wide text-white">
            SA
          </span>
        </header>

        <div className="mt-7">
          <h1 className="font-display text-[2.125rem] font-semibold leading-[1.12] tracking-[-0.02em] text-foreground">
            Let&apos;s get <span className="font-normal italic">started.</span>
          </h1>
          <p className="mt-3 max-w-[22rem] text-[0.9375rem] leading-[1.55] text-ink-muted">
            Add money to begin building toward the life you choose.
          </p>
        </div>

        <Link
          to="/app-preview/add-funds"
          className="mt-7 flex w-full items-center gap-3.5 rounded-[1.25rem] border border-rose/20 bg-[#FEF6F8] px-4 py-[1.125rem] text-left shadow-[0_1px_2px_rgb(47_47_47_/_0.03),0_10px_24px_-12px_rgb(229_75_122_/_0.14)] transition hover:border-rose/30"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/90 text-raspberry">
            <Plus className="h-[1.375rem] w-[1.375rem]" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[1rem] font-semibold leading-tight text-raspberry">
              Add money
            </span>
            <span className="mt-1 block text-[0.8125rem] leading-snug text-ink-muted">
              Secure transfer to your balance
            </span>
          </span>
          <ChevronRight className="h-[1.125rem] w-[1.125rem] shrink-0 text-raspberry/90" strokeWidth={2.25} aria-hidden />
        </Link>

        <div className="mt-4 flex items-start gap-2.5">
          <ShieldCheck
            className="mt-0.5 h-[1.125rem] w-[1.125rem] shrink-0 text-raspberry"
            strokeWidth={1.75}
            aria-hidden
          />
          <p className="text-[0.8125rem] leading-[1.5] text-ink-muted">
            Your money stays yours. Withdraw to your bank when you&apos;re ready.
          </p>
        </div>

        <div className="relative mt-7 overflow-hidden rounded-[1.25rem] border border-border/25 bg-card px-5 py-[1.125rem] shadow-card">
          <BalanceCardAccent />
          <div className="relative flex items-center gap-1.5">
            <span className="text-[0.8125rem] text-ink-muted">Total balance</span>
            <Eye className="h-3.5 w-3.5 text-ink-muted/70" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="relative mt-2 text-[2rem] font-semibold leading-none tracking-[-0.02em] text-foreground">
            $0.00
          </p>
          <p className="relative mt-2 text-[0.8125rem] text-ink-muted">Money available</p>
        </div>

        <div className="mt-4 flex items-start gap-3.5 rounded-[1.25rem] border border-rose/15 bg-[#FEF6F8] px-4 py-[1.125rem]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose/90 text-raspberry">
            <Bookmark className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[0.8125rem] leading-[1.5] text-ink-muted">
              Your first savings goal will appear here.
            </p>
          </div>
        </div>
      </div>

      <AppTabBar active="home" />
    </div>
  );
}
