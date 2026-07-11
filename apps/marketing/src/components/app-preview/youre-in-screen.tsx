/**
 * You're in — post-auth confirmation.
 * Polished: headline + value props + how it works + slim Built for you + Start earning.
 */
import { Check, ChevronRight, Shield, Sprout, Target } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppPreviewWordmark } from "./app-preview-wordmark";

const valueProps = [
  { Icon: Sprout, title: "Earn yield" },
  { Icon: Target, title: "Set goals" },
  { Icon: Shield, title: "You're in control" },
] as const;

const steps = ["Add money", "Earn yield", "Grow money"] as const;

const builtForYou = ["No lockups", "Withdraw anytime", "Higher yields than your bank"] as const;

export function YoureInScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-4">
          <AppPreviewWordmark />

          <div className="mx-auto mt-8 max-w-[20rem] text-center">
            <h1 className="text-h2 font-semibold text-foreground">
              Simple access to decentralized finance.
            </h1>
            <p className="mt-3 text-body-sm text-ink-muted">
              Save, grow, and stay in control.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-3">
            {valueProps.map(({ Icon, title }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-raspberry/30 bg-card text-raspberry">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="mt-2.5 text-caption font-semibold text-foreground">{title}</p>
              </div>
            ))}
          </div>

          <section className="mt-10">
            <h2 className="text-center text-body font-semibold text-foreground">
              How it works
            </h2>
            <div className="mt-5 flex items-center justify-center gap-1">
              {steps.map((label, index) => (
                <div key={label} className="contents">
                  <p className="min-w-0 flex-1 text-center text-caption font-medium text-foreground">
                    {label}
                  </p>
                  {index < steps.length - 1 ? (
                    <ChevronRight
                      className="h-3.5 w-3.5 shrink-0 text-ink-muted/40"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-2xl border border-border/40 bg-card px-4 py-4">
            <h3 className="text-body-sm font-semibold text-foreground">Built for you</h3>
            <ul className="mt-3 space-y-2.5">
              {builtForYou.map((item) => (
                <li key={item} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-raspberry text-white">
                    <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-body-sm text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border/40 bg-background/95 px-6 pb-4 pt-3 backdrop-blur-sm">
          <Link
            to="/app-preview/add-funds"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-raspberry text-body-sm font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            Start earning
          </Link>
          <Link
            to="/app-preview/home"
            className="block text-center text-body-sm font-medium text-ink-muted transition hover:text-foreground"
          >
            Explore
          </Link>
          <p className="px-1 text-center text-caption text-ink-muted">
            Yield is variable and not guaranteed.
          </p>
        </div>
      </div>
    </div>
  );
}
