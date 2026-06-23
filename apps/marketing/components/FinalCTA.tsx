"use client";

import { SITE } from "@/lib/content";
import { useWaitlist } from "./WaitlistProvider";

export function FinalCTA() {
  const { openWaitlist } = useWaitlist();

  return (
    <section className="section final-cta" aria-labelledby="final-cta-heading">
      <div className="container final-inner">
        <h2 id="final-cta-heading" className="section-title">
          Ready for more choices?
        </h2>
        <p className="final-tagline">{SITE.tagline}</p>
        <div className="final-actions">
          <button type="button" className="btn btn-primary" onClick={openWaitlist}>
            Download the App
          </button>
          <button type="button" className="btn btn-secondary" onClick={openWaitlist}>
            Join Waitlist
          </button>
        </div>
      </div>
    </section>
  );
}
