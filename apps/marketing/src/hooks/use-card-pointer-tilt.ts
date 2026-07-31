import { useEffect, useState, type CSSProperties, type MouseEvent } from "react";

export type CardPointerTilt = {
  rotX: number;
  rotY: number;
  mx: number;
  my: number;
};

type Options = {
  /** Max tilt in degrees from center. Default 10. */
  intensity?: number;
};

/**
 * Shared mouse-tilt + spotlight for marketing cards (How It Works, Features, etc.).
 * Respects prefers-reduced-motion.
 */
export function useCardPointerTilt(options: Options = {}) {
  const intensity = options.intensity ?? 10;
  const [hover, setHover] = useState<Record<number | string, CardPointerTilt | null>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleMove = (key: number | string, e: MouseEvent<HTMLElement>) => {
    if (reduceMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setHover((s) => ({
      ...s,
      [key]: {
        rotX: -(py - 0.5) * intensity,
        rotY: (px - 0.5) * intensity,
        mx: px * 100,
        my: py * 100,
      },
    }));
  };

  const handleLeave = (key: number | string) => {
    setHover((s) => ({ ...s, [key]: null }));
  };

  const getTiltStyle = (key: number | string): CSSProperties => {
    const h = hover[key];
    return {
      transform: h
        ? `rotateX(${h.rotX}deg) rotateY(${h.rotY}deg)`
        : "rotateX(0deg) rotateY(0deg)",
      boxShadow: h
        ? "0 28px 52px -18px rgba(90,30,40,0.28)"
        : "0 10px 24px -16px rgba(90,30,40,0.1)",
    };
  };

  const getSpotlightStyle = (key: number | string): CSSProperties => {
    const h = hover[key];
    return h
      ? {
          opacity: 1,
          background: `radial-gradient(circle at ${h.mx}% ${h.my}%, rgba(229,75,122,0.1), transparent 55%)`,
        }
      : { opacity: 0 };
  };

  return {
    reduceMotion,
    handleMove,
    handleLeave,
    getTiltStyle,
    getSpotlightStyle,
    isActive: (key: number | string) => !!hover[key],
  };
}
