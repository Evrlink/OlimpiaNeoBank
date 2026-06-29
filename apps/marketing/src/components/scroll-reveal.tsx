import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay in milliseconds */
  delay?: number;
  /** Slightly stronger motion for main content sections */
  emphasis?: boolean;
};

export function ScrollReveal({ children, className, delay = 0, emphasis = false }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: emphasis ? 0.14 : 0.08,
        // Negative bottom margin: animate as the block enters the viewport, not before.
        rootMargin: emphasis ? "0px 0px -10% 0px" : "0px 0px 12% 0px",
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [emphasis]);

  return (
    <div
      ref={ref}
      className={cn("scroll-reveal", emphasis && "scroll-reveal--emphasis", visible && "is-visible", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
