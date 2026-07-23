import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CreditCard,
  TrendingUp,
  GraduationCap,
  Heart,
  Plus,
  Send,
  Wallet,
  Layers,
  LayoutGrid,
  Fuel,
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
            DeFi shouldn&apos;t feel confusing or out of reach. Olimpia was created
            to help women participate in decentralized finance. Set savings goals,
            explore optional yield on USDC, and learn with Pia, your money bestie.
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

/* ---------- SECTION 2: GOALS CARDS ---------- */
function GoalsSection() {
  const items = [
    {
      icon: Send,
      title: "Send USDC",
      body: "Send USDC in seconds to anyone anywhere in the world.",
      details:
        "Move money globally without bank hours or high fees. Enter an address or username, confirm, and it's on the way — usually in seconds.",
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
        <SectionScrollReveal className="mx-auto max-w-3xl text-center">
          <h2 className="text-balance text-h1 font-semibold text-foreground md:text-display-md">
            Your Bank Stores Money
            <br />
            Olimpia helps it do more
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            Earn higher yield on your savings, send money globally in seconds, enjoy rewards, learn about new financial tools with an ai guide!
          </p>
        </SectionScrollReveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-7">
          {items.map(({ icon: Icon, title, body, details }, index) => {
            const isFlipped = !!flipped[title];
            return (
              <ScrollReveal key={title} delay={index * 40} className="h-full">
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


/* ---------- SECTION 3: WHY USDC (Claude design handoff — local preview) ---------- */
function WhyUsdcSection() {
  const benefits = [
    {
      icon: "1:1",
      title: "Pegged one-to-one to USD",
      body: "One USDC is designed to equal one U.S. dollar.",
    },
    {
      icon: "⏱",
      title: "Move money 24/7",
      body: "Send and receive globally within seconds, anytime.",
    },
    {
      icon: "📈",
      title: "Optional yield through DeFi",
      body: "Access optional yield opportunities through DeFi.",
    },
    {
      icon: "💳",
      title: "Digital dollar you can use online",
      body: "Save, send, and spend in the digital economy.",
    },
  ];

  return (
    <section className="claude-usdc-section">
      <div className="claude-usdc-wash" aria-hidden />
      <div className="claude-usdc-inner">
        <SectionScrollReveal className="claude-usdc-copy">
          <p className="claude-usdc-eyebrow">Money, faster and more flexible</p>
          <h2 className="usdc-section-heading text-h1 font-semibold text-foreground md:text-display-md">
            USDC
          </h2>
          <p className="claude-usdc-lead">Your dollars can do more as USDC.</p>
          <p className="claude-usdc-body">
            USDC is a stablecoin pegged 1:1 to the US dollar. Send and receive it within
            seconds, every day, 24/7.
          </p>
          <div className="claude-usdc-grid">
            {benefits.map(({ icon, title, body }) => (
              <div key={title} className="claude-usdc-card">
                <div className="claude-usdc-card-icon" aria-hidden>
                  {icon}
                </div>
                <h3 className="claude-usdc-card-title">{title}</h3>
                <p className="claude-usdc-card-body">{body}</p>
              </div>
            ))}
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
        <SectionScrollReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-h1 font-semibold text-foreground md:text-display-md">
            The upside is yours
          </h2>
          <p className="mt-6 text-body text-ink-muted">
            More growth, less complexity, with you in charge. Simple tools that give you easy access
            to decentralized finance (DeFi).
          </p>
        </SectionScrollReveal>
        <div className="mx-auto mt-12 grid max-w-5xl auto-rows-fr grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-14 lg:gap-8">
          {items.map(({ icon: Icon, t, b }, index) => (
            <ScrollReveal key={t} delay={index * 40} className="h-full">
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
