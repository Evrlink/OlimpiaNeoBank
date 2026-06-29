import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  TrendingUp,
  GraduationCap,
  Heart,
  MessageCircle,
  Plus,
  ArrowUpRight,
  Send,
  ArrowLeftRight,
  MoreHorizontal,
  Home as HomeIcon,
  PiggyBank as SaveIcon,
  Shield,
  User,
  Coffee,
  Briefcase,
  Target as TargetIcon,
  Wallet,
  Layers,
  LayoutGrid,
  Fuel,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import piaIllo from "@/assets/pia-raspberry.png";
import eiffel from "@/assets/eiffel.jpg";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HeroPaperBackground } from "@/components/hero-paper-background";
import {
  FAQ_ITEMS,
  OLIMPIA_DEFINITION,
  getHomepageStructuredData,
  pageSeoHead,
} from "@/lib/seo";
import { SiteFooter } from "@/components/site-footer";
import { submitWaitlistEmail } from "@/lib/waitlist";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = pageSeoHead("/");
    return {
      meta: [
        { title: "Olimpia. Financial freedom designed for women" },
        {
          name: "description",
          content: OLIMPIA_DEFINITION,
        },
        { "script:ld+json": getHomepageStructuredData() },
        ...seo.meta,
      ],
      links: [...seo.links],
    };
  },
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <main>
        <Hero />
        <TrustStrip />
        <GoalsSection />
        <EmpoweringCards />
        <PiaSection />
        <WhyUsdcSection />
        <Faq />
        <StayTunedSection />
      </main>
      <SiteFooter />
      <WaitlistModal />
    </div>
  );
}

function openWaitlist() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("olimpia:open-waitlist"));
  }
}

/* ---------- NAV ---------- */
const NAV_SECTIONS = ["features", "how", "pia", "faq", "about"] as const;

const navLinks = [
  { href: "#features", label: "Features", id: "features" },
  { href: "#how", label: "How It Works", id: "how" },
  { href: "#pia", label: "Pia", id: "pia" },
  { href: "#about", label: "About", id: "about" },
  { href: "#faq", label: "FAQ", id: "faq" },
] as const;

function Nav() {
  const activeSection = useActiveSection(NAV_SECTIONS);

  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-12">
        <Link to="/" className="font-display text-[1.65rem] leading-[1.3] tracking-tight text-berry">
          Olimpia
        </Link>
        <nav className="hidden items-center gap-8 text-body-sm text-foreground/80 md:flex">
          {navLinks.map(({ href, label, id }) => (
            <a
              key={id}
              href={href}
              className={cn(
                "relative transition hover:text-foreground",
                activeSection === id && "nav-link-active",
              )}
            >
              {label}
            </a>
          ))}
        </nav>
        <button
          type="button"
          onClick={openWaitlist}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-berry px-4 text-body-sm font-semibold text-white transition hover:opacity-90"
        >
          Download App
        </button>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  return (
    <section className="hero-section relative isolate overflow-hidden">
      <HeroPaperBackground />
      <div className="relative z-[1] mx-auto grid max-w-7xl items-center gap-10 px-6 pt-14 pb-8 md:grid-cols-2 md:items-center md:gap-14 md:px-12 md:pt-20 md:pb-10 lg:pb-12">
        <div className="max-w-xl lg:max-w-2xl">
          <p className="marketing-eyebrow hero-eyebrow">
            Helping women participate in DeFi
          </p>
          <h1 className="mt-6 text-h1 font-medium tracking-normal text-berry md:text-h1 lg:text-display-md">
            You belong here
          </h1>
          <p className="mt-6 max-w-lg hero-copy">
            DeFi shouldn&apos;t feel confusing or out of reach. Olimpia was created to help women participate in decentralized finance. Discover new opportunities beyond a traditional bank. Set savings goals, explore optional yield on USDC, and learn with Pia, your AI money bestie.
          </p>
          <p className="mt-6 max-w-lg marketing-eyebrow hero-eyebrow">
            More choices. More freedom.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={openWaitlist}
              className="inline-flex h-14 min-w-[11.5rem] items-center justify-center gap-2 rounded-full bg-berry px-8 text-body font-semibold text-white shadow-soft transition hover:opacity-90"
            >
              Download App
            </button>
            <a
              href="#features"
              className="inline-flex h-14 min-w-[11.5rem] items-center justify-center gap-2 rounded-full border border-foreground/15 bg-card px-8 text-body font-semibold text-foreground shadow-soft transition hover:border-foreground/30"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="hero-phone-stage relative z-20 flex justify-center max-md:py-10 md:justify-end">
          <div className="hero-phone-wrap relative">
            <div className="hero-phone-shadow-contact" aria-hidden />
            <div className="hero-phone-shadow-ambient" aria-hidden />
            <div className="hero-phone-device">
              <div className="hero-phone-float-accent" aria-hidden>
                <div className="hero-phone-float-card">
                  <img src={piaIllo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-background" />
                  <p className="text-body-sm leading-snug text-foreground">
                    <span className="font-semibold text-raspberry">+4.2%</span>
                    <span className="text-ink-muted"> yield on savings</span>
                  </p>
                </div>
              </div>
              <PhoneMockup variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}





/* ---------- PHONE MOCKUP (pure CSS) ----------
 * Intentional exception to the design type scale:
 * the arbitrary text-[Npx] sizes below simulate a real phone UI at fixed scale.
 * Do not migrate them to the marketing type tokens. */
function PhoneMockup({ variant = "full" }: { variant?: "hero" | "full" }) {
  const isHero = variant === "hero";

  const tabItems = [
    { Icon: HomeIcon, label: "Home", active: true },
    { Icon: CreditCard, label: "Card" },
    { Icon: SaveIcon, label: "Save" },
    { Icon: User, label: "Pia" },
    { Icon: Shield, label: "Learn" },
  ];

  return (
    <div className="relative w-full">
      {/* Phone frame */}
      <div
        className={`relative rounded-[3.25rem] bg-[#111] p-[10px] ${
          isHero
            ? "shadow-[0_14px_28px_-12px_rgba(47,47,47,0.5),0_36px_64px_-24px_rgba(47,47,47,0.28),0_22px_48px_-20px_rgba(229,75,122,0.16)]"
            : "shadow-[0_40px_80px_-20px_rgba(47,47,47,0.28),0_15px_40px_-15px_rgba(229,75,122,0.22)]"
        }`}
      >
        {isHero && (
          <>
            <div
              className="pointer-events-none absolute -left-[2px] top-[28%] h-8 w-[3px] rounded-l-sm bg-[#2a2a2a]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -left-[2px] top-[36%] h-12 w-[3px] rounded-l-sm bg-[#2a2a2a]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-[2px] top-[22%] h-16 w-[3px] rounded-r-sm bg-[#2a2a2a]"
              aria-hidden
            />
          </>
        )}
        <div
          className="pointer-events-none absolute inset-0 rounded-[3.25rem] ring-1 ring-inset ring-white/[0.12]"
          aria-hidden
        />
        <div
          className={`relative overflow-hidden rounded-[2.75rem] bg-background ${
            isHero ? "hero-phone-screen flex flex-col" : ""
          }`}
        >
          {/* Status bar */}
          <div className="relative flex h-11 items-center justify-between px-7 pt-3 text-[11px] font-semibold text-foreground">
            <span>9:41</span>
            {/* Notch / dynamic island */}
            <div className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-[#111]" />
            <div className="flex items-center gap-1.5">
              <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor"><rect x="0" y="6" width="2" height="3" rx="0.5"/><rect x="3.5" y="4" width="2" height="5" rx="0.5"/><rect x="7" y="2" width="2" height="7" rx="0.5"/><rect x="10.5" y="0" width="2" height="9" rx="0.5"/></svg>
              <svg width="18" height="10" viewBox="0 0 18 10" fill="none"><rect x="0.5" y="0.5" width="14" height="9" rx="2" stroke="currentColor" opacity="0.5"/><rect x="2" y="2" width="11" height="6" rx="1" fill="currentColor"/><rect x="15.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.5"/></svg>
            </div>
          </div>

          {/* Screen content */}
          <div className="relative px-6 pt-3 pb-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-ink-muted">Good morning</p>
                <p className="text-[15px] font-semibold text-foreground">Jennifer</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-rose to-raspberry/60 ring-2 ring-background" />
            </div>

            {/* Balance card */}
            <div className="mt-6 rounded-2xl bg-[#111] p-5 text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.18em] text-background/60">
                  Total balance
                </p>
                <span className="text-[10px] text-background/60">USD</span>
              </div>
              <p className="mt-2 text-[28px] font-semibold tracking-tight">
                $4,280<span className="text-background/50">.00</span>
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2 py-0.5 font-medium">
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                  4.2%
                </span>
                <span className="text-background/60">+$280.00 this month</span>
              </div>
            </div>

            {!isHero && (
            <div className="mt-5 grid grid-cols-4 gap-2.5">
              {[
                { Icon: Plus, label: "Add" },
                { Icon: Send, label: "Send" },
                { Icon: ArrowLeftRight, label: "Swap" },
                { Icon: MoreHorizontal, label: "More" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose/70">
                    <Icon className="h-4 w-4 text-raspberry" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium text-foreground/80">{label}</span>
                </div>
              ))}
            </div>
            )}

            {/* Savings goal card */}
            <div
              className={`rounded-2xl border border-border/60 bg-card p-4 ${
                isHero ? "hero-phone-goal-peek mt-5" : "mt-5"
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={eiffel}
                  alt=""
                  width={512}
                  height={512}
                  loading="lazy"
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-foreground">
                      Europe Trip
                    </p>
                    <span className="text-[10px] font-medium text-ink-muted">45%</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-ink-muted">
                    <span className="font-semibold text-foreground">$2,250</span> of $5,000
                  </p>
                  <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                    <div className="h-full w-[45%] rounded-full bg-raspberry" />
                  </div>
                </div>
              </div>
            </div>

            {!isHero && (
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">Recent activity</p>
                <a className="text-[11px] font-medium text-raspberry">See all</a>
              </div>
              <div className="mt-3 space-y-3.5">
                <TxRow Icon={Briefcase} title="Received" sub="Jun 18 · Deposit" amount="+$2,500.00" positive />
                <TxRow Icon={TargetIcon} title="Yield earned" sub="Jun 17 · Yield earned" amount="+$14.00" positive />
                <TxRow Icon={Coffee} title="Blue Bottle Coffee" sub="Today · Cafe" amount="−$5.45" />
              </div>
            </div>
            )}
          </div>

          {isHero && (
            <div className="hero-phone-screen-fade pointer-events-none absolute inset-x-0 bottom-0 z-10" aria-hidden />
          )}

          {!isHero && (
          <div className="grid grid-cols-5 border-t border-border/50 bg-background px-3 pb-5 pt-3">
            {tabItems.map(({ Icon, label, active }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <Icon
                  className={`h-[18px] w-[18px] ${active ? "text-raspberry" : "text-ink-muted/70"}`}
                  strokeWidth={2}
                />
                <span
                  className={`text-[9px] ${
                    active ? "font-semibold text-raspberry" : "text-ink-muted/70"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TxRow({
  Icon,
  title,
  sub,
  amount,
  positive,
}: {
  Icon: typeof Coffee;
  title: string;
  sub: string;
  amount: string;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose/70">
        <Icon className="h-3.5 w-3.5 text-raspberry" strokeWidth={2.2} />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[10px] text-ink-muted">{sub}</p>
      </div>
      <p
        className={`text-xs font-semibold ${positive ? "text-success" : "text-foreground"}`}
      >
        {amount}
      </p>
    </div>
  );
}

/* ---------- TRUST STRIP ---------- */
function TrustStrip() {
  const partners = ["Circle", "Bridge", "Plaid", "Visa", "MoonPay", "Stripe"];
  const loop = [...partners, ...partners];
  return (
    <section className="section-pad border-y border-border/50 bg-surface/60">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
        <ScrollReveal>
          <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
            Built on trusted infrastructure
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-body text-ink-muted">
            Powered by industry-leading providers in security, compliance, and payments.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={110} className="marquee mt-12">
          <div className="marquee-track gap-x-16 md:gap-x-24 opacity-70">
            {loop.map((p, i) => (
              <span
                key={`${p}-${i}`}
                aria-hidden={i >= partners.length}
                className="font-display text-h3 tracking-tight text-foreground/70 shrink-0"
              >
                {p}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------- SECTION 2: GOALS CARDS ---------- */
function GoalsSection() {
  const items = [
    {
      icon: Send,
      title: "Send USDC",
      body: "Send USDC in seconds to anyone anywhere in the world.",
      details:
        "Send USDC in seconds to anyone anywhere in the world.",
    },
    {
      icon: CreditCard,
      title: "Virtual Debit Card",
      body: "Spend anywhere Visa is accepted, earn cash back rewards.",
      details:
        "Spend your stablecoin balance anywhere Visa is accepted. Top up your card from your wallet with a single tap. Use your card for everyday purchases online and in stores.",
    },
    {
      icon: TrendingUp,
      title: "Earn Yield",
      body: "Hold USDC and earn yield. Swap between USDC and USD easily.",
      details:
        "Your balance earns USDC yield while it sits. Olimpia connects you to the same lending markets used by professional investors. No lockups. Withdraw anytime.",
    },
    {
      icon: GraduationCap,
      title: "Learn & Grow",
      body: "Learn with Pia, your AI money bestie.",
      details:
        "You're not on your own. Pia explains saving, USDC, yield, and modern money tools in plain language. Pia offers education to help you decide with confidence, not financial advice.",
    },
  ];
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const toggle = (title: string) =>
    setFlipped((p) => ({ ...p, [title]: !p[title] }));
  return (
    <section id="features" className="section-pad section-bridge-out relative overflow-hidden bg-gradient-to-b from-background via-rose-soft/18 to-background">
      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-h2 font-semibold text-foreground md:text-h1">
            A financial ecosystem, offering more opportunity than your bank
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            Stablecoin payments, virtual debit card, yield on USDC, and learning tools to support your growth.
          </p>
        </ScrollReveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-7">
          {items.map(({ icon: Icon, title, body, details }, index) => {
            const isFlipped = !!flipped[title];
            return (
              <ScrollReveal key={title} delay={index * 100} className="h-full">
              <div
                className="goal-card-shell group relative h-full perspective-1000 md:transition-transform md:duration-300 md:ease-out md:hover:-translate-y-1.5"
              >
                <div
                  className="pointer-events-none invisible flex flex-col items-center px-8 pt-8 pb-9"
                  aria-hidden="true"
                >
                  <div className="h-16 w-16 shrink-0" />
                  <div className="mt-6 h-16 w-full shrink-0 px-1">
                    <h3 className="text-balance text-h3 font-semibold text-foreground line-clamp-2">
                      {title}
                    </h3>
                  </div>
                  <p className="mt-3 text-body text-ink-muted">{body}</p>
                  <span className="mt-6 text-body-sm font-medium">Learn more</span>
                </div>
                <div
                  className={`goal-card-flip absolute inset-0 h-full w-full preserve-3d transition-transform duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${isFlipped ? "rotate-y-180" : ""}`}
                >
                  {/* Front */}
                  <button
                    type="button"
                    onClick={() => toggle(title)}
                    aria-expanded={isFlipped}
                    aria-label={`${title}. Learn more`}
                    className="goal-card-face backface-hidden absolute inset-0 flex h-full w-full cursor-pointer flex-col items-center px-8 pt-8 pb-9 text-center font-inherit text-inherit rounded-[32px] border border-border/30 bg-gradient-to-br from-card via-card to-rose-soft/25 shadow-[0_1px_2px_rgba(47,47,47,0.02),0_18px_40px_-24px_rgba(229,75,122,0.14)] transition-shadow duration-300 ease-out md:group-hover:shadow-[0_4px_10px_rgba(47,47,47,0.05),0_28px_56px_-18px_rgba(229,75,122,0.24)]"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-card ring-2 ring-raspberry/25 shadow-soft">
                      <Icon className="h-7 w-7 text-berry" strokeWidth={1.5} />
                    </div>
                    <div className="mt-6 flex h-16 w-full shrink-0 items-start justify-center px-1">
                      <h3 className="text-balance text-h3 font-semibold text-foreground line-clamp-2">
                        {title}
                      </h3>
                    </div>
                    <p className="mt-3 text-body text-ink-muted">{body}</p>
                    <span className="goal-card-action mt-auto inline-flex shrink-0 items-center pt-6 text-body-sm font-medium text-raspberry">
                      Learn more
                    </span>
                  </button>
                  {/* Back */}
                  <button
                    type="button"
                    onClick={() => toggle(title)}
                    aria-expanded={isFlipped}
                    aria-label={`${title}. Back`}
                    className="goal-card-face backface-hidden rotate-y-180 absolute inset-0 flex w-full cursor-pointer flex-col items-center justify-center rounded-[32px] border border-raspberry/20 bg-rose/30 p-8 text-center font-inherit text-inherit shadow-[0_2px_4px_rgba(47,47,47,0.03),0_28px_60px_-24px_rgba(229,75,122,0.22)] transition-shadow duration-300 ease-out md:group-hover:shadow-[0_6px_14px_rgba(47,47,47,0.06),0_32px_64px_-16px_rgba(229,75,122,0.28)]"
                  >
                    <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-body-sm text-ink-muted">{details}</p>
                    <span className="goal-card-action mt-6 inline-flex items-center text-body-sm font-medium text-raspberry">
                      Back
                    </span>
                  </button>
                </div>
              </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ---------- SECTION 3: WHY USDC ---------- */
function WhyUsdcSection() {
  const benefits = [
    {
      title: "Pegged one-to-one to USD",
      body: "One USDC is designed to equal one U.S. dollar.",
    },
    {
      title: "Move money 24/7",
      body: "Send and receive globally within seconds, anytime.",
    },
    {
      title: "Optional yield through DeFi",
      body: "Access optional yield opportunities through DeFi.",
    },
    {
      title: "Digital dollar you can use online",
      body: "Save, send, and spend in the digital economy.",
    },
  ];

  return (
    <section
      className="section-pad section-bridge-in section-bridge-out relative overflow-hidden bg-gradient-to-br from-background via-rose-soft/12 to-rose-soft/28 md:bg-gradient-to-r md:from-background md:via-rose-soft/12 md:to-rose-soft/28"
      style={
        {
          "--bridge-in-opacity": "0.22",
          "--bridge-out-opacity": "0.16",
        } as CSSProperties
      }
    >
      <div className="relative z-[2] mx-auto grid max-w-7xl items-center gap-12 px-6 md:grid-cols-2 md:gap-16 md:px-12 lg:gap-20">
        <ScrollReveal className="max-w-xl">
          <p className="marketing-eyebrow">
            Money, faster and more flexible
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            USDC
          </h2>
          <p className="mt-6 text-body font-medium text-foreground">
            Your dollars can do more as USDC.
          </p>
          <p className="mt-4 text-body text-ink-muted">
            USDC is a stablecoin pegged 1:1 to the US dollar. Send and receive it within
            seconds, every day, 24/7.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {benefits.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-border/40 bg-card p-4 shadow-soft"
              >
                <h3 className="text-body-sm font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-body-sm text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={160} className="relative flex justify-center md:justify-end">
          <UsdcProductPreview />
        </ScrollReveal>
      </div>
    </section>
  );
}

/* Official USDC symbol geometry with Olimpia raspberry fill. */
function UsdcProductPreview() {
  return (
    <div
      className="relative flex w-[340px] items-center justify-center md:w-[360px]"
      aria-hidden
    >
      <div className="pointer-events-none absolute left-[56%] top-[57%] -z-10 h-8 w-[74%] -translate-x-1/2 rounded-full bg-berry/14 blur-[32px]" />
      <div className="pointer-events-none absolute left-1/2 top-[55%] -z-10 h-5 w-[62%] -translate-x-1/2 rounded-full bg-berry/22 blur-lg" />
      <div className="pointer-events-none absolute left-[46%] top-1/2 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/18 blur-2xl" />
      <div className="usdc-coin-tilt relative">
        <svg
          viewBox="0 0 96 96"
          fill="none"
          className="relative h-72 w-72 drop-shadow-[0_24px_48px_-14px_rgba(111,43,70,0.36)] md:h-80 md:w-80"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
        <path
          d="M48 95C73.9574 95 95 73.9574 95 48C95 22.0426 73.9574 1 48 1C22.0426 1 1 22.0426 1 48C1 73.9574 22.0426 95 48 95Z"
          fill="#E54B7A"
        />
        <path
          d="M56.4609 13.7778V19.8291C68.5341 23.4716 77.3759 34.6928 77.3759 47.9997C77.3759 61.3066 68.5341 72.5278 56.4609 76.1703V82.2216C71.8534 78.4616 83.2509 64.5672 83.2509 47.9997C83.2509 31.4322 71.8534 17.5378 56.4609 13.7778Z"
          fill="white"
        />
        <path
          d="M18.625 47.9997C18.625 34.6928 27.4669 23.4716 39.54 19.8291V13.7778C24.1475 17.5378 12.75 31.4322 12.75 47.9997C12.75 64.5672 24.1475 78.4616 39.54 82.2216V76.1703C27.4669 72.5572 18.625 61.3066 18.625 47.9997Z"
          fill="white"
        />
        <path
          d="M60.6319 54.5506C60.6319 42.5362 41.8025 47.4713 41.8025 40.8325C41.8025 38.4531 43.7119 36.9256 47.3544 36.9256C51.7019 36.9256 53.2 39.0406 53.67 41.89H59.6625C59.1279 36.5426 56.0588 33.1662 50.9382 32.1604V27.4375H45.0632V31.9918C39.4534 32.7062 35.9275 35.973 35.9275 40.8325C35.9275 52.9056 54.7863 48.3819 54.7863 54.9031C54.7863 57.3706 52.4069 59.0156 48.3825 59.0156C43.1244 59.0156 41.3913 56.695 40.745 53.4931H34.8994C35.2781 59.3502 38.8897 63.0159 45.0632 63.9307V68.5625H50.9382V63.9923C56.9633 63.2139 60.6319 59.7089 60.6319 54.5506Z"
          fill="white"
        />
      </svg>
      </div>
    </div>
  );
}

/* ---------- SECTION 5: BEYOND BANKING ---------- */
function EmpoweringCards() {
  const items = [
    {
      icon: Wallet,
      t: "You stay in charge",
      b: "Your wallet belongs to you. When you sign up, Olimpia creates a secure digital wallet only you control. Olimpia can't access, freeze, or move your funds.",
    },
    {
      icon: Layers,
      t: "Complexity Removed",
      b: "Olimpia makes decentralized finance simple. Trusted protocols power saving, spending, and optional USDC yield. No blockchain expertise required.",
    },
    {
      icon: LayoutGrid,
      t: "Everything in one place",
      b: "Save, spend, and explore optional yield from a single app. No juggling wallets, exchanges, or extra tools.",
    },
    {
      icon: Fuel,
      t: "We cover network fees",
      b: "For supported transactions, Olimpia covers network fees so you don't have to. The blockchain stays in the background.",
    },
  ];

  const sizeTemplate = items.reduce((longest, item) =>
    item.b.length > longest.b.length ? item : longest,
  );

  return (
    <section
      id="how"
      className="section-pad section-bridge-in relative overflow-hidden bg-gradient-to-b from-rose-soft/40 via-rose/25 to-rose-soft/20 md:bg-gradient-to-br md:from-rose-soft/35 md:via-rose/30 md:to-rose-soft/45"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,75,122,0.14),transparent_58%)]"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto max-w-7xl px-6 md:px-12">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
            The upside is yours
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            More growth, less complexity, with you in charge. Simple tools that give you easy access
            to decentralized finance (DeFi)
          </p>
        </ScrollReveal>
        <div className="mx-auto mt-12 grid max-w-5xl auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-14 lg:gap-8">
          {items.map(({ icon: Icon, t, b }, index) => (
            <ScrollReveal key={t} delay={index * 100} className="h-full">
              <div className="group relative h-full">
                <div
                  className="pointer-events-none invisible flex flex-col p-9 text-left lg:p-10"
                  aria-hidden="true"
                >
                  <div className="h-16 w-16 shrink-0" />
                  <div className="mt-7 h-[4.5rem] w-full shrink-0">
                    <h3 className="text-h3 font-semibold text-foreground line-clamp-2">
                      {sizeTemplate.t}
                    </h3>
                  </div>
                  <p className="mt-3 text-body text-ink-muted">{sizeTemplate.b}</p>
                </div>
                <div className="absolute inset-0 flex flex-col rounded-[32px] border border-border/30 bg-gradient-to-br from-card via-card to-rose-soft/35 p-9 text-left shadow-[0_1px_2px_rgba(47,47,47,0.02),0_18px_40px_-24px_rgba(229,75,122,0.14)] transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none lg:p-10 md:group-hover:-translate-y-1.5 md:group-hover:shadow-[0_4px_10px_rgba(47,47,47,0.05),0_28px_56px_-18px_rgba(229,75,122,0.24)] motion-reduce:hover:transform-none">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-card ring-2 ring-raspberry/25 shadow-soft">
                    <Icon className="h-7 w-7 text-berry" strokeWidth={1.5} />
                  </div>
                  <div className="mt-7 flex h-[4.5rem] w-full shrink-0 items-start">
                    <h3 className="text-h3 font-semibold text-foreground line-clamp-2">{t}</h3>
                  </div>
                  <p className="mt-3 text-body text-ink-muted">{b}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SECTION 6: MEET PIA ---------- */
function PiaSection() {
  return (
    <section
      id="pia"
      className="section-pad section-bridge-out relative overflow-hidden bg-gradient-to-b from-rose-soft/40 via-rose/25 to-rose-soft/20 md:bg-gradient-to-br md:from-rose-soft/35 md:via-rose/30 md:to-rose-soft/45"
      style={{ "--bridge-out-opacity": "0.38" } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,75,122,0.14),transparent_58%)]"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto w-full max-w-3xl px-6 md:px-8">
        <ScrollReveal className="flex w-full flex-col items-center text-center">
          <span className="inline-flex items-center justify-center gap-1.5 rounded-full bg-card/95 px-4 py-1.5 text-body font-semibold text-raspberry shadow-soft ring-1 ring-raspberry/25">
            <Heart className="h-3.5 w-3.5 shrink-0 fill-current text-raspberry" />
            Your money bestie
          </span>
          <h2 className="mt-5 w-full text-h1 font-semibold text-foreground md:text-display-md">
            Meet Pia
          </h2>
          <p className="mt-5 w-full text-body-lg text-ink-muted">
            A warm guide that explains, encourages, and cheers you on, whether you&apos;re saving
            your first $100 or planning your next big move.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={120} className="relative mx-auto mt-10 w-full md:mt-12">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-[92%] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose/55 blur-[72px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-56 w-[78%] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-raspberry/28 blur-[56px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-[65%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-full bg-berry/18 blur-[40px]"
            aria-hidden
          />
          <div className="relative z-[1]">
            <ChatPreview />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200} className="mt-8 flex justify-center">
          <a
            href="#download"
            className="inline-flex h-14 min-w-[11.5rem] items-center justify-center gap-2 rounded-full bg-raspberry px-8 text-body font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Pia
          </a>
        </ScrollReveal>
      </div>
    </section>
  );
}

function ChatPreview() {
  return (
    <div className="w-full rounded-[32px] border border-border/40 bg-card/95 p-6 shadow-[0_4px_10px_rgba(47,47,47,0.05),0_28px_56px_-18px_rgba(229,75,122,0.24)] backdrop-blur-sm md:p-7">
      <div className="flex items-center gap-3 border-b border-border/50 pb-5">
        <div className="h-11 w-11 overflow-hidden rounded-full bg-rose ring-2 ring-background">
          <img src={piaIllo} alt="" className="h-full w-full object-cover" />
        </div>
        <p className="text-body font-semibold text-foreground">Pia</p>
      </div>
      <div className="space-y-4 pt-5">
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-surface px-5 py-3.5 text-body text-foreground">
          What can I help you with today?
        </div>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-raspberry px-5 py-3.5 text-body text-background">
          How can I start saving for a trip?
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 8: FAQ ---------- */
const faqItems = FAQ_ITEMS;

function Faq() {
  return (
    <section
      id="faq"
      className="section-pad section-bridge-in bg-background"
      style={{ "--bridge-in-opacity": "0.14" } as CSSProperties}
    >
      <div className="relative z-[2] mx-auto max-w-3xl px-6 md:px-12">
        <ScrollReveal>
          <h2 className="text-center text-h1 font-semibold text-foreground md:text-display-md">
            <span className="font-display italic">FAQ</span>
          </h2>
        </ScrollReveal>
        <ScrollReveal delay={110}>
          <div className="mt-14 overflow-hidden rounded-[32px] border border-border/50 bg-card shadow-soft divide-y divide-border/60">
            {faqItems.map((item, i) => (
              <details key={item.q} open={i === 0} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="text-body font-medium text-foreground">{item.q}</span>
                  <Plus className="h-5 w-5 shrink-0 text-raspberry transition-transform duration-300 group-open:rotate-45" />
                </summary>
                <p className="px-6 pb-6 text-body text-ink-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

/* ---------- SECTION 10: STAY TUNED ---------- */
function StayTunedSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || trimmed.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await submitWaitlistEmail(trimmed);

    setIsSubmitting(false);

    if (result.ok) {
      setStatus("success");
      return;
    }

    setError(result.error);
  };

  return (
    <section id="download" className="section-pad border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
          <div className="max-w-md shrink-0">
            <h2 className="font-display text-h1 italic text-foreground md:text-display-md">
              Stay tuned
            </h2>
            <p className="mt-3 text-body text-ink-muted">
              Be first to know when Olimpia launches.
            </p>
          </div>

          {status === "success" ? (
            <div className="flex flex-1 items-center gap-3 rounded-[32px] border border-border/50 bg-card px-6 py-5 shadow-soft lg:max-w-2xl">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-soft text-raspberry">
                <Heart className="h-5 w-5 fill-current" />
              </div>
              <div>
                <p className="text-body font-semibold text-foreground">You&apos;re on the list.</p>
                <p className="mt-0.5 text-body-sm text-ink-muted">
                  We&apos;ll email you the moment Olimpia is ready.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 lg:max-w-2xl">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 sm:flex-row sm:items-start"
                noValidate
              >
                <label htmlFor="stay-tuned-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="stay-tuned-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  maxLength={255}
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 rounded-full border border-foreground/15 bg-card px-5 py-3.5 text-body text-foreground shadow-soft placeholder:text-ink-muted/70 focus:border-raspberry focus:outline-none focus:ring-2 focus:ring-raspberry/30"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex h-[52px] shrink-0 items-center justify-center rounded-full bg-berry px-6 text-body-sm font-semibold text-white shadow-soft transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60 sm:px-8"
                >
                  {isSubmitting ? "Joining..." : "Join the waitlist"}
                </button>
              </form>
              {error && (
                <p className="mt-3 px-2 text-body-sm text-raspberry" role="alert">
                  {error}
                </p>
              )}
              <p className="mt-4 text-body-sm text-ink-muted">
                We&apos;ll only email you about Olimpia.{" "}
                <Link to="/privacy" className="text-raspberry transition hover:opacity-80">
                  Privacy Policy
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/* ---------- WAITLIST MODAL ---------- */
function WaitlistModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => {
      setStatus("idle");
      setError("");
      setEmail("");
      setIsSubmitting(false);
      setOpen(true);
    };
    window.addEventListener("olimpia:open-waitlist", handler);
    return () => window.removeEventListener("olimpia:open-waitlist", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || trimmed.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await submitWaitlistEmail(trimmed);

    setIsSubmitting(false);

    if (result.ok) {
      setStatus("success");
      return;
    }

    setError(result.error);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="waitlist-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8"
    >
      <button
        type="button"
        aria-label="Close waitlist"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-[32px] bg-background p-8 shadow-soft md:p-10">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-foreground"
        >
          ×
        </button>

        {status === "success" ? (
          <div className="text-center">
            <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose/60 text-raspberry">
              <Heart className="h-6 w-6 fill-current" />
            </div>
            <h3 id="waitlist-title" className="mt-6 text-h3 font-semibold text-foreground">
              You're on the list.
            </h3>
            <p className="mt-4 text-body text-ink-muted">
              We'll email you the moment Olimpia is ready. Welcome to the bestie crew.
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-8 inline-flex h-[52px] items-center justify-center rounded-full bg-raspberry px-6 text-body-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="marketing-eyebrow">
              Coming soon
            </p>
            <h3 id="waitlist-title" className="mt-4 text-h3 font-semibold text-foreground">
              Get the Olimpia app
            </h3>
            <p className="mt-3 text-body text-ink-muted">
              We're launching soon. Join the waitlist and we'll email you the moment it's live.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-3" noValidate>
              <label htmlFor="waitlist-email" className="sr-only">
                Email address
              </label>
              <input
                id="waitlist-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                maxLength={255}
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-full border border-foreground/15 bg-surface/60 px-5 py-3.5 text-body text-foreground placeholder:text-ink-muted/70 focus:border-raspberry focus:outline-none focus:ring-2 focus:ring-raspberry/30"
              />
              {error && (
                <p className="px-2 text-body-sm text-raspberry" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-raspberry px-6 text-body-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
              >
                {isSubmitting ? "Joining..." : "Join the waitlist"}
              </button>
            </form>
            <p className="mt-5 text-body-sm text-ink-muted">
              We'll only email you about Olimpia. No spam, ever.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
