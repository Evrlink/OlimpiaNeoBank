import { Bookmark, ChevronRight, Eye, Plus, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  PreviewTabShell,
  previewCallout,
  previewCardElevated,
  previewIconCircle,
} from "./preview-chrome";

function BalanceCardAccent() {
  return (
    <svg
      viewBox="0 0 160 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none absolute -bottom-1 right-0 h-[4.75rem] w-[7.5rem] text-raspberry/15"
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
    <PreviewTabShell active="home">
      <header className="flex items-center justify-between">
        <p className="text-body-sm text-ink-muted">Hi Sarah ✨</p>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raspberry text-body-sm font-semibold text-white ring-2 ring-background"
          aria-hidden
        >
          SA
        </span>
      </header>

      <div className="mt-6">
        <h1 className="text-h2 font-semibold text-foreground">
          Let&apos;s get <span className="font-display italic font-normal">started.</span>
        </h1>
        <p className="mt-3 max-w-[22rem] text-body-sm text-ink-muted">
          Add money to begin building toward the life you choose.
        </p>
      </div>

      <Link
        to="/app-preview/add-funds"
        className={`mt-6 flex w-full items-center gap-3 ${previewCallout} px-4 py-4 text-left transition hover:border-rose/30`}
      >
        <span className={previewIconCircle}>
          <Plus className="h-5 w-5" strokeWidth={2.25} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-body-sm font-semibold text-raspberry">Add money</span>
          <span className="mt-1 block text-body-sm text-ink-muted">
            Secure transfer to your balance
          </span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-raspberry/90" strokeWidth={2.25} aria-hidden />
      </Link>

      <div className="mt-4 flex items-start gap-2.5">
        <ShieldCheck
          className="mt-0.5 h-5 w-5 shrink-0 text-raspberry"
          strokeWidth={1.75}
          aria-hidden
        />
        <p className="text-body-sm text-ink-muted">
          Your money stays yours. Withdraw to your bank when you&apos;re ready.
        </p>
      </div>

      <div className={`relative mt-6 overflow-hidden ${previewCardElevated} px-5 py-4`}>
        <BalanceCardAccent />
        <div className="relative flex items-center gap-1.5">
          <span className="text-body-sm text-ink-muted">Total balance</span>
          <Eye className="h-3.5 w-3.5 text-ink-muted/70" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="relative mt-2 text-h1 font-semibold text-foreground">$0.00</p>
        <p className="relative mt-2 text-body-sm text-ink-muted">Money available</p>
      </div>

      <div className={`mt-4 flex items-start gap-3 ${previewCallout} px-4 py-4`}>
        <span className={previewIconCircle}>
          <Bookmark className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-body-sm text-ink-muted">
            Your first savings goal will appear here.
          </p>
        </div>
      </div>
    </PreviewTabShell>
  );
}
