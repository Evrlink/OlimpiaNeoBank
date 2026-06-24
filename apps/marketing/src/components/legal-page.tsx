import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link to="/" className="font-display text-h3 tracking-tight text-raspberry">
            Olimpia
          </Link>
          <Link to="/" className="text-body-sm text-ink-muted transition hover:text-foreground">
            ← Home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-24">
        <h1 className="text-h1 font-semibold text-foreground md:text-display-md">{title}</h1>
        <div className="mt-10 space-y-6 text-body text-ink-muted">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}
