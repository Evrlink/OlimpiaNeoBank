/**
 * Claude Design hero wash — solid rose base + drifting radial gradients.
 * Replaces the paper-shader hero background for the handoff rebuild.
 */
export function HeroDesignBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[#FBDDE6]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 55% 48% at 28% 38%, rgba(229,75,122,0.22), transparent 72%)",
            "radial-gradient(ellipse 50% 42% at 72% 62%, rgba(252,238,242,0.5), transparent 68%)",
            "radial-gradient(ellipse 40% 35% at 55% 18%, rgba(229,75,122,0.16), transparent 70%)",
          ].join(", "),
        }}
      />
      <div className="hero-bg-gradient-drift" />
    </div>
  );
}
