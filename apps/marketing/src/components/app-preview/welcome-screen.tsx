import { BookOpen, CreditCard, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppPreviewWordmark } from "./app-preview-wordmark";

const sparkles = [
  { top: "12%", left: "18%" },
  { top: "22%", left: "72%" },
  { top: "34%", left: "44%" },
  { top: "16%", left: "58%" },
];

const features = [
  { Icon: Sparkles, label: "Earn yield on USDC" },
  { Icon: CreditCard, label: "Spend anywhere Visa is accepted" },
  { Icon: BookOpen, label: "Learn DeFi on your terms" },
] as const;

export function WelcomeScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />
      {sparkles.map((pos, i) => (
        <span
          key={i}
          className="app-welcome-sparkle"
          style={{ top: pos.top, left: pos.left }}
          aria-hidden
        />
      ))}

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-6 pt-4">
        <AppPreviewWordmark />

        <div className="mt-10 flex flex-col">
          <p className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.12em] text-raspberry">
            Financial freedom, designed for women
          </p>

          <h1 className="mt-5 text-h1 font-semibold leading-[1.15] tracking-[-0.015em] text-foreground">
            Better than a checking account,{" "}
            <span className="font-display italic font-normal text-foreground">
              everything your bank can&apos;t do.
            </span>
          </h1>

          <ul className="mt-6 space-y-4">
            {features.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose/70 text-raspberry">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
                </span>
                <span className="text-body font-medium leading-snug text-foreground">{label}</span>
              </li>
            ))}
          </ul>

          <p className="mt-6 text-body-sm font-semibold text-berry">
            More choices. More freedom.
          </p>

          <p className="mt-4 text-body-lg text-ink-muted">
            Save, spend, and grow your money with confidence.
          </p>
        </div>

        <div className="relative z-[1] mt-auto space-y-3 pt-6">
          <Link
            to="/app-preview/auth"
            className="flex h-14 w-full items-center justify-center rounded-full bg-raspberry text-body font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            to="/app-preview/auth"
            search={{ mode: "signin" }}
            className="flex h-14 w-full items-center justify-center rounded-full border border-border bg-card text-body font-semibold text-foreground transition hover:border-foreground/20"
          >
            Sign in
          </Link>
          <p className="text-center text-caption text-ink-muted">
            <Link to="/privacy" className="hover:text-foreground">
              Terms
            </Link>
            {" · "}
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
