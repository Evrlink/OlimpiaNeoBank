/**
 * Hero device mockup (CSS titanium full case + UI).
 * Intentional exception to the marketing type scale: arbitrary text-[Npx]
 * sizes simulate a real phone UI at fixed scale.
 * Screen content mirrors the marketed Home reference mock.
 */
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  Home as HomeIcon,
  PiggyBank,
  Plus,
  User,
} from "lucide-react";
import piaIllo from "@/assets/pia-raspberry.png";
import {
  HeroPhoneDevice,
  useHeroPhoneBalanceCount,
} from "@/components/hero-phone-device";

const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;

export function HeroPhoneMockup() {
  const [motionEnabled, setMotionEnabled] = useState(false);
  const balance = useHeroPhoneBalanceCount(motionEnabled, 2450, 2670);

  useEffect(() => {
    setMotionEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  return (
    <HeroPhoneDevice>
      <div className="hero-phone-float-accent" aria-hidden>
        <div className="hero-phone-float-card">
          <img
            src={piaIllo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-background"
          />
          <p className="text-body-sm leading-snug text-foreground">
            <span className="font-semibold text-raspberry">+4.2%</span>
            <span className="text-ink-muted"> yield on savings</span>
          </p>
        </div>
      </div>

      <div className="hero-iphone relative mx-auto w-fit">
        <div className="hero-iphone-chassis relative">
          <span className="hero-iphone-btn hero-iphone-btn--silent" aria-hidden />
          <span className="hero-iphone-btn hero-iphone-btn--vol-up" aria-hidden />
          <span className="hero-iphone-btn hero-iphone-btn--vol-down" aria-hidden />
          <span className="hero-iphone-btn hero-iphone-btn--power" aria-hidden />
          <div className="hero-iphone-bezel">
            <div className="hero-phone-screen relative flex flex-col overflow-hidden bg-background">
              {/* Status bar */}
              <div className="relative z-[1] flex h-9 shrink-0 items-center justify-between px-5 pt-2 text-[10px] font-semibold text-foreground">
                <span>9:41</span>
                <div className="absolute left-1/2 top-1.5 h-[0.72rem] w-[3.15rem] -translate-x-1/2 rounded-full bg-[#1c1c1e]" />
                <div className="flex items-center gap-1">
                  <svg width="12" height="8" viewBox="0 0 14 9" fill="currentColor" aria-hidden>
                    <rect x="0" y="6" width="2" height="3" rx="0.5" />
                    <rect x="3.5" y="4" width="2" height="5" rx="0.5" />
                    <rect x="7" y="2" width="2" height="7" rx="0.5" />
                    <rect x="10.5" y="0" width="2" height="9" rx="0.5" />
                  </svg>
                  <svg width="16" height="9" viewBox="0 0 18 10" fill="none" aria-hidden>
                    <rect x="0.5" y="0.5" width="14" height="9" rx="2" stroke="currentColor" opacity="0.5" />
                    <rect x="2" y="2" width="11" height="6" rx="1" fill="currentColor" />
                    <rect x="15.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.5" />
                  </svg>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-1 pt-0.5">
                {/* Header — centered wordmark + bell */}
                <div className="relative flex h-7 items-center justify-center">
                  <p className="font-display text-[16px] font-semibold tracking-tight text-berry">
                    Olimpia
                  </p>
                  <Bell
                    className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-berry"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                </div>

                {/* Positive balance card */}
                <div className="mt-2.5 rounded-[1.15rem] bg-card px-3.5 py-3 text-center shadow-[0_6px_18px_-10px_rgba(47,47,47,0.28)] ring-1 ring-border/40">
                  <p className="text-[10px] font-medium text-ink-muted">Positive Balance</p>
                  <p className="hero-phone-balance mt-0.5 text-[25px] font-semibold tracking-tight text-[#2BB673]">
                    +${balance.toLocaleString("en-US")}.00
                  </p>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="mt-2.5 inline-flex h-8 items-center justify-center gap-1 rounded-full bg-berry px-5 text-[11px] font-semibold text-white"
                  >
                    <Plus className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                    Add Balance
                  </button>
                </div>

                {/* Chart */}
                <div className="mt-3 min-h-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-foreground">Balance</p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-card px-2 py-0.5 text-[9px] font-medium text-ink-muted ring-1 ring-border/50">
                      All balance
                      <ChevronDown className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
                    </span>
                  </div>

                  <svg viewBox="0 0 260 78" className="hero-phone-chart mt-1.5 h-[4.5rem] w-full" aria-hidden>
                    <defs>
                      <linearGradient id="heroChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E54B7A" stopOpacity="0.28" />
                        <stop offset="55%" stopColor="#E54B7A" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#E54B7A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      className="hero-phone-chart-fill"
                      d="M4 58 C28 56 42 42 62 46 S98 62 118 40 S152 18 178 28 S210 48 236 24 S250 16 256 18 L256 78 L4 78 Z"
                      fill="url(#heroChartFill)"
                    />
                    <path
                      className="hero-phone-chart-line"
                      d="M4 58 C28 56 42 42 62 46 S98 62 118 40 S152 18 178 28 S210 48 236 24 S250 16 256 18"
                      fill="none"
                      stroke="#6F2B46"
                      strokeWidth="2.1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle className="hero-phone-chart-dot" cx="256" cy="18" r="3.75" fill="#6F2B46" />
                    <circle cx="256" cy="18" r="6.5" fill="#6F2B46" fillOpacity="0.16" />
                  </svg>

                  <div className="mt-0.5 flex items-center justify-between px-0.5 text-[9px] font-medium text-ink-muted">
                    {RANGES.map((range) => (
                      <span
                        key={range}
                        className={
                          range === "1W"
                            ? "hero-phone-range-pill inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-soft px-1.5 text-berry"
                            : undefined
                        }
                      >
                        {range}
                      </span>
                    ))}
                  </div>

                  {/* Accounts */}
                  <div className="hero-phone-accounts mt-2 space-y-1.5">
                    <div className="flex items-center gap-2.5 rounded-2xl bg-card px-2.5 py-2 ring-1 ring-border/45">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose text-[10px] font-semibold text-berry ring-1 ring-berry/20">
                        G
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-foreground">
                          Gelia Savings
                        </p>
                        <p className="text-[9px] text-ink-muted">USDC Yield</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-semibold text-[#2BB673]">+$670.00</p>
                        <p className="hero-phone-secondary-gain text-[9px] font-medium text-[#2BB673]/80">
                          +$220.00
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-2xl bg-card px-2.5 py-2 ring-1 ring-border/45">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose text-[10px] font-semibold text-berry ring-1 ring-berry/20">
                        T
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-foreground">
                          Titaniai
                        </p>
                        <p className="text-[9px] text-ink-muted">Savings</p>
                      </div>
                      <p className="text-[11px] font-semibold text-[#2BB673]">+$300.00</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab bar with center + */}
              <div className="relative shrink-0 border-t border-border/35 bg-card/90 px-1.5 pb-2.5 pt-1.5">
                <div className="grid grid-cols-5 items-end">
                  <TabItem Icon={HomeIcon} label="Home" active />
                  <TabItem Icon={CreditCard} label="Card" />
                  <div className="flex flex-col items-center pb-0.5">
                    <span className="-mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-berry text-white shadow-[0_8px_16px_-8px_rgba(111,43,70,0.7)]">
                      <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                    </span>
                  </div>
                  <TabItem Icon={PiggyBank} label="Save" />
                  <TabItem Icon={User} label="Profile" />
                </div>
                <div className="mx-auto mt-1.5 h-1 w-20 rounded-full bg-foreground/15" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </div>
    </HeroPhoneDevice>
  );
}

function TabItem({
  Icon,
  label,
  active,
}: {
  Icon: typeof HomeIcon;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 pb-0.5">
      <Icon
        className={`h-[15px] w-[15px] ${active ? "text-berry" : "text-ink-muted/65"}`}
        strokeWidth={2}
        aria-hidden
      />
      <span
        className={`text-[7.5px] ${
          active ? "font-semibold text-berry" : "text-ink-muted/65"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
