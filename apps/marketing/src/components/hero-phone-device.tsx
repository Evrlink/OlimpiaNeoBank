import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_ROTATE_X = 5.5;
const MAX_ROTATE_Y = 4;
const PERSPECTIVE = 1400;
const LERP = 0.09;

function softAxis(value: number) {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.tanh(clamped * 1.15);
}

function presentationBase() {
  const large = typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
  return {
    rotateY: large ? -13 : -12,
    rotateZ: large ? 9 : 8,
    scale: large ? 0.9 : 0.88,
  };
}

/**
 * Hero iPhone presentation wrapper — mouse parallax on desktop,
 * CSS idle sway when not interactive.
 */
export function HeroPhoneDevice({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const base = useRef(presentationBase());
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const largeQuery = window.matchMedia("(min-width: 1024px)");

    const syncBase = () => {
      base.current = presentationBase();
    };
    syncBase();
    largeQuery.addEventListener("change", syncBase);

    if (!finePointer || !desktop || reduceMotion) {
      setInteractive(false);
      return () => largeQuery.removeEventListener("change", syncBase);
    }

    setInteractive(true);

    const applyTransform = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;
      const { rotateY, rotateZ, scale } = base.current;

      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${current.current.x.toFixed(3)}deg) rotateY(${(rotateY + current.current.y).toFixed(3)}deg) rotate(${rotateZ}deg) scale(${scale})`;
      frame.current = requestAnimationFrame(applyTransform);
    };

    frame.current = requestAnimationFrame(applyTransform);

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const nx = (event.clientX - centerX) / (rect.width * 0.62);
      const ny = (event.clientY - centerY) / (rect.height * 0.62);

      target.current = {
        x: -softAxis(ny) * MAX_ROTATE_X,
        y: softAxis(nx) * MAX_ROTATE_Y,
      };
    };

    const onLeave = () => {
      target.current = { x: 0, y: 0 };
    };

    const surface = el.closest(".hero-phone-wrap") ?? el;
    surface.addEventListener("mousemove", onMove);
    surface.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(frame.current);
      surface.removeEventListener("mousemove", onMove);
      surface.removeEventListener("mouseleave", onLeave);
      largeQuery.removeEventListener("change", syncBase);
      el.style.transform = "";
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn("hero-phone-device", interactive && "hero-phone-device--interactive")}
    >
      {children}
    </div>
  );
}

/** Count-up for hero phone balance — static when reduced motion / disabled. */
export function useHeroPhoneBalanceCount(
  enabled: boolean,
  start = 2450,
  end = 2670,
) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    const duration = 1600;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setValue(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [enabled, start, end]);

  return value;
}
