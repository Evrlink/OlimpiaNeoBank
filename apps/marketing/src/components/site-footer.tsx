import { Link } from "@tanstack/react-router";
import { SUPPORT_EMAIL } from "@/lib/seo";

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-border/60 bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
        <Link to="/" className="font-display text-h3 tracking-tight text-raspberry">
          Olimpia
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-body-sm text-ink-muted">
          <a href="/#about" className="transition hover:text-foreground">
            About
          </a>
          <a href="/#faq" className="transition hover:text-foreground">
            FAQ
          </a>
          <Link to="/privacy" className="transition hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="transition hover:text-foreground">
            Terms
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="transition hover:text-foreground">
            Contact
          </a>
        </nav>
        <p className="text-body-sm text-ink-muted">
          © {new Date().getFullYear()} Olimpia. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
