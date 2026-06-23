"use client";

import { useWaitlist } from "./WaitlistProvider";

export function PiaSection() {
  const { openWaitlist } = useWaitlist();

  return (
    <section id="pia" className="pia-v1-section" aria-labelledby="pia-heading">
      <div className="container pia-v1-shell">
        <div className="pia-v1-visual">
          <div className="pia-v1-avatar-card">
            <div className="pia-v1-avatar" aria-hidden="true">
              <svg viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="70" cy="138" rx="42" ry="11" fill="#EDE4DF" />
                <path
                  d="M38 112c0-20 14-36 32-36s32 16 32 36v28H38v-28z"
                  fill="#F0C9BC"
                />
                <circle cx="70" cy="58" r="30" fill="#F0C9BC" />
                <path
                  d="M38 52c5-20 20-30 32-30s27 10 32 30"
                  fill="#7A4E3A"
                />
                <circle cx="58" cy="60" r="3.5" fill="#333" />
                <circle cx="82" cy="60" r="3.5" fill="#333" />
                <path
                  d="M54 72c5 5 14 5 18 0"
                  stroke="#C98878"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <ellipse cx="70" cy="68" rx="4" ry="2.5" fill="#E8A898" opacity="0.5" />
              </svg>
            </div>
            <span className="pia-v1-badge">
              <span className="pia-v1-badge-dot" aria-hidden="true" />
              <span>
                Pia
                <span className="pia-v1-badge-sub">Your Money Bestie</span>
              </span>
            </span>
          </div>
        </div>

        <div className="pia-v1-copy">
          <h2 id="pia-heading" className="pia-v1-title">
            <span className="pia-v1-title-line">Meet Pia, your</span>
            <span className="pia-v1-title-line">money bestie.</span>
          </h2>
          <p className="pia-v1-lead">
            Pia is here to guide, support, and cheer you on—every step of the way.
          </p>
          <button type="button" className="btn btn-v1-primary" onClick={openWaitlist}>
            Chat with Pia
          </button>
        </div>

        <div
          className="pia-v1-chat"
          role="img"
          aria-label="Static preview of Pia chat in the Olimpia app"
        >
          <div className="pia-v1-chat-header">
            <span className="pia-v1-chat-avatar" aria-hidden="true">
              P
            </span>
            <span className="pia-v1-chat-name">Pia</span>
            <span className="pia-v1-chat-menu" aria-hidden="true">
              ⋮
            </span>
          </div>
          <div className="pia-v1-bubble pia-v1-bubble--pia">
            Hi Sarah! ☀️ What can I help you with today?
          </div>
          <div className="pia-v1-bubble pia-v1-bubble--user">
            How can I start saving for a trip?
          </div>
        </div>
      </div>
    </section>
  );
}
