import {
  Check,
  ChevronRight,
  CircleDollarSign,
  Landmark,
  Shield,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import piaMascot from "@/assets/pia-raspberry.png";

const valueProps = [
  {
    Icon: Sprout,
    title: "Earn yield",
    description: "Your money can grow over time.",
  },
  {
    Icon: Target,
    title: "Set goals",
    description: "Create savings goals for what matters most.",
  },
  {
    Icon: Shield,
    title: "You're in control",
    description: "Move your money anytime, always your choice.",
  },
] as const;

const steps = [
  {
    Icon: Landmark,
    step: 1,
    title: "Add USD",
    description: "Add funds from your bank.",
  },
  {
    Icon: CircleDollarSign,
    step: 2,
    title: "Convert to USDC",
    description: "Convert to USDC, earn yield.",
  },
  {
    Icon: Sparkles,
    step: 3,
    title: "Earn and access",
    description: "USDC earns the yield. Cash out to your bank any time.",
  },
] as const;

const builtForYou = ["No lock ups", "Withdraw anytime", "Full transparency"] as const;

function BuiltForYouIllustration() {
  return (
    <svg
      viewBox="0 0 96 124"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-[7.75rem] w-[5.5rem] shrink-0"
      aria-hidden
    >
      {/* Sparkle near head */}
      <path
        d="M63 16 64.2 19.2 67.4 20.4 64.2 21.6 63 24.8 61.8 21.6 58.6 20.4 61.8 19.2 63 16Z"
        fill="currentColor"
        className="text-raspberry/80"
      />

      {/* Long flowing hair — left */}
      <path
        d="M48 10c-12 0-20 6-23 16-2 7-2 16 1 26 2 8 5 16 9 24"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        className="text-raspberry/55"
      />
      <path
        d="M34 22c-5 10-6 22-3 34 2 8 5 15 9 22"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        className="text-raspberry/45"
      />
      <path
        d="M26 38c1 12 4 24 9 36"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="text-raspberry/35"
      />

      {/* Long flowing hair — right */}
      <path
        d="M48 10c12 0 20 6 23 16 2 7 2 16-1 26-2 8-5 16-9 24"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        className="text-raspberry/55"
      />
      <path
        d="M62 22c5 10 6 22 3 34-2 8-5 15-9 22"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        className="text-raspberry/45"
      />
      <path
        d="M70 38c-1 12-4 24-9 36"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="text-raspberry/35"
      />

      {/* Face */}
      <path
        d="M48 24c-9.5 0-16.5 6.5-16.5 15.5 0 10.5 7 17.5 16.5 17.5S64.5 50 64.5 39.5C64.5 30.5 57.5 24 48 24Z"
        stroke="currentColor"
        strokeWidth="1.45"
        className="text-raspberry/80"
      />

      {/* Hair framing cheeks */}
      <path
        d="M31.5 34c-1.5 7-1 15 2 23M64.5 34c1.5 7 1 15-2 23"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        className="text-raspberry/50"
      />

      {/* Closed eyes */}
      <path
        d="M37.5 38.5c2.2-1.8 4.5-1.8 6.5 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        className="text-raspberry"
      />
      <path
        d="M52 38.5c2.2-1.8 4.5-1.8 6.5 0"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        className="text-raspberry"
      />

      {/* Serene smile */}
      <path
        d="M40 48.5c2.8 2.2 6.2 2.2 9 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-raspberry"
      />

      {/* Neck */}
      <path
        d="M48 57v8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-raspberry/70"
      />

      {/* Shoulders */}
      <path
        d="M26 78c6-6 14-9 22-9s16 3 22 9"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        className="text-raspberry/70"
      />

      {/* Left arm and hand */}
      <path
        d="M30 76c4 8 8 14 14 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-raspberry/75"
      />
      <path
        d="M36 92c2.5 1.5 5 2 7.5 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-raspberry/70"
      />

      {/* Right arm and hand */}
      <path
        d="M66 76c-4 8-8 14-14 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        className="text-raspberry/75"
      />
      <path
        d="M60 92c-2.5 1.5-5 2-7.5 1.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="text-raspberry/70"
      />

      {/* Heart — cupped by both hands */}
      <path
        d="M48 93c-7.5-6-10.5-11.5-10.5-15.5 0-4 3-7 6.5-7 2.8 0 5.2 1.6 6.5 3.8 1.3-2.2 3.7-3.8 6.5-3.8 3.5 0 6.5 3 6.5 7 0 4-3 9.5-10.5 15.5Z"
        fill="currentColor"
        className="text-raspberry"
      />
    </svg>
  );
}

export function YoureInScreen() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background">
      <div className="app-welcome-bg" aria-hidden />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-3">
          <header className="relative pt-1">
            <div className="absolute left-0 top-2 flex items-center gap-1 text-raspberry">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              <Sparkles className="h-2.5 w-2.5 opacity-70" strokeWidth={2} aria-hidden />
            </div>
            <img
              src={piaMascot}
              alt=""
              className="absolute right-0 top-1 h-9 w-9 rounded-full object-cover ring-2 ring-background"
            />

            <div className="mx-auto flex max-w-[18rem] flex-col items-center text-center">
              <p className="font-display text-[1.35rem] tracking-tight text-berry">Olimpia</p>
              <h1 className="mt-3 font-display text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
                You&apos;re in!
              </h1>
              <p className="mt-3 text-[0.8125rem] leading-[1.45] text-ink-muted">
                Simple access to decentralized finance
                <br />
                so you can save, grow, and reach your goals.
              </p>
            </div>
          </header>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {valueProps.map(({ Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-raspberry/35 bg-card/80 text-raspberry">
                  <Icon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="mt-2 text-[0.6875rem] font-semibold leading-tight text-raspberry">
                  {title}
                </p>
                <p className="mt-1 text-[0.625rem] leading-snug text-ink-muted">{description}</p>
              </div>
            ))}
          </div>

          <section className="mt-8">
            <h2 className="text-center text-[0.9375rem] font-semibold text-foreground">
              Here&apos;s how it works
            </h2>
            <div className="mt-4 flex items-start justify-between gap-0.5">
              {steps.map(({ Icon, step, title, description }, index) => (
                <div key={title} className="contents">
                  <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-ink-muted">
                      <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-raspberry text-[0.5625rem] font-bold text-white">
                      {step}
                    </span>
                    <p className="mt-1.5 text-[0.6875rem] font-semibold leading-tight text-foreground">
                      {title}
                    </p>
                    <p className="mt-1 text-[0.5625rem] leading-snug text-ink-muted">
                      {description}
                    </p>
                  </div>
                  {index < steps.length - 1 ? (
                    <ChevronRight
                      className="mt-3 h-3.5 w-3.5 shrink-0 text-ink-muted/25"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-2xl bg-rose/55 px-3 py-4">
            <div className="flex items-center gap-2">
              <BuiltForYouIllustration />
              <div className="min-w-0 flex-1">
                <h3 className="text-[0.875rem] font-semibold text-foreground">Built for you</h3>
                <ul className="mt-2.5 space-y-1.5">
                  {builtForYou.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-raspberry text-white">
                        <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />
                      </span>
                      <span className="text-[0.6875rem] font-medium text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>

        <div className="shrink-0 space-y-2.5 border-t border-border/30 bg-background/95 px-5 pb-4 pt-3 backdrop-blur-sm">
          <Link
            to="/app-preview/add-funds"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-raspberry text-[0.875rem] font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            Add funds and start earning
          </Link>
          <Link
            to="/app-preview/home"
            className="flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-card text-[0.875rem] font-semibold text-foreground transition hover:border-foreground/20"
          >
            Explore the app
          </Link>
          <p className="flex items-start justify-center gap-1.5 px-1 text-center text-[0.5625rem] leading-snug text-ink-muted">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-ink-muted/70" aria-hidden />
            <span>
              Olimpia provides access to third party financial services. Yield is variable and not
              guaranteed.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
