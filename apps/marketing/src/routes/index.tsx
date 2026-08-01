import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Heart,
  Plus,
  Send,
  Wallet,
  Fuel,
  CircleDollarSign,
  Unlock,
  Zap,
} from "lucide-react";
import { useEffect, useState, type CSSProperties, type FormEvent, type MouseEvent } from "react";
import piaIllo from "@/assets/pia-raspberry.png";
import { SectionScrollReveal, ScrollReveal } from "@/components/scroll-reveal";
import { HeroDesignBackground } from "@/components/hero-design-background";
import { HeroAnimatedPhone } from "@/components/hero-animated-phone";
import {
  FAQ_ITEMS,
  OLIMPIA_DEFINITION,
  getHomepageStructuredData,
  pageSeoHead,
} from "@/lib/seo";
import { SiteFooter } from "@/components/site-footer";
import { submitWaitlistEmail } from "@/lib/waitlist";
import { useActiveSection } from "@/hooks/use-active-section";
import { useCardPointerTilt } from "@/hooks/use-card-pointer-tilt";
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
        <GoalsSection />
        <EmpoweringCards />
        <UsdcVsUsdSection />
        <WhyUsdcSection />
        <PiaSection />
        <Faq />
        <TrustStrip />
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
    <header className="claude-nav sticky top-0 z-40">
      <div className="mx-auto flex items-center justify-between px-6 py-[22px] md:px-16">
        <Link to="/" className="claude-nav-logo">
          Olimpia
        </Link>
        <nav className="hidden items-center gap-10 md:flex">
          {navLinks.map(({ href, label, id }) => (
            <a
              key={id}
              href={href}
              className={cn(
                "claude-nav-link no-underline transition hover:text-[#2b2b2b]",
                activeSection === id && "is-active",
              )}
            >
              {label}
            </a>
          ))}
        </nav>
        <button type="button" onClick={openWaitlist} className="claude-nav-cta cursor-pointer border-0">
          Download App
        </button>
      </div>
    </header>
  );
}

/* ---------- HERO ---------- */
function Hero() {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);

    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setRotY(px * 18);
    setRotX(-py * 14);
  };

  const handleMouseLeave = () => {
    setRotX(0);
    setRotY(0);
  };

  return (
    <section
      className="hero-section hero-section--design relative isolate overflow-x-clip"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <HeroDesignBackground />
      <div className="hero-inner relative z-[1] mx-auto grid max-w-7xl items-center px-6 md:grid-cols-2 md:items-center md:gap-8 md:px-16 md:pb-16 md:pt-14">
        <div className="relative z-[3] max-w-xl lg:max-w-[600px]">
          <p className="claude-hero-eyebrow">
            Helping women participate in decentralized finance
          </p>
          <p className="claude-hero-greeting">Hello ladies,</p>
          <h1 className="claude-hero-title">You belong here</h1>
          <p className="claude-hero-copy">
            Your money, your terms.
            <br />
            Olimpia is an app that enables financial autonomy and growth.
            Eliminate gatekeepers, stay in control and grow your money with DeFi
            tools. Set savings goals, explore optional yield on USDC, and learn
            with Pia, your AI money bestie.
          </p>
          <div className="flex flex-wrap items-center gap-7">
            <button type="button" onClick={openWaitlist} className="claude-hero-cta cursor-pointer">
              Download App
            </button>
            <a href="#features" className="claude-hero-link no-underline transition hover:opacity-80">
              How it works
              <span aria-hidden> →</span>
            </a>
          </div>
        </div>

        <div className="relative z-[3] flex justify-center md:justify-end">
          <HeroAnimatedPhone
            rotX={rotX}
            rotY={rotY}
            scrollY={reduceMotion ? 0 : scrollY}
            reduceMotion={reduceMotion}
          />
        </div>
      </div>
    </section>
  );
}





/* ---------- TRUST STRIP ---------- */
function TrustStrip() {
  const partners = ["Privy", "Coinbase", "Base", "Circle", "Moonpay"];
  const loop = [...partners, ...partners];
  return (
    <section
      className="trust-strip relative overflow-hidden border-b border-border/50 bg-surface"
    >
      <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
        <SectionScrollReveal>
          <h2 className="text-h2 font-semibold text-foreground md:text-h1">
            Built on trusted infrastructure
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-body text-ink-muted">
            Powered by industry-leading providers in security, compliance, and payments.
          </p>
        </SectionScrollReveal>
        <SectionScrollReveal delay={110} className="marquee mt-10">
          <div className="marquee-track gap-x-16 md:gap-x-24 opacity-70">
            {loop.map((p, i) => (
              <span
                key={`${p}-${i}`}
                aria-hidden={i >= partners.length}
                className="text-h3 font-semibold tracking-tight text-foreground/70 shrink-0"
              >
                {p}
              </span>
            ))}
          </div>
        </SectionScrollReveal>
      </div>
    </section>
  );
}

/* ---------- SECTION 2: FEATURES CARDS ---------- */
function GoalsSection() {
  const items = [
    {
      icon: TrendingUp,
      title: "Yield Opportunity",
      body: "Yields that exceed traditional bank offers. Earn instead of keeping your money idle in a bank.",
      details:
        "Yields that exceed traditional bank offers. Earn instead of keeping your money idle in a bank.",
    },
    {
      icon: Send,
      title: "Fast Money Movement",
      body: "Send money globally in seconds without traditional bank wait times.",
      details:
        "Send money globally in seconds without traditional bank wait times.",
    },
    {
      icon: CircleDollarSign,
      title: "Cost-efficient",
      body: "Transaction fees in the pennies. Send money anywhere in the world for pennies with no holds or wait time.",
      details:
        "Transaction fees in the pennies. Send money anywhere in the world for pennies with no holds or wait time.",
    },
  ];
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const toggle = (title: string) =>
    setFlipped((p) => ({ ...p, [title]: !p[title] }));
  return (
    <section id="features" className="features-section">
      <div className="features-inner">
        <SectionScrollReveal className="features-header">
          <p className="features-eyebrow">Features</p>
          <h2 className="text-balance text-h1 font-semibold text-foreground md:text-display-md">
            Your Bank Stores Money
            <br />
            Olimpia Puts It to Work
          </h2>
          <p className="features-lead text-body text-ink-muted">
            Traditional banks are designed to hold your money. Olimpia helps your money do
            more. Earn on your savings, move globally in seconds, spend with ease, and learn modern
            money skills along the way.
          </p>
        </SectionScrollReveal>

        <div className="features-grid">
          {items.map(({ icon: Icon, title, body, details }, index) => {
            const isFlipped = !!flipped[title];
            return (
              <ScrollReveal key={title} delay={index * 120} className="h-full">
                <div className="feature-card-shell group relative h-full perspective-1000">
                  <div
                    className="pointer-events-none invisible flex flex-col px-8 pb-8 pt-10 text-left"
                    aria-hidden="true"
                  >
                    <div className="h-[52px] w-[52px] shrink-0" />
                    <div className="mt-5 h-14 w-full shrink-0">
                      <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
                    </div>
                    <p className="mt-2.5 text-body-sm text-ink-muted">{body}</p>
                    <span className="mt-5 inline-flex text-body-sm font-semibold">Learn more</span>
                  </div>

                  <div
                    className={cn(
                      "goal-card-flip absolute inset-0 h-full w-full preserve-3d transition-transform duration-[650ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
                      isFlipped && "rotate-y-180",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(title)}
                      aria-expanded={isFlipped}
                      aria-label={`${title}. Learn more`}
                      className="goal-card-face feature-card-face backface-hidden absolute inset-0 flex h-full w-full cursor-pointer flex-col px-8 pb-8 pt-10 text-left font-inherit text-inherit"
                    >
                      <div className="feature-card-icon" aria-hidden>
                        <Icon className="h-6 w-6" strokeWidth={2} />
                      </div>
                      <h3 className="mt-5 text-h3 font-semibold text-foreground">{title}</h3>
                      <p className="mt-2.5 text-body-sm text-ink-muted">{body}</p>
                      <span className="feature-card-cta mt-auto inline-flex items-center pt-5">
                        Learn more →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggle(title)}
                      aria-expanded={isFlipped}
                      aria-label={`${title}. Back`}
                      className="goal-card-face feature-card-face feature-card-face--back backface-hidden rotate-y-180 absolute inset-0 flex h-full w-full cursor-pointer flex-col px-8 pb-8 pt-10 text-left font-inherit text-inherit"
                    >
                      <div className="h-[52px] w-[52px] shrink-0" aria-hidden />
                      <h3 className="mt-5 text-h3 font-semibold text-foreground">{title}</h3>
                      <p className="mt-2.5 text-body-sm text-ink-muted">{details}</p>
                      <span className="feature-card-cta mt-auto inline-flex items-center pt-5">Back</span>
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


/* ---------- HOW IT WORKS (Claude design handoff) ---------- */
function EmpoweringCards() {
  const items = [
    {
      icon: Wallet,
      t: "Absolute Ownership",
      b: "You're in charge with an account that's truly yours. Olimpia can't freeze or move your money.",
    },
    {
      icon: Unlock,
      t: "Total Freedom",
      b: "No lockups or waiting periods. Withdraw anytime and send funds back to your traditional bank.",
    },
    {
      icon: Zap,
      t: "Money in a Snap",
      b: "You can send money anywhere globally in just seconds, skipping expensive bank fees.",
    },
    {
      icon: Fuel,
      t: "Effortless Swapping",
      b: "Easily switch between USDC and USD anytime without stress.",
    },
  ];

  const tilt = useCardPointerTilt();

  return (
    <section id="how" className="claude-how-section">
      <div className="claude-how-inner">
        <SectionScrollReveal className="claude-how-header">
          <p className="claude-how-eyebrow">How It Works</p>
          <h2 className="how-section-heading text-h1 font-semibold text-foreground md:text-display-md">
            The upside is yours
          </h2>
          <p className="claude-how-lead">
            More growth, less complexity, with you in charge. Simple tools that give you easy access
            to decentralized finance (DeFi).
          </p>
        </SectionScrollReveal>

        <div className="claude-how-grid">
          {items.map(({ icon: Icon, t, b }, index) => (
            <div
              key={t}
              className={cn(!tilt.reduceMotion && "claude-how-card-enter")}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className="claude-how-card"
                style={tilt.getTiltStyle(index)}
                onMouseMove={(e) => tilt.handleMove(index, e)}
                onMouseLeave={() => tilt.handleLeave(index)}
              >
                <div
                  className="claude-how-card-spotlight"
                  style={tilt.getSpotlightStyle(index)}
                  aria-hidden
                />
                <div className="claude-how-icon" aria-hidden>
                  <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                </div>
                <h3 className="claude-how-card-title">{t}</h3>
                <p className="claude-how-card-body">{b}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- USDC vs USD (Claude design handoff — local preview) ---------- */
function UsdcVsUsdSection() {
  const compareRows = [
    { bank: "Money sits idle", usdc: "Money earns yield" },
    { bank: "Wait days for transfers", usdc: "Send in seconds" },
    { bank: "Higher transfer fees", usdc: "Send for pennies" },
    { bank: "Banking hours apply", usdc: "Available 24/7" },
    { bank: "Built for storing", usdc: "Built for growth" },
  ];

  return (
    <section id="compare" className="claude-compare-section">
      <div className="claude-compare-wash" aria-hidden />
      <div className="claude-compare-inner">
        <SectionScrollReveal className="claude-compare-copy">
          <p className="claude-compare-eyebrow">Growth Opportunity</p>
          <h2 className="compare-section-heading text-h1 font-semibold text-foreground md:text-display-md">
            Your money deserves to do more than sit in a bank.
          </h2>
          <p className="claude-compare-lead">
            Put your money to work with a stable coin (USDC).
          </p>
          <p className="claude-compare-body">
            Traditional banks store your money. USDC helps it work for you, earning yield, moving
            in seconds, for pennies.
          </p>
          <p className="claude-compare-note">
            USDC always equals one U.S. dollar. Olimpia makes it simple to use.
          </p>
        </SectionScrollReveal>

        <SectionScrollReveal delay={120} className="claude-compare-table-wrap">
          <div className="claude-compare-table" role="table" aria-label="USDC compared to traditional USD bank accounts">
            <div className="claude-compare-table-head" role="row">
              <div className="claude-compare-col-bank" role="columnheader">
                Traditional Bank Account (USD)
              </div>
              <div className="claude-compare-col-usdc" role="columnheader">
                Stable Coin (USDC)
              </div>
            </div>
            {compareRows.map(({ bank, usdc }, index) => (
              <div
                key={bank}
                className="claude-compare-row"
                role="row"
                style={{ "--compare-row-delay": `${index * 80}ms` } as CSSProperties}
              >
                <div className="claude-compare-col-bank" role="cell">
                  {bank}
                </div>
                <div className="claude-compare-col-usdc" role="cell">
                  {usdc}
                </div>
              </div>
            ))}
          </div>
        </SectionScrollReveal>
      </div>
    </section>
  );
}

/* ---------- SECTION 3: WHY USDC (Claude design handoff — local preview) ---------- */
function WhyUsdcSection() {
  return (
    <section className="claude-usdc-section">
      <div className="claude-usdc-wash" aria-hidden />
      <div className="claude-usdc-inner">
        <SectionScrollReveal className="claude-usdc-copy">
          <div className="claude-usdc-eyebrow-row">
            <span className="claude-usdc-eyebrow-rule" aria-hidden />
            <p className="claude-usdc-eyebrow">How we help you</p>
          </div>
          <h2 className="usdc-section-heading text-h1 font-semibold text-foreground md:text-display-md">
            Your dollars can do more as a stable coin
          </h2>
          <p className="claude-usdc-body">
            USDC is a stablecoin always pegged one-to-one with USD. Olimpia converts your
            dollars for you and helps you earn yield on your balance.
          </p>
          <div className="claude-usdc-callout">
            <div className="claude-usdc-callout-mark" aria-hidden>
              1:1
            </div>
            <div>
              <h3 className="claude-usdc-callout-title">Pegged one-to-one to USD</h3>
              <p className="claude-usdc-callout-body">
                USDC is a stablecoin always pegged one-to-one with USD. Olimpia converts your
                dollars for you and helps you earn yield on your balance.
              </p>
            </div>
          </div>
        </SectionScrollReveal>

        <SectionScrollReveal delay={160} className="claude-usdc-coin-wrap">
          <UsdcProductPreview />
        </SectionScrollReveal>
      </div>
    </section>
  );
}

/* Official USDC symbol geometry with Olimpia raspberry fill + coin spin handoff. */
function UsdcProductPreview() {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setRotY(px * 16);
    setRotX(-py * 12);
  };

  const handleMouseLeave = () => {
    setRotX(0);
    setRotY(0);
  };

  const tiltStyle: CSSProperties = {
    transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
    transition: reduceMotion ? undefined : "transform 0.3s ease-out",
  };

  return (
    <div
      className="claude-usdc-coin"
      aria-hidden
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={reduceMotion ? "claude-usdc-coin-glow-core" : "claude-usdc-coin-glow-core claude-usdc-coin-glow-core--anim"} />

      <div className={reduceMotion ? "claude-usdc-coin-float" : "claude-usdc-coin-float claude-usdc-coin-float--anim"}>
        <div className={reduceMotion ? "claude-usdc-coin-shadow" : "claude-usdc-coin-shadow claude-usdc-coin-shadow--anim"} />

        <div className="claude-usdc-coin-tilt" style={tiltStyle}>
          <div className={reduceMotion ? "claude-usdc-coin-spin" : "claude-usdc-coin-spin claude-usdc-coin-spin--anim"}>
            <svg
              viewBox="0 0 96 96"
              fill="none"
              className="claude-usdc-coin-svg"
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
            {!reduceMotion && <div className="claude-usdc-coin-sheen" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- SECTION 6: MEET PIA (Claude design handoff — local preview) ---------- */
function PiaSection() {
  return (
    <section id="pia" className="claude-pia-section">
      <SectionScrollReveal className="flex w-full flex-col items-center text-center">
        <p className="claude-pia-eyebrow">Let&apos;s talk money</p>
        <span className="claude-pia-badge">
          <span aria-hidden>♥</span>
          <span>Your money bestie</span>
        </span>
        <h2 className="pia-section-heading text-h1 font-semibold text-foreground md:text-display-md">
          Meet Pia
        </h2>
        <p className="claude-pia-copy">
          A warm guide that explains, encourages, and cheers you on, whether you&apos;re saving
          your first $100 or planning your next big move.
        </p>
      </SectionScrollReveal>

      <SectionScrollReveal delay={120} className="mx-auto mt-0 w-full max-w-[480px]">
        <ChatPreview />
      </SectionScrollReveal>
    </section>
  );
}

function ChatPreview() {
  return (
    <div className="claude-pia-card">
      <div className="claude-pia-card-header">
        <div className="claude-pia-avatar" aria-hidden>
          <img src={piaIllo} alt="" className="h-full w-full rounded-full object-cover" />
        </div>
        <p className="claude-pia-name">Pia</p>
        <span className="claude-pia-online" aria-label="Online" />
      </div>

      <div className="claude-pia-bubble-pia">What can I help you with today?</div>

      <button type="button" tabIndex={-1} className="claude-pia-bubble-user">
        How can I start saving for a trip?
      </button>

      <button type="button" onClick={openWaitlist} className="claude-pia-cta">
        <span aria-hidden>💬</span>
        <span>Chat with Pia</span>
      </button>
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
      style={{ "--bridge-in-opacity": "0.2" } as CSSProperties}
    >
      <div className="relative z-[2] mx-auto max-w-3xl px-6 md:px-12">
        <SectionScrollReveal className="claude-section-header">
          <h2 className="claude-section-title mx-auto text-center">
            FAQ
          </h2>
        </SectionScrollReveal>
        <SectionScrollReveal delay={110}>
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
        </SectionScrollReveal>
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

    const result = await submitWaitlistEmail(trimmed, "marketing_stay_tuned");

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
          <SectionScrollReveal className="claude-section-header max-w-md shrink-0">
            <h2 className="claude-section-title">
              Stay <span className="italic font-normal">tuned</span>
            </h2>
            <p className="mt-4 text-body text-ink-muted">
              Be first to know when Olimpia launches.
            </p>
          </SectionScrollReveal>

          <SectionScrollReveal delay={120} className="flex-1 lg:max-w-2xl">
          {status === "success" ? (
            <div className="flex items-center gap-3 rounded-[32px] border border-border/50 bg-card px-6 py-5 shadow-soft">
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
            <div>
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
          </SectionScrollReveal>
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
              className="mt-8 inline-flex h-[52px] items-center justify-center rounded-full bg-berry px-6 text-body-sm font-semibold text-white transition hover:opacity-90"
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
                className="inline-flex h-[52px] w-full items-center justify-center rounded-full bg-berry px-6 text-body-sm font-semibold text-white transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
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
