import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Heart,
  Plus,
  Send,
  Wallet,
  Fuel,
  CircleDollarSign,
  Layers,
  LayoutGrid,
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
        <DefiEquitySection />
        <GoalsSection />
        <EmpoweringCards />
        <UsdcVsUsdSection />
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
const NAV_SECTIONS = ["why", "features", "how", "pia", "faq", "about"] as const;

const navLinks = [
  { href: "#why", label: "Why DeFi", id: "why" },
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
          Join
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
            Olimpia makes decentralized finance simple for women: stay in control,
            skip the gatekeepers, and put your dollars to work.
          </p>
          <div className="flex flex-wrap items-center gap-7">
            <button type="button" onClick={openWaitlist} className="claude-hero-cta cursor-pointer">
              Get early access
            </button>
            <a href="#why" className="claude-hero-link no-underline transition hover:opacity-80">
              Why it matters
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
      className="trust-strip relative overflow-hidden border-b border-border/30 bg-white"
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
          <div className="marquee-track gap-x-16 md:gap-x-24 opacity-45">
            {loop.map((p, i) => (
              <span
                key={`${p}-${i}`}
                aria-hidden={i >= partners.length}
                className="text-h3 font-semibold tracking-tight text-ink-muted shrink-0"
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
            More opportunities for your money, without the limitations of traditional banking.
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

/* ---------- HOW IT WORKS (The upside is yours) ---------- */
function EmpoweringCards() {
  const items = [
    {
      icon: Wallet,
      t: "You stay in charge",
      b: "Your wallet belongs to you. Olimpia can never access, freeze, or move your funds.",
      iconBg: "#fbdde6",
    },
    {
      icon: Layers,
      t: "Complexity removed",
      b: "Trusted protocols power saving, spending, and optional yield, with no blockchain expertise required.",
      iconBg: "#f6cdd8",
    },
    {
      icon: LayoutGrid,
      t: "Everything in one place",
      b: "Save, spend, and explore optional yield, all from a single app.",
      iconBg: "#f0bece",
    },
    {
      icon: Fuel,
      t: "We cover network fees",
      b: "Olimpia covers network fees on supported transactions, so you don't have to.",
      iconBg: "#e9aec4",
    },
  ];

  const tilt = useCardPointerTilt();

  return (
    <section id="how" className="claude-how-section">
      <div className="claude-how-wash" aria-hidden />
      <div className="claude-how-glow" aria-hidden />
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
          {items.map(({ icon: Icon, t, b, iconBg }, index) => (
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
                <div
                  className="claude-how-icon"
                  style={{ background: iconBg }}
                  aria-hidden
                >
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

/* ---------- DEFI EQUITY ---------- */
function DefiEquitySection() {
  const points = [
    {
      title: "No Permission Needed",
      body: "Manage your money anytime, anywhere. All you need is your phone.",
    },
    {
      title: "Equal Access",
      body: "The same financial opportunities are available to everyone, not just those with wealth or connections.",
    },
    {
      title: "Put Your Money to Work",
      body: "Earn on your savings and access financial tools designed to help your money grow.",
    },
  ];

  return (
    <section id="why" className="claude-defi-section" aria-labelledby="defi-equity-title">
      <div className="claude-defi-wash" aria-hidden />
      <div className="claude-defi-inner">
        <SectionScrollReveal className="claude-defi-header">
          <p className="claude-defi-eyebrow">Financial Freedom Starts with Access</p>
          <h2
            id="defi-equity-title"
            className="defi-section-heading text-h1 font-semibold md:text-display-md"
          >
            Why DeFi matters for women
          </h2>
          <p className="claude-defi-lead">
            Access financial tools without gatekeepers. You can save, earn, and move money without
            geographic, economic or societal barriers.
          </p>
        </SectionScrollReveal>

        <div className="claude-defi-grid">
          {points.map((point, index) => (
            <SectionScrollReveal
              key={point.title}
              delay={80 + index * 60}
              className="claude-defi-card"
            >
              <h3 className="claude-defi-card-title">{point.title}</h3>
              <p className="claude-defi-card-body">{point.body}</p>
            </SectionScrollReveal>
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
    { bank: "Days for global transfers", usdc: "Send globally in seconds" },
    { bank: "Higher transfer fees", usdc: "Send for pennies" },
    { bank: "Banking hours apply", usdc: "Available 24/7" },
    { bank: "Built for storing", usdc: "Built for growth" },
  ];

  return (
    <section id="compare" className="claude-compare-section">
      <div className="claude-compare-wash" aria-hidden />
      <div className="claude-compare-inner">
        <SectionScrollReveal className="claude-compare-copy">
          <p className="claude-compare-eyebrow">How Olimpia Helps</p>
          <h2 className="compare-section-heading text-h1 font-semibold text-foreground md:text-display-md">
            Your money deserves to do more than sit in a bank.
          </h2>
          <p className="claude-compare-body">
            Olimpia makes it easy to turn your dollars into a stable coin and earn on your balance.
            We handle the complexity. USDC stays pegged one to one with the U.S. dollar.
          </p>
        </SectionScrollReveal>

        <SectionScrollReveal delay={120} className="claude-compare-table-wrap">
          <div className="claude-compare-table" role="table" aria-label="USDC compared to traditional USD bank accounts">
            <div className="claude-compare-table-intro">
              <p className="claude-compare-table-sub">USD vs USDC</p>
              <p className="claude-compare-table-lead">
                The difference is what the money can do
              </p>
            </div>
            <div className="claude-compare-table-head" role="row">
              <div className="claude-compare-col-bank" role="columnheader">
                Bank account
              </div>
              <div className="claude-compare-col-usdc" role="columnheader">
                Stable coin
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

/* ---------- MEET PIA ---------- */

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
    <section id="download" className="stay-tuned-section">
      <div className="stay-tuned-inner">
        <SectionScrollReveal className="stay-tuned-copy">
          <h2 className="claude-section-title stay-tuned-title">
            More choices. More freedom.
          </h2>
          <p className="stay-tuned-lead">
            When your money does more, so can you.
          </p>
        </SectionScrollReveal>

        <SectionScrollReveal delay={120} className="stay-tuned-form-wrap">
          {status === "success" ? (
            <div className="stay-tuned-success">
              <p className="stay-tuned-success-title">You&apos;re on the list.</p>
              <p className="stay-tuned-success-body">
                We&apos;ll email you the moment Olimpia is ready.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="stay-tuned-form" noValidate>
              <label htmlFor="stay-tuned-email" className="sr-only">
                Email address
              </label>
              <div className="stay-tuned-row">
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
                  className="stay-tuned-input"
                />
                <button type="submit" disabled={isSubmitting} className="stay-tuned-cta">
                  {isSubmitting ? "Joining..." : "Join the waitlist"}
                </button>
              </div>
              {error && (
                <p className="stay-tuned-error" role="alert">
                  {error}
                </p>
              )}
              <p className="stay-tuned-privacy">
                We&apos;ll only email you about Olimpia.{" "}
                <Link to="/privacy">Privacy Policy</Link>
              </p>
            </form>
          )}
        </SectionScrollReveal>
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
