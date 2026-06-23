"use client";

import Link from "next/link";
import { useWaitlist } from "./WaitlistProvider";
import { PhoneMockup } from "./PhoneMockup";

export function Hero() {
  const { openWaitlist } = useWaitlist();

  return (
    <section className="hero hero-v1" aria-labelledby="hero-heading">
      <div className="container hero-v1-shell">
        <div className="hero-v1-copy">
          <p className="hero-v1-eyebrow">FINANCIAL FREEDOM, DESIGNED FOR WOMEN.</p>

          <h1 id="hero-heading" className="hero-v1-title">
            <span className="hero-v1-title-line">Your future deserves</span>
            <span className="hero-v1-title-line">more than a</span>
            <em className="hero-v1-emphasis">checking account.</em>
          </h1>

          <p className="hero-v1-lead">
            Save, spend, and grow your money with confidence. Earn yield with your{" "}
            <Link href="/learn/usdc" className="hero-v1-usdc">
              USDC
            </Link>
            .
          </p>

          <div className="hero-v1-actions">
            <button type="button" className="btn btn-v1-primary" onClick={openWaitlist}>
              <AppleIcon />
              Download on iOS
            </button>
            <a href="#real-life" className="btn btn-v1-secondary">
              Learn More
            </a>
          </div>

          <div className="hero-v1-social" aria-label="Social proof">
            <div className="hero-v1-avatars" aria-hidden="true">
              <span className="hero-v1-avatar hero-v1-avatar--1" />
              <span className="hero-v1-avatar hero-v1-avatar--2" />
              <span className="hero-v1-avatar hero-v1-avatar--3" />
            </div>
            <div className="hero-v1-proof-text">
              <span className="hero-v1-stars" aria-hidden="true">
                ★★★★★
              </span>
              <span className="hero-v1-rating">4.9/5</span>
              <span className="hero-v1-loved">Loved by 25,000+ women</span>
            </div>
          </div>
        </div>

        <div className="hero-v1-product" id="preview" aria-label="Product preview">
          <PhoneMockup size="hero" variant="hero" />
        </div>
      </div>
    </section>
  );
}

function AppleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
