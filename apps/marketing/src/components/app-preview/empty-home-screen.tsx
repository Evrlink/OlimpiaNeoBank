import { ArrowDownLeft, ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppTabBar } from "./app-tab-bar";

export function EmptyHomeScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-body-sm text-ink-muted">Hi Sarah ✨</p>
            <p className="text-h3 font-semibold text-foreground">Sarah</p>
          </div>
          <div
            className="h-10 w-10 rounded-full bg-gradient-to-br from-rose to-raspberry/80 ring-2 ring-background"
            aria-hidden
          />
        </header>

        <div className="mt-6">
          <h1 className="text-h2 font-semibold tracking-tight text-foreground">Let&apos;s get started.</h1>
          <p className="mt-2 text-body text-ink-muted">
            Add funds to begin building toward the life you choose.
          </p>
        </div>

        <Link
          to="/app-preview/add-funds"
          className="mt-5 flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 text-left shadow-card transition hover:border-border"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose/70 text-raspberry">
            <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block text-body font-semibold text-foreground">Add money</span>
            <span className="mt-0.5 block text-body-sm text-ink-muted">
              Secure transfer to your balance
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-ink-muted" aria-hidden />
        </Link>

        <p className="mt-3 text-body-sm text-ink-muted">
          Once you add funds, your balance can earn over time.
        </p>
        <p className="mt-1 text-body-sm text-ink-muted/80">
          Your money stays yours — withdraw to your bank when you&apos;re ready.
        </p>

        <p className="mt-4 text-body-sm text-ink-muted">Money available · $0.00</p>

        <div className="mt-5 flex gap-6 opacity-80">
          {[
            { Icon: ArrowUpRight, label: "Send" },
            { Icon: ArrowDownLeft, label: "Receive" },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose/70 text-raspberry">
                <Icon className="h-4 w-4" strokeWidth={2.5} aria-hidden />
              </span>
              <span className="text-body-sm text-ink-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-5">
            <p className="text-body-sm text-ink-muted">Your first savings goal will appear here</p>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-5">
            <p className="text-body-sm text-ink-muted">
              Growth earnings will show here when you&apos;re ready
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border/40 bg-surface/50 px-4 py-8 text-center">
          <p className="text-body font-medium text-foreground">No activity yet</p>
          <p className="mt-1 text-body-sm text-ink-muted">Your first deposit will show up here</p>
        </div>
      </div>

      <AppTabBar active="home" />
    </div>
  );
}
