import { ArrowLeft, Building2, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppPreviewTopBar } from "./app-preview-wordmark";

export function AddFundsScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-6 pt-3">
        <AppPreviewTopBar
          leftSlot={
            <Link
              to="/app-preview/home"
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:bg-surface/80"
              aria-label="Back to Home"
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </Link>
          }
        />

        <h1 className="mt-6 text-h2 font-semibold text-foreground">Add funds</h1>
        <p className="mt-2 text-body text-ink-muted">
          Choose how you&apos;d like to add funds to your Olimpia balance.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/40 bg-rose-soft/50 px-4 py-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-raspberry" aria-hidden />
          <p className="text-body-sm text-ink-muted">
            Secure transfer. Your money stays yours — you&apos;ll see your updated balance here
            when it&apos;s complete.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 text-left shadow-card ring-2 ring-raspberry/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose/70 text-raspberry">
              <Building2 className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-body font-semibold text-foreground">Bank transfer</span>
              <span className="mt-0.5 block text-body-sm text-ink-muted">
                Add from your linked bank account
              </span>
            </span>
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-4 text-left transition hover:border-border"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose/70 text-raspberry">
              <CreditCard className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block text-body font-semibold text-foreground">Debit card</span>
              <span className="mt-0.5 block text-body-sm text-ink-muted">
                Add instantly with your card
              </span>
            </span>
          </button>
        </div>

        <p className="mt-6 text-caption text-ink-muted">
          Yield is variable and not guaranteed. You can choose to put money to work after your
          balance is funded.
        </p>

        <button
          type="button"
          className="mt-8 flex h-14 w-full items-center justify-center rounded-full bg-raspberry text-body font-semibold text-white shadow-soft"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
