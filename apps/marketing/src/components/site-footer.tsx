import { Link } from "@tanstack/react-router";
import { SectionScrollReveal } from "@/components/scroll-reveal";
import { SUPPORT_EMAIL } from "@/lib/seo";

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-border/60 bg-surface/80">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <SectionScrollReveal className="lg:col-span-5">
            <Link to="/" className="font-display text-h3 tracking-tight text-raspberry">
              Olimpia
            </Link>
            <p className="mt-4 max-w-md text-body text-ink-muted">
              Olimpia was created to help women build financial confidence and learn about
              decentralized finance.
            </p>
          </SectionScrollReveal>

          <SectionScrollReveal delay={80} className="lg:col-span-3">
            <p className="text-body-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Contact
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-block text-body text-raspberry transition hover:opacity-80"
            >
              {SUPPORT_EMAIL}
            </a>
          </SectionScrollReveal>

          <SectionScrollReveal delay={160} className="lg:col-span-4">
            <p className="text-body-sm font-semibold uppercase tracking-[0.14em] text-foreground">
              Resources
            </p>
            <nav className="mt-4 flex flex-col gap-2.5 text-body text-ink-muted">
              <a href="/#faq" className="w-fit transition hover:text-foreground">
                FAQ
              </a>
              <Link to="/privacy" className="w-fit transition hover:text-foreground">
                Privacy
              </Link>
              <Link to="/terms" className="w-fit transition hover:text-foreground">
                Terms
              </Link>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="w-fit transition hover:text-foreground">
                Contact
              </a>
            </nav>
            <p className="mt-8 text-body-sm text-ink-muted">
              © {new Date().getFullYear()} Olimpia. All rights reserved.
            </p>
          </SectionScrollReveal>
        </div>
      </div>
    </footer>
  );
}
