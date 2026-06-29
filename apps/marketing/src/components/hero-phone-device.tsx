import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const BASE_ROTATE_Y = -16;
const MAX_ROTATE_X = 5.5;
const MAX_ROTATE_Y = 4;
const PERSPECTIVE = 1400;
const LERP = 0.09;

function softAxis(value: number) {
  const clamped = Math.max(-1, Math.min(1, value));
  return Math.tanh(clamped * 1.15);
}

export function HeroPhoneDevice({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const frame = useRef(0);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!finePointer || !desktop || reduceMotion) {
      setInteractive(false);
      return;
    }

    setInteractive(true);

    const applyTransform = () => {
      current.current.x += (target.current.x - current.current.x) * LERP;
      current.current.y += (target.current.y - current.current.y) * LERP;

      el.style.transform = `perspective(${PERSPECTIVE}px) rotateX(${current.current.x.toFixed(3)}deg) rotateY(${(BASE_ROTATE_Y + current.current.y).toFixed(3)}deg)`;
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

/** Count-up for hero phone balance — static when reduced motion. */
export function useHeroPhoneBalanceCount(enabled: boolean) {
  const [value, setValue] = useState(4120);

  useEffect(() => {
    if (!enabled) {
      setValue(4280);
      return;
    }

    const start = 4120;
    const end = 4280;
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
  }, [enabled]);

  return value;
}
