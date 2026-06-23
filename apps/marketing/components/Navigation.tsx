"use client";

import Link from "next/link";
import { useState } from "react";
import { useWaitlist } from "./WaitlistProvider";

const NAV_LINKS = [
  { href: "/#real-life", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pia", label: "Pia" },
  { href: "/#mission", label: "About" },
  { href: "/#faq", label: "FAQ" },
];

export function Navigation() {
  const { openWaitlist } = useWaitlist();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="nav-header nav-v1">
      <div className="container nav-v1-inner">
        <Link href="/" className="nav-v1-logo" aria-label="Olimpia home">
          Olimpia
        </Link>

        <nav className="nav-v1-desktop" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-v1-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav-v1-cta-wrap">
          <button type="button" className="btn btn-primary nav-v1-cta" onClick={openWaitlist}>
            Download App
          </button>
        </div>

        <button
          type="button"
          className="nav-toggle nav-v1-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {menuOpen && (
        <nav id="mobile-menu" className="nav-mobile nav-v1-mobile" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="nav-v1-link"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setMenuOpen(false);
              openWaitlist();
            }}
          >
            Download App
          </button>
        </nav>
      )}
    </header>
  );
}
