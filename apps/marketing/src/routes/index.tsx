import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  TrendingUp,
  PiggyBank,
  Globe2,
  GraduationCap,
  Heart,
  MessageCircle,
  Plus,
  ArrowUpRight,
  Apple,
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
} from "lucide-react";
import { useEffect, useState } from "react";
import piaIllo from "@/assets/pia-raspberry.png";
import eiffel from "@/assets/eiffel.jpg";
import {
  FAQ_ITEMS,
  OLIMPIA_DEFINITION,
  getHomepageStructuredData,
  pageSeoHead,
} from "@/lib/seo";
import { SiteFooter } from "@/components/site-footer";
import { submitWaitlistEmail } from "@/lib/waitlist";

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
        <FeatureGrid />
        <WhyUsdcSection />
        <ConfidenceSection />
        <EmpoweringCards />
        <PiaSection />
        <HowItWorks />
        <Faq />
        <FinalCta />
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
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="font-display text-h3 tracking-tight text-berry">
          Olimpia
        </Link>
        <nav className="hidden items-center gap-8 text-body-sm text-foreground/80 md:flex">
          <a href="#features" className="transition hover:text-foreground">Features</a>
          <a href="#how" className="transition hover:text-foreground">How It Works</a>
          <a href="#pia" className="transition hover:text-foreground">Pia</a>
          <a href="#about" className="transition hover:text-foreground">About</a>
          <a href="#faq" className="transition hover:text-foreground">FAQ</a>
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
    <section className="relative isolate overflow-hidden">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-6 pt-20 pb-16 md:grid-cols-2 md:gap-20 md:px-12 md:pt-32 md:pb-24 lg:pb-[120px]">
        <div className="max-w-xl">
          <p className="text-body-sm font-semibold tracking-[0.18em] text-raspberry">
            A financial app designed for women
          </p>
          <h1 className="mt-8 text-h1 font-semibold text-foreground md:text-h1 lg:text-display-md">
            Your money should do more than sit in a{" "}
            <span className="font-display italic text-raspberry">checking account</span>
          </h1>
          <p className="mt-8 max-w-md text-body-lg text-ink-muted">
            More options than a traditional bank.
          </p>
          <p className="mt-4 max-w-md text-body-lg text-ink-muted">
            Olimpia is a financial app for women to save, spend, and grow money in dollars, with savings
            goals, optional yield on USDC, and learn with Pia, your AI money bestie.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openWaitlist}
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-berry px-6 text-body-sm font-semibold text-white shadow-soft transition hover:opacity-90"
            >
              Sign Up
            </button>
            <a
              href="#features"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-full border border-foreground/15 bg-transparent px-6 text-body-sm font-semibold text-foreground transition hover:border-foreground/30"
            >
              Learn More
            </a>
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <div className="absolute -inset-16 -z-10 rounded-full bg-rose/70 blur-3xl" />
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}





/* ---------- PHONE MOCKUP (pure CSS) ----------
 * Intentional exception to the design type scale:
 * the arbitrary text-[Npx] sizes below simulate a real phone UI at fixed scale.
 * Do not migrate them to the marketing type tokens. */
function PhoneMockup() {
  return (
    <div className="relative w-[352px] sm:w-[396px]">
      {/* Phone frame */}
      <div className="relative rounded-[3.25rem] bg-[#111] p-[10px] shadow-[0_40px_80px_-20px_rgba(47,47,47,0.28),0_15px_40px_-15px_rgba(229,75,122,0.22)]">
        <div className="relative overflow-hidden rounded-[2.75rem] bg-background">
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
          <div className="px-6 pb-5 pt-3">
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
                  6.9%
                </span>
                <span className="text-background/60">+$280.00 this month</span>
              </div>
            </div>

            {/* Quick actions */}
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

            {/* Savings goal card */}
            <div className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
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

            {/* Recent activity */}
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
          </div>

          {/* Tab bar */}
          <div className="grid grid-cols-5 border-t border-border/50 bg-background px-3 pb-5 pt-3">
            {[
              { Icon: HomeIcon, label: "Home", active: true },
              { Icon: CreditCard, label: "Card" },
              { Icon: SaveIcon, label: "Save" },
              { Icon: User, label: "Pia" },
              { Icon: Shield, label: "Learn" },
            ].map(({ Icon, label, active }) => (
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
    <section className="border-y border-border/50 bg-surface/60 py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
        <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
          Built on trusted infrastructure
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-body text-ink-muted">
          Powered by industry-leading providers in security, compliance, and payments.
        </p>
        <div className="marquee mt-12">
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
        </div>
      </div>
    </section>
  );
}

/* ---------- SECTION 2: GOALS CARDS ---------- */
function GoalsSection() {
  const items = [
    {
      icon: Briefcase,
      title: "Savings Goals",
      body: "Build savings goals powered by USDC and modern money tools.",
      details:
        "Save toward your goals while your USDC can earn 3–5% in trusted lending markets. Your money stays available. Move it back to your bank whenever you need it. No lockups or long-term commitments.",
    },
    {
      icon: CreditCard,
      title: "Virtual Card",
      body: "Spend anywhere Visa is accepted.",
      details:
        "Spend your stablecoin balance anywhere Visa is accepted. Top up your card from your wallet with a single tap. Use your card for everyday purchases online and in stores.",
    },
    {
      icon: TrendingUp,
      title: "Earn on Your Balance",
      body: "Grow your money with USDC yield.",
      details:
        "Your balance earns USDC yield while it sits. Olimpia connects you to the same lending markets used by professional investors, currently paying 3–5% a year on USDC. No lockups. Withdraw anytime.",
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
    <section className="bg-background py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
            Build around real-life{" "}
            <span className="font-display italic text-raspberry">money goals</span>
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            Whether you're planning a girls trip, building an emergency fund, or starting a business, Olimpia helps you make progress.
          </p>
        </div>
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4 lg:gap-7">
          {items.map(({ icon: Icon, title, body, details }) => {
            const isFlipped = !!flipped[title];
            return (
              <div
                key={title}
                className="goal-card-shell group perspective-1000 min-h-[340px] md:transition-transform md:duration-300 md:ease-out md:hover:-translate-y-1.5"
              >
                <div
                  className={`goal-card-flip relative h-full w-full preserve-3d transition-transform duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${isFlipped ? "rotate-y-180" : ""}`}
                >
                  {/* Front */}
                  <button
                    type="button"
                    onClick={() => toggle(title)}
                    aria-expanded={isFlipped}
                    aria-label={`${title}. Learn more`}
                    className="goal-card-face backface-hidden absolute inset-0 flex w-full cursor-pointer flex-col items-center rounded-[32px] border border-border/30 bg-background p-10 text-center font-inherit text-inherit shadow-[0_1px_2px_rgba(47,47,47,0.02),0_18px_40px_-24px_rgba(229,75,122,0.14)] transition-shadow duration-300 ease-out md:group-hover:shadow-[0_4px_10px_rgba(47,47,47,0.05),0_28px_56px_-18px_rgba(229,75,122,0.24)]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose/70">
                      <Icon className="h-7 w-7 text-raspberry" strokeWidth={1.5} />
                    </div>
                    <h3 className="mt-7 text-h3 font-semibold text-foreground">{title}</h3>
                    <p className="mt-2.5 text-body text-ink-muted">{body}</p>
                    <span className="goal-card-action mt-auto inline-flex items-center pt-7 text-body-sm font-medium text-raspberry">
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
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ---------- SECTION 3: FEATURE GRID ---------- */
function FeatureGrid() {
  const items = [
    {
      icon: PiggyBank,
      title: "Your Money Earns",
      body: "Instead of sitting idle in a checking account, your balance can earn USDC yield.",
    },
    {
      icon: TrendingUp,
      title: "You Have a Guide",
      body: "You're never alone. Pia, your AI guide, helps you understand modern money tools without feeling overwhelmed.",
    },
    {
      icon: Globe2,
      title: "Access Decentralized Finance",
      body: "Access decentralized finance. Create savings goals that leverage the best tools available.",
    },
    {
      icon: GraduationCap,
      title: "Send USDC",
      body: "Send USDC to anyone, anywhere in seconds.",
    },
  ];
  return (
    <section id="features" className="bg-surface py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
            More options than a traditional bank
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            Designed for you
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-body text-ink-muted">
            Most banks help you store money. Olimpia helps you grow it, learn, and put it to work.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:mt-20">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-[32px] border border-border/50 bg-card p-10 shadow-soft"
            >
              <div className="flex items-start justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose/70">
                  <Icon className="h-5 w-5 text-raspberry" />
                </div>
              </div>
              <h3 className="mt-8 text-h3 font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-3 max-w-md text-body text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SECTION 4: WHY USDC ---------- */
function WhyUsdcSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose/20 via-rose/10 to-background py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-12">
        <div className="max-w-lg">
          <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
            Smart Money
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            Why USDC?
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            More flexibility, faster access to your money, and new ways to grow your savings.
          </p>
          <p className="mt-4 text-body text-ink-muted">
            USDC is a digital dollar designed to maintain a one-to-one value with the U.S. dollar.
            Millions of people use it to save, send, and move money around the world.
          </p>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <UsdcProductPreview />
        </div>
      </div>
    </section>
  );
}

/* Cropped Olimpia app UI — matches Hero phone styling at a smaller scale. */
function UsdcProductPreview() {
  return (
    <div className="relative w-[300px] sm:w-[320px]">
      <div className="absolute -inset-12 -z-10 rounded-full bg-rose/60 blur-3xl" />
      <div className="relative rounded-[2.75rem] bg-[#111] p-[9px] shadow-[0_32px_64px_-18px_rgba(47,47,47,0.26),0_12px_32px_-12px_rgba(229,75,122,0.2)]">
        <div className="overflow-hidden rounded-[2.25rem] bg-background">
          <div className="relative flex h-10 items-center justify-between px-6 pt-2.5 text-[10px] font-semibold text-foreground">
            <span>9:41</span>
            <div className="absolute left-1/2 top-2 h-5 w-20 -translate-x-1/2 rounded-full bg-[#111]" />
          </div>

          <div className="px-5 pb-6 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-ink-muted">Good morning</p>
                <p className="text-[14px] font-semibold text-foreground">Jennifer</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-rose to-raspberry/60 ring-2 ring-background" />
            </div>

            <div className="mt-5 rounded-2xl bg-[#111] p-4 text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.18em] text-background/60">
                  USDC Savings
                </p>
                <span className="text-[10px] text-background/60">USDC</span>
              </div>
              <p className="mt-2 text-[26px] font-semibold tracking-tight">
                $2,450<span className="text-background/50">.00</span>
              </p>
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-background/10 px-2 py-0.5 font-medium">
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2.5} />
                  4.2%
                </span>
                <span className="text-background/60">Pegged to $1 USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 5: CONFIDENCE ---------- */
function ConfidenceSection() {
  return (
    <section className="bg-surface py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-12">
        <div className="max-w-lg md:order-1">
          <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
            Confidence
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            Feel in control of your financial future
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            Learn about investing, USDC, savings, and modern money tools with simple explanations from Pia, your AI money guide.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md md:order-2 md:justify-self-center">
          <ConfidenceChatSnippet />
        </div>
      </div>
    </section>
  );
}

function ConfidenceChatSnippet() {
  return (
    <div
      className="rounded-[28px] border border-border/50 bg-card p-5 shadow-soft"
      aria-label="Example conversation with Pia about USDC savings"
    >
      <div className="flex items-center gap-2.5 pb-4">
        <div className="h-8 w-8 overflow-hidden rounded-full bg-rose">
          <img src={piaIllo} alt="" className="h-full w-full object-cover" />
        </div>
        <p className="text-body-sm font-medium text-ink-muted">I'm Pia, how can I help?</p>
      </div>
      <div className="space-y-3">
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-tr-md bg-raspberry px-4 py-3 text-body-sm text-background">
          Is USDC safe for savings?
        </div>
        <div className="flex max-w-[92%] gap-2.5">
          <div className="mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full bg-rose">
            <img src={piaIllo} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-body-sm text-foreground">
            Great question. USDC is pegged to the dollar, so it stays close to $1. It can earn yield while
            you save. I'll walk you through how it works so you decide with confidence.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 6: EMPOWERING ---------- */
function EmpoweringCards() {
  const highlights = ["Learn as you go", "Real-life planning"];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-rose/20 via-rose/10 to-background py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:grid-cols-2 md:px-12">
        <div className="max-w-lg">
          <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
            Beyond banking
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            <span className="whitespace-nowrap">Simpler than a bank account</span>
            <br />
            More <span className="font-display italic text-raspberry">empowering</span> than one
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            Most banks help you store money. Olimpia helps you organize it around travel,
            emergencies, and the goals that matter to you, while you earn on your balance and learn
            as you go.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {highlights.map((label) => (
              <span
                key={label}
                className="inline-flex items-center rounded-full bg-card px-3 py-1 text-body-sm font-medium text-ink-muted ring-1 ring-border/40"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative flex justify-center md:justify-end">
          <EmpoweringGoalsPreview />
        </div>
      </div>
    </section>
  );
}

function EmpoweringGoalsPreview() {
  return (
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-12 -z-10 rounded-full bg-rose/60 blur-3xl" />
      <div className="rounded-[32px] border border-border/50 bg-card p-6 shadow-soft md:p-7">
        <p className="text-body-sm font-semibold text-foreground">Your goals</p>
        <p className="mt-0.5 text-body-sm text-ink-muted">Track progress toward what matters</p>

        <div className="mt-5 rounded-2xl border border-border/60 bg-background p-4">
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
                <p className="text-body-sm font-semibold text-foreground">Europe Trip</p>
                <span className="text-body-sm font-medium text-ink-muted">45%</span>
              </div>
              <p className="mt-0.5 text-body-sm text-ink-muted">
                <span className="font-semibold text-foreground">$2,250</span> of $5,000
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full w-[45%] rounded-full bg-raspberry" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-border/60 bg-background p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-rose/70">
              <PiggyBank className="h-6 w-6 text-raspberry" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-body-sm font-semibold text-foreground">Emergency Fund</p>
                <span className="text-body-sm font-medium text-ink-muted">20%</span>
              </div>
              <p className="mt-0.5 text-body-sm text-ink-muted">
                <span className="font-semibold text-foreground">$1,000</span> of $5,000
              </p>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
                <div className="h-full w-[20%] rounded-full bg-raspberry" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 7: MEET PIA ---------- */
function PiaSection() {
  return (
    <section id="pia" className="relative overflow-hidden bg-gradient-to-b from-rose/30 via-rose/20 to-background py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 md:px-12 lg:grid-cols-3 lg:gap-12">
        <div className="relative flex justify-center lg:justify-start">
          <div className="relative">
            <div className="absolute -inset-8 -z-10 rounded-full bg-rose/60 blur-3xl" />
            <div className="overflow-hidden rounded-[32px] bg-background shadow-[0_30px_60px_-25px_rgba(229,75,122,0.25)] ring-1 ring-border/40">
              <img
                src={piaIllo}
                alt="Pia, your money bestie"
                width={1024}
                height={1024}
                loading="lazy"
                className="h-80 w-80 object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -right-3 flex items-center gap-2.5 rounded-2xl bg-card px-3.5 py-2.5 shadow-[0_12px_32px_-12px_rgba(47,47,47,0.18)] ring-1 ring-border/40">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              <div>
                <p className="text-body-sm font-semibold text-foreground">Pia is online</p>
                <p className="text-body-sm text-ink-muted">Usually replies in seconds</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-body-sm font-medium text-raspberry ring-1 ring-raspberry/20">
            <Heart className="h-3 w-3 fill-current text-raspberry" />
            Your money bestie
          </span>
          <h2 className="mt-5 text-h1 font-semibold text-foreground md:text-display-md">
            Meet Pia
            <br />
            <span className="text-raspberry">
              Always in your corner
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-md text-body text-ink-muted lg:mx-0">
            A warm, judgment-free guide that explains, encourages, and cheers you on, whether you're saving your first $100 or planning your next big move.
          </p>
          <a
            href="#download"
            className="mt-9 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-raspberry px-6 text-body-sm font-semibold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            <MessageCircle className="h-4 w-4" />
            Chat with Pia
          </a>
        </div>

        <div className="lg:justify-self-end">
          <ChatPreview />
        </div>
      </div>
    </section>
  );
}

function ChatPreview() {
  return (
    <div className="w-full max-w-sm rounded-[32px] border border-border/50 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full bg-rose">
            <img src={piaIllo} alt="" className="h-full w-full object-cover" />
          </div>
          <p className="text-body-sm font-semibold text-foreground">Pia</p>
        </div>
        <MoreHorizontal className="h-4 w-4 text-ink-muted" />
      </div>
      <div className="space-y-3 pt-4">
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-body-sm text-foreground">
          Hi Jennifer! <span aria-hidden>✨</span>
          <br />
          What can I help you with today?
        </div>
        <p className="text-body-sm text-ink-muted">9:45 AM</p>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-raspberry px-4 py-3 text-body-sm text-background">
          How can I start saving for a trip?
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-body-sm text-foreground">
          Love that! Let's set up a goal. Even $40 a week gets you to $2,000 in a year. ✨
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 8: HOW IT WORKS ---------- */
function HowItWorks() {
  const steps = [
    { n: "01", t: "Sign Up", b: "Download app and create account." },
    { n: "02", t: "Set Goals", b: "Create meaningful savings goals." },
    { n: "03", t: "Grow Your Money", b: "Access yield opportunities and track progress." },
  ];
  return (
    <section id="how" className="py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
            Getting Started
          </p>
          <h2 className="mt-4 text-h1 font-semibold text-foreground md:text-display-md">
            How it works
          </h2>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:mt-20">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-[32px] border border-border/50 bg-card p-8 shadow-soft"
            >
              <div className="font-display text-h1 text-raspberry">{s.n}</div>
              <h3 className="mt-6 text-h3 font-semibold text-foreground">{s.t}</h3>
              <p className="mt-2 text-body text-ink-muted">{s.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- SECTION 9: FAQ ---------- */
const faqItems = FAQ_ITEMS;

function Faq() {
  return (
    <section id="faq" className="bg-surface py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-3xl px-6 md:px-12">
        <h2 className="text-center text-h1 font-semibold text-foreground md:text-display-md">
          <span className="font-display italic">FAQ</span>
        </h2>
        <div className="mt-14 divide-y divide-border/60 overflow-hidden rounded-[32px] border border-border/60 bg-card">
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
      </div>
    </section>
  );
}

/* ---------- SECTION 10: FINAL CTA ---------- */
function FinalCta() {
  return (
    <section id="download" className="py-16 md:py-24 lg:py-[120px]">
      <div className="mx-auto max-w-4xl px-6 text-center md:px-12">
        <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
          More choices.
          <br />
          <span className="text-raspberry">More freedom.</span>
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-body text-ink-muted">
          The future of money designed specifically for women.
        </p>
        <button
          type="button"
          onClick={openWaitlist}
          className="mt-10 inline-flex h-[52px] items-center justify-center gap-2 rounded-full bg-berry px-6 text-body-sm font-semibold text-white shadow-soft transition hover:opacity-90"
        >
          <Apple className="h-4 w-4 fill-current" />
          Download App
        </button>
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
            <p className="text-body-sm font-semibold uppercase tracking-[0.18em] text-raspberry">
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
