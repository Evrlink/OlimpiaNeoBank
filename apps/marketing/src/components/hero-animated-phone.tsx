/**
 * Hero phone from Claude Design handoff — float, cursor tilt, scroll parallax,
 * concentric arcs, cycling screens, sheen. Mockup-scale type is intentional.
 */
import { useEffect, useState, type CSSProperties } from "react";

const SCREEN_MS = 4200;
const RANGES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;

type HeroAnimatedPhoneProps = {
  rotX: number;
  rotY: number;
  scrollY: number;
  reduceMotion: boolean;
};

export function HeroAnimatedPhone({
  rotX,
  rotY,
  scrollY,
  reduceMotion,
}: HeroAnimatedPhoneProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % 3);
    }, SCREEN_MS);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const tiltStyle: CSSProperties = {
    transform: `rotateX(${5 + rotX}deg) rotateY(${-20 + rotY}deg) rotateZ(-3.5deg)`,
    transition: reduceMotion ? undefined : "transform 0.3s ease-out",
  };

  const phoneParallax: CSSProperties = {
    transform: `translateY(${scrollY * -0.05}px)`,
  };

  const arcParallax: CSSProperties = {
    transform: `translate(-50%, -50%) translateY(${scrollY * 0.03}px) rotate(-20deg)`,
  };

  return (
    <div className="hero-anim-stage font-claude-sans">
      <div className="hero-anim-arc hero-anim-arc--outer" style={arcParallax} />
      <div className="hero-anim-arc hero-anim-arc--inner" style={arcParallax} />

      <div className="relative" style={phoneParallax}>
        <div className="hero-anim-shadow" />
        <div className="hero-anim-silhouette" style={tiltStyle} />

        <div className="hero-anim-chip font-claude-sans">
          <span className="hero-anim-chip-icon" aria-hidden>
            🔔
          </span>
          <div>
            <div className="text-[10px] font-semibold text-[#2b2b2b]">Goal reached</div>
            <div className="text-[9px] font-semibold text-[#2f8f5f]">New Laptop ✓</div>
          </div>
        </div>

        <div className={reduceMotion ? undefined : "hero-anim-float"}>
          <div className="hero-anim-frame" style={tiltStyle}>
            <div className="hero-anim-screen font-claude-sans">
              <div className="hero-anim-notch" />

              <div className="flex justify-between px-4 pb-0 pt-3 text-[11px] font-semibold text-[#2b2b2b]">
                <span>9:41</span>
                <span className="flex items-center gap-[5px]" aria-hidden>
                  <span>🔊</span>
                  <span>🔋</span>
                </span>
              </div>

              <div className="flex items-center justify-between px-4 pb-1.5 pt-3">
                <p className="font-claude-display text-[15px] font-semibold tracking-[0.3px] text-[#7a2b3a]">
                  Olimpia
                </p>
                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#f3e6e8] text-[11px]">
                  🔔
                </div>
              </div>

              <div className="relative h-[326px]">
                <div
                  className="absolute inset-0 px-4 transition-opacity duration-[600ms] ease-out"
                  style={{
                    opacity: activeIndex === 0 ? 1 : 0,
                    pointerEvents: activeIndex === 0 ? "auto" : "none",
                  }}
                >
                  <BalanceScreen />
                </div>
                <div
                  className="absolute inset-0 px-4 pt-1 transition-opacity duration-[600ms] ease-out"
                  style={{
                    opacity: activeIndex === 1 ? 1 : 0,
                    pointerEvents: activeIndex === 1 ? "auto" : "none",
                  }}
                >
                  <ChartScreen />
                </div>
                <div
                  className="absolute inset-0 px-4 pt-2.5 text-center transition-opacity duration-[600ms] ease-out"
                  style={{
                    opacity: activeIndex === 2 ? 1 : 0,
                    pointerEvents: activeIndex === 2 ? "auto" : "none",
                  }}
                >
                  <GoalScreen />
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-[#f2eae7] bg-white px-2 pb-3.5 pt-2.5">
                <span className="text-[15px] text-[#7a2b3a]" aria-hidden>
                  ⌂
                </span>
                <span className="text-[15px] text-[#c7a8ae]" aria-hidden>
                  💳
                </span>
                <span className="hero-anim-plus" aria-hidden>
                  +
                </span>
                <span className="text-[15px] text-[#c7a8ae]" aria-hidden>
                  📈
                </span>
                <span className="text-[15px] text-[#c7a8ae]" aria-hidden>
                  👤
                </span>
              </div>

              {!reduceMotion && (
                <div className="hero-anim-sheen" aria-hidden>
                  <div className="hero-anim-sheen-band" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceScreen() {
  return (
    <>
      <div className="mb-3.5 rounded-2xl bg-[#f6e9eb] px-4 py-4 text-center">
        <div className="mb-1.5 text-[11px] font-semibold text-[#8a5560]">Positive Balance</div>
        <div className="mb-3 text-2xl font-extrabold text-[#2f8f5f]">+$2,670.00</div>
        <button
          type="button"
          tabIndex={-1}
          className="rounded-[20px] bg-[#7a2b3a] px-4 py-2 text-[11px] font-bold text-[#fdf3f4]"
        >
          + Add Balance
        </button>
      </div>
      <div className="mb-2.5 text-xs font-bold text-[#2b2b2b]">Balance</div>
      <div className="relative">
        <svg width="100%" height="52" viewBox="0 0 280 70" className="block" aria-hidden>
          <path
            d="M0,45 Q30,10 60,35 T120,25 T180,50 T240,15 T280,30"
            stroke="#b8425a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute -top-1 right-0 flex items-center gap-1 rounded-[10px] border border-[#f0dde0] bg-white px-2 py-1 text-[9px] shadow-[0_8px_18px_rgba(0,0,0,0.08)]">
          <span aria-hidden>🍑</span>
          <span className="font-extrabold text-[#2f8f5f]">+4.2%</span>
          <span className="text-[#6b6b6b]">yield</span>
        </div>
      </div>
      <div className="mt-6 flex gap-2.5 text-[9px] font-bold text-[#9a9a9a]">
        {RANGES.map((range, i) => (
          <span key={range} className={i === 0 ? "text-[#2b2b2b]" : undefined}>
            {range}
          </span>
        ))}
      </div>
    </>
  );
}

function ChartScreen() {
  return (
    <>
      <div className="mb-1 text-[11px] font-semibold text-[#8a5560]">Savings Growth</div>
      <div className="mb-3 text-[22px] font-extrabold text-[#2b2b2b]">$3,140.55</div>
      <svg width="100%" height="118" viewBox="0 0 280 160" className="block" aria-hidden>
        <path
          d="M0,140 L0,110 Q40,90 70,95 T140,60 T210,70 T280,20 L280,140 Z"
          fill="rgba(184,66,90,0.14)"
        />
        <path
          d="M0,110 Q40,90 70,95 T140,60 T210,70 T280,20"
          stroke="#7a2b3a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-3.5 flex items-center justify-between rounded-xl bg-[#f6e9eb] p-3">
        <div>
          <div className="text-[10px] font-semibold text-[#8a5560]">Yield this month</div>
          <div className="text-[15px] font-extrabold text-[#2f8f5f]">+$220.00</div>
        </div>
        <div className="rounded-2xl bg-[#2f8f5f] px-2.5 py-1 text-[10px] font-extrabold text-white">
          +4.2%
        </div>
      </div>
    </>
  );
}

function GoalScreen() {
  return (
    <>
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f6e9eb] text-xl">
        🎉
      </div>
      <div className="mb-1 text-sm font-extrabold text-[#2b2b2b]">Goal reached!</div>
      <div className="mb-4 text-[11px] text-[#6b6b6b]">
        Your &quot;New Laptop&quot; savings goal is fully funded.
      </div>
      <div className="rounded-[14px] bg-[#f6e9eb] p-3 text-left">
        <div className="mb-2 flex justify-between text-[11px] font-bold text-[#2b2b2b]">
          <span>New Laptop</span>
          <span>$1,200 / $1,200</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-md bg-[#e3c6cb]">
          <div className="h-full w-full rounded-md bg-[#2f8f5f]" />
        </div>
      </div>
    </>
  );
}
