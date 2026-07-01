import { getShaderNoiseTexture } from "@paper-design/shaders";
import { PaperTexture } from "@paper-design/shaders-react";

/** Preload the noise texture as soon as this module loads on the client. */
if (typeof window !== "undefined") {
  const noise = getShaderNoiseTexture();
  void noise?.decode?.();
}

/** Sparse sparkle positions — kept at edges so copy stays readable. */
const HERO_SPARKLES = [
  { top: "12%", left: "8%", delay: "0s", duration: "7s" },
  { top: "22%", left: "78%", delay: "1.4s", duration: "8.5s" },
  { top: "58%", left: "14%", delay: "2.8s", duration: "6.5s" },
  { top: "72%", left: "68%", delay: "0.6s", duration: "9s" },
  { top: "38%", left: "92%", delay: "3.2s", duration: "7.5s" },
  { top: "84%", left: "42%", delay: "1.8s", duration: "8s" },
  { top: "18%", left: "52%", delay: "4.1s", duration: "6s" },
  { top: "48%", left: "4%", delay: "2.2s", duration: "9.5s" },
] as const;

/** Standalone paper grain for the hero — no source image, colors only. */
export function HeroPaperBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[#F7F4F1]" />

      <PaperTexture
        className="hero-paper-texture absolute inset-0 z-[1]"
        minPixelRatio={1.5}
        image=""
        colorBack="#F7F4F1"
        colorFront="#E54B7A"
        contrast={0.3}
        roughness={0.4}
        fiber={0.3}
        fiberSize={0.2}
        crumples={0.3}
        crumpleSize={0.35}
        folds={0.65}
        foldCount={5}
        drops={0.2}
        fade={0}
        seed={5.8}
        scale={0.6}
        fit="cover"
        style={{ width: "100%", height: "100%", display: "block" }}
      />

      <div className="hero-bg-gradient-drift" />
      <div className="hero-bg-sparkles" aria-hidden>
        {HERO_SPARKLES.map((sparkle, index) => (
          <span
            key={index}
            className="hero-bg-sparkle"
            style={{
              top: sparkle.top,
              left: sparkle.left,
              animationDelay: sparkle.delay,
              animationDuration: sparkle.duration,
            }}
          />
        ))}
      </div>
    </div>
  );
}
